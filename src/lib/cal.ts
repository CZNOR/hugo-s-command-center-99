// Réservations Cal.com (via /api/cal/bookings, la clé reste sur le serveur)
import { apiFetch } from "./api";

export { TZ, type Call } from "./booking.js";
import { toCall, type Call } from "./booking.js";
import { TZ } from "./tz.js";

async function fetchCalls(status: "upcoming" | "past" | "cancelled", limit: number): Promise<Call[]> {
  const res = await apiFetch(`/api/cal/bookings?status=${status}&limit=${limit}`);
  if (!res.ok) throw new Error(`Cal ${res.status}`);
  const json = await res.json();
  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  return (status === "cancelled" ? data : data.filter((b) => b.status !== "cancelled" && b.status !== "rejected")).map(toCall);
}

export async function fetchUpcomingCalls(): Promise<Call[]> {
  const now = Date.now();
  return (await fetchCalls("upcoming", 50))
    .filter((c) => c.end.getTime() > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

// Appels passés, les plus récents d'abord (après l'appel + historique par prospect)
export async function fetchPastCalls(): Promise<Call[]> {
  return (await fetchCalls("past", 150)).sort((a, b) => b.start.getTime() - a.start.getTime());
}

// Réservations annulées : pour repérer qui a déjà annulé
export const fetchCancelledCalls = () => fetchCalls("cancelled", 100);

// ── Formats en heure de Paris ─────────────────────────────────
export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

const dayKey = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: TZ });

export function fmtDay(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (dayKey(d) === dayKey(today)) return "Aujourd'hui";
  if (dayKey(d) === dayKey(tomorrow)) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
}

// Version courte pour la colonne étroite de la liste « Ensuite »
export function fmtDayShort(d: Date): string {
  const long = fmtDay(d);
  if (long === "Aujourd'hui") return "Auj.";
  if (long === "Demain") return long;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", timeZone: TZ });
}

export function fmtCountdown(d: Date, now = Date.now()): string {
  const min = Math.round((d.getTime() - now) / 60_000);
  if (min <= 0) return "en cours";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `dans ${h} h ${String(min % 60).padStart(2, "0")}`;
  return `dans ${Math.round(h / 24)} j`;
}

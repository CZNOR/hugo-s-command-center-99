// Réservations Cal.com (via /api/cal/bookings, la clé reste sur le serveur)
import { apiFetch } from "./api";

export const TZ = "Europe/Paris";

export interface Call {
  id: number;
  start: Date;
  end: Date;
  name: string;
  email: string;
  phone?: string;
  meetingUrl?: string;
  status: string;
  answers: { label: string; value: string }[];
}

// Réponses du questionnaire « Appel Coaching & Académie », dans l'ordre utile en appel
const FIELDS: [string, string][] = [
  ["budget", "Budget"],
  ["situation-actuelle", "Situation"],
  ["connaissance-ecom", "Niveau"],
  ["temps-disponible", "Temps dispo"],
  ["niveau", "Niveau"],
  ["objectif-principal", "Objectif"],
  ["blocage-principal", "Blocage"],
  ["projet-vision", "Projet"],
];

function pick(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(pick).filter(Boolean).join(", ");
  if (typeof v === "object" && "value" in v) return pick(v.value);
  return "";
}

export async function fetchUpcomingCalls(): Promise<Call[]> {
  const res = await apiFetch("/api/cal/bookings?status=upcoming&limit=50");
  if (!res.ok) throw new Error(`Cal ${res.status}`);
  const json = await res.json();
  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  const now = Date.now();
  return data
    .filter((b) => b.status !== "cancelled" && b.status !== "rejected")
    .map((b): Call => {
      const r = b.bookingFieldsResponses ?? {};
      const seen = new Set<string>();
      const answers = FIELDS.flatMap(([key, label]) => {
        const value = pick(r[key]);
        if (!value || seen.has(label)) return [];
        seen.add(label);
        return [{ label, value }];
      });
      const url = b.meetingUrl || (String(b.location ?? "").startsWith("http") ? b.location : undefined);
      return {
        id: b.id,
        start: new Date(b.start),
        end: new Date(b.end),
        name: b.attendees?.[0]?.name || pick(r.name) || "Inconnu",
        email: b.attendees?.[0]?.email || "",
        phone: b.attendees?.[0]?.phoneNumber || pick(r.attendeePhoneNumber) || undefined,
        meetingUrl: url,
        status: b.status,
        answers,
      };
    })
    .filter((c) => c.end.getTime() > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

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

export function fmtCountdown(d: Date, now = Date.now()): string {
  const min = Math.round((d.getTime() - now) / 60_000);
  if (min <= 0) return "en cours";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `dans ${h} h ${String(min % 60).padStart(2, "0")}`;
  return `dans ${Math.round(h / 24)} j`;
}

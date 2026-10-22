// Réservation Cal → appel, sans dépendance au navigateur : partagé par l'app et le serveur
// (api/relances.ts). Imports en « .js » pour le serveur Node (ESM).
import { TZ } from "./tz.js";

export { TZ };

export interface Call {
  id: number;
  start: Date;
  end: Date;
  name: string;
  email: string;
  phone?: string;
  meetingUrl?: string;
  status: string;
  createdAt?: Date;
  raw: Record<string, string>; // réponses brutes du formulaire, par identifiant
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

export function toCall(b: any): Call {
  const r = b.bookingFieldsResponses ?? {};
  const seen = new Set<string>();
  const answers = FIELDS.flatMap(([key, label]) => {
    const value = pick(r[key]);
    if (!value || seen.has(label)) return [];
    seen.add(label);
    return [{ label, value }];
  });
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) raw[k] = pick(v);
  const url = b.meetingUrl || (String(b.location ?? "").startsWith("http") ? b.location : undefined);
  return {
    id: b.id,
    start: new Date(b.start),
    end: new Date(b.end),
    name: b.attendees?.[0]?.name || pick(r.name) || "Inconnu",
    email: b.attendees?.[0]?.email || pick(r.email) || "",
    phone: b.attendees?.[0]?.phoneNumber || pick(r.attendeePhoneNumber) || undefined,
    meetingUrl: url,
    status: b.status,
    createdAt: b.createdAt ? new Date(b.createdAt) : undefined,
    raw,
    answers,
  };
}


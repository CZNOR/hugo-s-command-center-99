// api/cal/bookings.ts — Lecture des réservations Cal.com côté serveur
// L'app appelle /api/cal/bookings?status=upcoming&limit=50 ; la clé Cal
// ne quitte jamais le serveur.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { calHeaders, hasAccess, grantDevice } from "../_lib/server.js";

const STATUSES = new Set(["upcoming", "past", "cancelled", "unconfirmed", "recurring"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);

  const status = String(req.query.status ?? "upcoming");
  if (!STATUSES.has(status)) return res.status(400).json({ error: "bad status" });
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 250);

  // Appels passés : les plus récents d'abord (fiche « après l'appel », nombre d'appels déjà pris)
  const sort = status === "past" ? "&sortStart=desc" : "";
  const r = await fetch(`https://api.cal.com/v2/bookings?status=${status}&limit=${limit}${sort}`, {
    headers: calHeaders,
  });
  res.setHeader("Cache-Control", "no-store");
  // Un refus de Cal (clé invalide) ne doit pas passer pour un mauvais code d'accès :
  // l'app redemanderait le code. On le renvoie en 502.
  if (!r.ok) return res.status(502).json({ error: `Cal ${r.status}` });
  return res.status(200).json(await r.json().catch(() => ({})));
}

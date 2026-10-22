// api/cal/bookings.ts — Lecture des réservations Cal.com côté serveur
// L'app appelle /api/cal/bookings?status=upcoming&limit=50 ; la clé Cal
// ne quitte jamais le serveur.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { calHeaders, hasAccess } from "../_lib/server.js";

const STATUSES = new Set(["upcoming", "past", "cancelled", "unconfirmed", "recurring"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).end();
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });

  const status = String(req.query.status ?? "upcoming");
  if (!STATUSES.has(status)) return res.status(400).json({ error: "bad status" });
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 250);

  const r = await fetch(`https://api.cal.com/v2/bookings?status=${status}&limit=${limit}`, {
    headers: calHeaders,
  });
  res.setHeader("Cache-Control", "no-store");
  return res.status(r.status).json(await r.json().catch(() => ({})));
}

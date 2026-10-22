// api/db.ts — Passerelle vers Supabase pour l'app (clé serveur, jamais dans le navigateur)
//
// La base a le RLS activé sans accès anonyme : le navigateur passe par ici,
// avec son code d'accès. Appel : /api/db?p=<chemin REST encodé>,
// ex. p=task_meta?notion_id=eq.__tasks_v2__&limit=1
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, sbHeaders, hasAccess } from "./_lib/server.js";

// Tables lisibles par l'app (push_subscriptions reste réservée au serveur)
const TABLES = new Set([
  "task_meta", "finance_entries", "monthly_objectives",
  "casino_stats", "daily_rituals", "social_stats",
]);
const METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!METHODS.has(req.method ?? "")) return res.status(405).end();
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });

  const path  = String(req.query.p ?? "");
  const table = path.split(/[?/]/)[0];
  if (!TABLES.has(table)) return res.status(400).json({ error: "table non autorisée" });

  const headers: Record<string, string> = sbHeaders({ "Content-Type": "application/json" });
  if (req.headers.prefer) headers.Prefer = String(req.headers.prefer);

  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "DELETE" ? undefined
      : typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}),
  });
  res.setHeader("Cache-Control", "no-store");
  res.status(r.status).send(await r.text());
}

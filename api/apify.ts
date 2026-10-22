// api/apify.ts — Relais Apify : le jeton reste côté serveur (APIFY_TOKEN).
// Appel : /api/apify?p=<chemin Apify encodé>, ex. p=actor-runs/abc
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess } from "./_lib/server.js";

// Seuls les chemins utilisés par l'app passent
const ALLOWED = /^(acts\/[\w~.-]+\/runs|actor-runs\/\w+|datasets\/\w+\/items)$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });

  const path = String(req.query.p ?? "");
  if (!ALLOWED.test(path)) return res.status(400).json({ error: "chemin non autorisé" });

  const url = new URL(`https://api.apify.com/v2/${path}`);
  url.searchParams.set("token", process.env.APIFY_TOKEN || "");
  if (req.query.limit) url.searchParams.set("limit", String(req.query.limit));

  const r = await fetch(url, {
    method: req.method,
    headers: { "Content-Type": "application/json" },
    body: req.method === "POST"
      ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}))
      : undefined,
  });
  res.status(r.status).send(await r.text());
}

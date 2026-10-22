// api/point.ts — Point du jour (POINT-DU-JOUR.md) pour l'onglet « Point »
//   GET  → { markdown, updatedAt }
//   POST { markdown } → enregistre (envoyé par tools/publish_point.py après chaque point)
// Stocké dans task_meta (ligne __point_du_jour__), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, sbHeaders, hasAccess, grantDevice } from "./_lib/server.js";

const ROW = "__point_du_jour__";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.${ROW}&select=completed_at,updated_at&limit=1`, {
      headers: sbHeaders(),
    });
    const rows: any[] = await r.json().catch(() => []);
    return res.status(200).json({
      markdown:  rows?.[0]?.completed_at ?? "",
      updatedAt: rows?.[0]?.updated_at ?? null,
    });
  }

  if (req.method === "POST") {
    const body: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const markdown = String(body.markdown ?? "");
    if (!markdown.trim() || markdown.length > 100_000) return res.status(400).json({ error: "markdown vide ou trop long" });
    const r = await fetch(`${SB_URL}/rest/v1/task_meta`, {
      method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({
        notion_id: ROW, business: "__snapshot__", priority: "normale", time: null,
        completed_at: markdown, updated_at: new Date().toISOString(),
      }),
    });
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
  }

  return res.status(405).end();
}

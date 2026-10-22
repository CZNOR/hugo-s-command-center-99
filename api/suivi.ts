// api/suivi.ts — Avancement en direct des sessions et des projets (onglet « Point »)
//   GET  → le dernier suivi.json
//   POST → enregistre (envoyé chaque minute par tools/publish_suivi.py depuis le Mac)
// Stocké dans task_meta (ligne __suivi__), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, sbHeaders, hasAccess, grantDevice } from "./_lib/server.js";

const ROW = "__suivi__";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.${ROW}&select=completed_at&limit=1`, {
      headers: sbHeaders(),
    });
    const rows: any[] = await r.json().catch(() => []);
    let suivi = null;
    try { suivi = JSON.parse(rows?.[0]?.completed_at ?? "null"); } catch { /* ligne absente */ }
    return res.status(200).json(suivi ?? {});
  }

  if (req.method === "POST") {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
    if (raw.length > 50_000) return res.status(400).json({ error: "suivi trop long" });
    const r = await fetch(`${SB_URL}/rest/v1/task_meta`, {
      method: "POST",
      headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({
        notion_id: ROW, business: "__snapshot__", priority: "normale", time: null,
        completed_at: raw, updated_at: new Date().toISOString(),
      }),
    });
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
  }

  return res.status(405).end();
}

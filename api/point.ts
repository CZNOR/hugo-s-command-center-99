// api/point.ts — Point du jour (POINT-DU-JOUR.md) pour l'onglet « Point »
//   GET  → { markdown, updatedAt }
//   POST { markdown } → enregistre (envoyé par tools/publish_point.py après chaque point)
// Stocké dans task_meta (ligne __point_du_jour__), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, APP_TZ, sbHeaders, hasAccess, grantDevice } from "./_lib/server.js";
import { metaGet, metaSet, pushAll } from "./_lib/push.js";

const ROW = "__point_du_jour__";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.${ROW}&select=completed_at,updated_at&limit=1`, {
      headers: sbHeaders(), signal: AbortSignal.timeout(9000),
    }).catch(() => null);
    if (!r?.ok) return res.status(503).json({ error: "base Supabase injoignable", markdown: "", updatedAt: null });
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
      signal: AbortSignal.timeout(9000),
    }).catch(() => null);
    // Base injoignable (panne Supabase) : réponse claire en moins de 10 s au lieu d'un délai dépassé
    if (!r) return res.status(503).json({ ok: false, error: "base Supabase injoignable, réessaie plus tard" });
    // Notif silencieuse « point du jour prêt » : une seule par jour, au point du matin (heure de Paris)
    let notifie = false;
    if (r.ok) {
      const jour = new Date().toLocaleDateString("fr-CA", { timeZone: APP_TZ });
      const heure = Number(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", hour12: false, timeZone: APP_TZ }).slice(0, 2));
      const deja = await metaGet<string>("__point_notif__");
      // Seulement le point du matin (5 h - 13 h) : pas de notif pour la mise à jour du soir
      if (deja !== jour && heure >= 5 && heure < 13) {
        await pushAll({ title: "Ton point du jour est prêt", body: "Ouvre Dring pour le lire.", tag: `point-${jour}`, url: "/#point", silent: true });
        await metaSet("__point_notif__", jour);
        notifie = true;
      }
    }
    return res.status(r.ok ? 200 : 500).json({ ok: r.ok, notifie });
  }

  return res.status(405).end();
}

// api/prospect.ts — Fiche prospect : source captée par le webhook Cal + suivi après l'appel
//   GET  ?ids=12,34        → { "12": { source, suivi, historique }, … }
//   POST { id, venu?, resultat?, note? } → enregistre le suivi et l'ajoute à l'historique
// Une ligne task_meta par réservation (prospect:<id>), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess, grantDevice } from "./_lib/server.js";
import { metaGet, metaSet } from "./_lib/push.js";

const VENU = new Set(["venu", "absent"]);
const RESULTATS = new Set(["interesse", "relancer", "pas-interesse", "signe"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const ids = String(req.query.ids ?? "").split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 60);
    const out: Record<string, unknown> = {};
    await Promise.all(ids.map(async (id) => {
      const fiche = await metaGet(`prospect:${id}`);
      if (fiche) out[id] = fiche;
    }));
    return res.status(200).json(out);
  }

  if (req.method === "POST") {
    const b: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
    const id = Number(b.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "id manquant" });
    const fiche: any = (await metaGet(`prospect:${id}`)) ?? {};
    const suivi = { ...(fiche.suivi ?? {}) };
    if (VENU.has(b.venu)) suivi.venu = b.venu;
    if (RESULTATS.has(b.resultat)) suivi.resultat = b.resultat;
    if (typeof b.note === "string") suivi.note = b.note.slice(0, 2000);
    suivi.maj = new Date().toISOString();
    // Historique pour le futur tableau des ventes : une entrée par changement de statut
    const historique = [...(fiche.historique ?? [])];
    if (b.venu || b.resultat) historique.push({ quand: suivi.maj, venu: suivi.venu ?? null, resultat: suivi.resultat ?? null });
    const ok = await metaSet(`prospect:${id}`, { ...fiche, suivi, historique: historique.slice(-50) });
    return res.status(ok ? 200 : 500).json({ ok, suivi, historique });
  }

  return res.status(405).end();
}

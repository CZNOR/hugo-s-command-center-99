// api/prospect.ts — Fiche prospect : source captée par le webhook Cal + suivi après l'appel
//   GET  ?ids=12,34        → { "12": { source, suivi, historique }, … }
//   POST { id, venu?, resultat?, produit?, modalite?, frein?, rappel?, envoyes?, note? }
//        → enregistre le suivi et ajoute les changements de statut à l'historique
// Une ligne task_meta par réservation (prospect:<id>), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess, grantDevice } from "./_lib/server.js";
import { metaGet, metaSet } from "./_lib/push.js";

const VENU = new Set(["venu", "absent"]);
const RESULTATS = new Set(["interesse", "relancer", "pas-interesse", "signe"]);
const PRODUITS = new Set(["academie", "coaching", "suivi"]);
const MODALITES = new Set(["1fois", "3fois", "echeances"]);
const FREINS = new Set(["prix", "temps", "entourage", "reflechir", "moment", "confiance", "autre"]);

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
    if (PRODUITS.has(b.produit)) suivi.produit = b.produit;
    if (MODALITES.has(b.modalite)) suivi.modalite = b.modalite;
    if (FREINS.has(b.frein)) suivi.frein = b.frein;
    if (b.frein === null) delete suivi.frein;
    if (typeof b.rappel === "string") suivi.rappel = /^\d{4}-\d{2}-\d{2}$/.test(b.rappel) ? b.rappel : undefined;
    if (Array.isArray(b.envoyes)) suivi.envoyes = b.envoyes.filter((x: unknown) => typeof x === "string").slice(0, 20).map((x: string) => x.slice(0, 30));
    if (typeof b.note === "string") suivi.note = b.note.slice(0, 2000);
    suivi.maj = new Date().toISOString();
    // Historique pour le futur tableau des ventes : une entrée par changement de statut
    const historique = [...(fiche.historique ?? [])];
    const avant = fiche.suivi ?? {};
    if (suivi.venu !== avant.venu || suivi.resultat !== avant.resultat || suivi.produit !== avant.produit) {
      historique.push({ quand: suivi.maj, venu: suivi.venu ?? null, resultat: suivi.resultat ?? null, produit: suivi.produit ?? null });
    }
    const ok = await metaSet(`prospect:${id}`, { ...fiche, suivi, historique: historique.slice(-50) });
    return res.status(ok ? 200 : 500).json({ ok, suivi, historique });
  }

  return res.status(405).end();
}

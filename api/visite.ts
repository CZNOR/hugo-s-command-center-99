// api/visite.ts — Visites du site hugo-bnls.fr, pour la fiche prospect (sans Umami payant)
//   POST (public, depuis le site, au clic sur « Réserver ») → garde un résumé anonyme de la visite
//   GET  (code d'accès)                                     → les 300 dernières visites
// Dring rattache ensuite une visite à une réservation Cal par l'heure (clic puis réservation).
// Aucune donnée personnelle : pages, lecture, durée, provenance, appareil.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess, grantDevice } from "./_lib/server.js";
import { metaGet, metaSet } from "./_lib/push.js";

const KEY = "__visites__";
const MAX = 300;

const txt = (v: unknown, n = 80) => (typeof v === "string" ? v.slice(0, n) : "");
const num = (v: unknown, max = 1e6) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : 0);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "https://hugo-bnls.fr");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "POST") {
    let b: any = req.body;
    try { if (typeof b === "string") b = JSON.parse(b); } catch { return res.status(400).end(); }
    if (!b || typeof b !== "object") return res.status(400).end();
    // Résumé borné champ par champ : rien d'autre n'est gardé
    const visite = {
      quand: new Date().toISOString(),
      bouton: txt(b.bouton, 40),
      pages: (Array.isArray(b.pages) ? b.pages : []).slice(0, 8).map((p: any) => ({
        page: txt(p?.page, 40), lu: num(p?.lu, 100), s: num(p?.s, 7200),
      })),
      duree_s: num(b.duree_s, 14400),
      faq: (Array.isArray(b.faq) ? b.faq : []).slice(0, 6).map((q: unknown) => txt(q, 80)).filter(Boolean),
      provenance: txt(b.provenance, 40),
      utm: Object.fromEntries(Object.entries(b.utm ?? {}).filter(([k]) => /^utm_(source|medium|campaign|content|term)$/.test(k)).map(([k, v]) => [k, txt(v, 60)])),
      appareil: txt(b.appareil, 30),
      visites: num(b.visites, 999),
      premiere: txt(b.premiere, 10),
    };
    const liste = ((await metaGet<any[]>(KEY)) ?? []).concat(visite).slice(-MAX);
    await metaSet(KEY, liste);
    return res.status(204).end();
  }

  if (req.method === "GET") {
    if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
    grantDevice(req, res);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json((await metaGet<any[]>(KEY)) ?? []);
  }

  return res.status(405).end();
}

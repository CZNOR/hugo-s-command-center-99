// api/suivi.ts — Avancement en direct des sessions et des projets (onglet « Point »)
//   GET            → le dernier suivi.json (sans ce qu'Hugo vient de cocher « fait »)
//   GET ?faits=1   → les « fait » cochés dans l'app, pas encore reportés dans ETAT.json par le Mac
//   POST suivi     → enregistre (envoyé toutes les 20 s par tools/publish_suivi.py depuis le Mac)
//   POST { fait: { qui, quoi } } → Hugo coche une chose « faite » dans l'app
//   POST { ackFaits: [clé…] }    → le Mac a reporté ces « fait » dans ETAT.json
// Stocké dans task_meta (lignes __suivi__ et __faits__), base fermée par RLS.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, sbHeaders, hasAccess, grantDevice } from "./_lib/server.js";
import { metaGet, metaSet } from "./_lib/push.js";

const ROW = "__suivi__";
const FAITS = "__faits__";
interface Fait { qui: string; quoi: string; le: string }
const cle = (f: { qui?: string; quoi?: string }) => `${f.qui ?? ""}|${f.quoi ?? ""}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const faits = (await metaGet<Fait[]>(FAITS)) ?? [];
    if (req.query.faits) return res.status(200).json(faits);
    const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.${ROW}&select=completed_at&limit=1`, {
      headers: sbHeaders(),
    });
    const rows: any[] = await r.json().catch(() => []);
    let suivi: any = null;
    try { suivi = JSON.parse(rows?.[0]?.completed_at ?? "null"); } catch { /* ligne absente */ }
    // Ce qui vient d'être coché disparaît tout de suite, sur tous les appareils, sans attendre le Mac
    if (suivi?.attente && faits.length) {
      const coches = new Set(faits.map(cle));
      suivi.attente = suivi.attente.filter((a: any) => !coches.has(cle(a)));
    }
    return res.status(200).json(suivi ?? {});
  }

  if (req.method === "POST") {
    const body: any = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};

    if (body.fait) {
      const fait: Fait = { qui: String(body.fait.qui ?? "").slice(0, 80), quoi: String(body.fait.quoi ?? "").slice(0, 600), le: new Date().toISOString() };
      if (!fait.quoi) return res.status(400).json({ error: "fait vide" });
      const faits = (await metaGet<Fait[]>(FAITS)) ?? [];
      if (!faits.some((f) => cle(f) === cle(fait))) faits.push(fait);
      return res.status(200).json({ ok: await metaSet(FAITS, faits.slice(-100)) });
    }

    if (Array.isArray(body.ackFaits)) {
      const reportes = new Set(body.ackFaits.map(String));
      const faits = (await metaGet<Fait[]>(FAITS)) ?? [];
      return res.status(200).json({ ok: await metaSet(FAITS, faits.filter((f) => !reportes.has(cle(f)))) });
    }

    const raw = JSON.stringify(body);
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

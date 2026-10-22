// api/relances.ts — Relances du jour, appels à noter, prochains envois (code d'accès)
// Lu par tools/dring_fiches.py pour que les sessions Claude n'oublient personne.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess, grantDevice } from "./_lib/server.js";
import { calculerRelances } from "./_lib/relances.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);
  res.setHeader("Cache-Control", "no-store");
  try {
    return res.status(200).json(await calculerRelances());
  } catch (e) {
    return res.status(502).json({ error: String(e) });
  }
}

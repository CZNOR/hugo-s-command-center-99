// api/google/token.ts — Échange OAuth Google (code ou refresh) côté serveur,
// pour que le secret client Google ne soit plus dans le JS public.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasAccess } from "../_lib/server.js";

const GRANTS = new Set(["authorization_code", "refresh_token"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });

  const b: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body ?? {};
  if (!GRANTS.has(b.grant_type)) return res.status(400).json({ error: "bad grant_type" });

  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    grant_type:    b.grant_type,
  });
  for (const k of ["code", "code_verifier", "redirect_uri", "refresh_token"]) {
    if (b[k]) params.set(k, String(b[k]));
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  return res.status(r.status).json(await r.json().catch(() => ({})));
}

// api/_lib/server.ts — Accès serveur partagé par les fonctions Vercel
//
// Les clés vivent uniquement côté serveur (variables sans préfixe VITE_) :
//   SUPABASE_SERVER_KEY        clé propre à l'app, envoyée en en-tête x-server-key ;
//                              les politiques RLS n'ouvrent la base qu'à elle
//                              (seule son empreinte SHA-256 est stockée en base)
//   CALCOM_API_KEY             clé API Cal.com
//   APP_ACCESS_CODE            code saisi une fois dans l'app, envoyé en en-tête x-app-key
// Les fichiers de api/_lib ne deviennent pas des routes (préfixe _).
import type { VercelRequest } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";

export const SB_URL   = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!;
const SB_ANON         = process.env.VITE_SUPABASE_ANON_KEY!;
const SB_SERVER_KEY   = process.env.SUPABASE_SERVER_KEY!;
export const CAL_KEY  = process.env.CALCOM_API_KEY!;
export const APP_TZ   = process.env.APP_TIMEZONE || "Europe/Paris";

export const sbHeaders = (extra: Record<string, string> = {}) => ({
  apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, "x-server-key": SB_SERVER_KEY, ...extra,
});

export const calHeaders = {
  Authorization: `Bearer ${CAL_KEY}`,
  "cal-api-version": "2024-08-13",
};

// Vrai si la requête porte le bon code d'accès de l'app
export function hasAccess(req: VercelRequest): boolean {
  const expected = process.env.APP_ACCESS_CODE || "";
  const given = String(req.headers["x-app-key"] ?? "");
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

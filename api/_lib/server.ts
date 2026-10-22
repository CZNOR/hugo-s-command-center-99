// api/_lib/server.ts — Accès serveur partagé par les fonctions Vercel
//
// Les clés vivent uniquement côté serveur (variables sans préfixe VITE_) :
//   SUPABASE_SERVER_KEY        clé propre à l'app, envoyée en en-tête x-server-key ;
//                              les politiques RLS n'ouvrent la base qu'à elle
//                              (seule son empreinte SHA-256 est stockée en base)
//   CALCOM_API_KEY             clé API Cal.com
//   APP_ACCESS_CODE            code saisi une fois dans l'app, envoyé en en-tête x-app-key
// Les fichiers de api/_lib ne deviennent pas des routes (préfixe _).
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";

// Les en-têtes HTTP ne portent que de l'ASCII : l'app encode le code (encodeURIComponent)
const decodeHeader = (v: unknown) => {
  const s = String(v ?? "");
  try { return decodeURIComponent(s); } catch { return s; }
};

export const SB_URL   = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)!;
const SB_ANON         = process.env.VITE_SUPABASE_ANON_KEY!;
const SB_SERVER_KEY   = process.env.SUPABASE_SERVER_KEY!;
// trim + guillemets retirés : une clé collée à la main dans Vercel traîne souvent un espace ou des " "
export const CAL_KEY  = (process.env.CALCOM_API_KEY || "").trim().replace(/^["']|["']$/g, "");
export const APP_TZ   = process.env.APP_TIMEZONE || "Europe/Paris";

export const sbHeaders = (extra: Record<string, string> = {}) => ({
  apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, "x-server-key": SB_SERVER_KEY, ...extra,
});

export const calHeaders = {
  Authorization: `Bearer ${CAL_KEY}`,
  "cal-api-version": "2024-08-13",
};

// Le clavier iPhone ajoute majuscules, accents et tirets longs : on compare
// le code sans eux, pour qu'un code bien saisi ne soit jamais refusé.
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-").replace(/\s+/g, "");

const same = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

// Jeton d'appareil (cookie « dring », 1 an) : dérivé du code, il reste valable à
// chaque déploiement et tombe seulement si le code change. HttpOnly : le JS n'y a pas accès.
const COOKIE = "dring";
const MAX_AGE_S = 365 * 24 * 3600;
const deviceToken = () =>
  createHmac("sha256", normalize(process.env.APP_ACCESS_CODE || "")).update("dring-appareil-v1").digest("hex");

function cookieToken(req: VercelRequest): string {
  const m = String(req.headers.cookie ?? "").match(/(?:^|;\s*)dring=([a-f0-9]{64})/);
  return m ? m[1] : "";
}

// Vrai si la requête porte le bon code d'accès (en-tête x-app-key) ou le jeton d'appareil
export function hasAccess(req: VercelRequest): boolean {
  const expected = normalize(process.env.APP_ACCESS_CODE || "");
  if (!expected) return false;
  if (same(normalize(decodeHeader(req.headers["x-app-key"])), expected)) return true;
  const token = cookieToken(req);
  return !!token && same(token, deviceToken());
}

// Pose (ou prolonge d'un an) le jeton d'appareil après une requête autorisée
export function grantDevice(req: VercelRequest, res: VercelResponse) {
  if (cookieToken(req) === deviceToken()) return;
  res.setHeader("Set-Cookie", `${COOKIE}=${deviceToken()}; Max-Age=${MAX_AGE_S}; Path=/; HttpOnly; Secure; SameSite=Lax`);
}

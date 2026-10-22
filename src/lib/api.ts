// ─── Appels vers les fonctions serveur de l'app ───────────────────────────────
// Les clés (Cal, Supabase) restent côté serveur. Le navigateur envoie seulement
// le code d'accès, saisi une fois par appareil sur l'écran de code. Le serveur pose
// alors un jeton d'appareil d'un an (cookie HttpOnly), envoyé tout seul ensuite.

const CODE_KEY = "app_access_code";
export const NEED_CODE_EVENT = "dring:need-code";

export function hasCode(): boolean {
  return accessCode() !== "";
}

function accessCode(): string {
  try { return localStorage.getItem(CODE_KEY) ?? ""; } catch { return ""; }
}

export function saveCode(code: string) {
  try { localStorage.setItem(CODE_KEY, code.trim()); } catch { /* stockage bloqué */ }
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-app-key", encodeURIComponent(accessCode()));
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) window.dispatchEvent(new Event(NEED_CODE_EVENT));
  return res;
}

// Vérifie un code avant de l'enregistrer
export async function checkCode(code: string): Promise<boolean> {
  const r = await fetch("/api/point", { headers: { "x-app-key": encodeURIComponent(code.trim()) } });
  return r.ok;
}

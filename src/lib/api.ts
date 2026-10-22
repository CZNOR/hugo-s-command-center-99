// ─── Appels vers les fonctions serveur de l'app ───────────────────────────────
// Les clés (Cal, Supabase, Google, Apify) restent côté serveur.
// Le navigateur envoie seulement le code d'accès, saisi une fois par appareil.

const CODE_KEY = "app_access_code";
let asked = false;

function accessCode(): string {
  try { return localStorage.getItem(CODE_KEY) ?? ""; } catch { return ""; }
}

// Code absent ou faux → on le demande une fois, puis on recharge
function askForCode() {
  if (asked || typeof window === "undefined") return;
  asked = true;
  const code = window.prompt("Code d'accès de l'app");
  if (!code) return;
  try { localStorage.setItem(CODE_KEY, code.trim()); } catch { /* stockage bloqué */ }
  window.location.reload();
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-app-key", accessCode());
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) askForCode();
  return res;
}

// Supabase REST via /api/db : même chemin que /rest/v1/<path>
export function dbFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return apiFetch(`/api/db?p=${encodeURIComponent(path)}`, { ...init, headers });
}

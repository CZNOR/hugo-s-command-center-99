import { createRoot } from "react-dom/client";
import App from "./App";
import { apiFetch } from "@/lib/api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);

// iPhone, app installée : si la vue s'arrête avant le bas de l'écran (ancienne barre d'état transparente,
// gardée tant que l'icône n'est pas réinstallée), le trait d'accueil est hors de la vue : menu sans marge dessous.
const enApp = () => matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
function caler() {
  const sonde = document.createElement("div");
  sonde.style.cssText = "position:fixed;visibility:hidden;padding-top:env(safe-area-inset-top)";
  document.body.appendChild(sonde);
  const haut = parseFloat(getComputedStyle(sonde).paddingTop) || 0;
  sonde.remove();
  const manque = screen.height - innerHeight;
  document.documentElement.classList.toggle("bande-ios", enApp() && haut > 0 && manque > 0 && Math.abs(manque - haut) < 2);
}
caler();
addEventListener("resize", caler);

// L'iPhone rouvre l'app sans la recharger : au retour dans l'app, si une nouvelle version est en ligne, on recharge
const version = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.src.split("/").pop();
async function aJour() {
  if (!version || document.visibilityState !== "visible") return;
  const html = await fetch("/", { cache: "no-store" }).then((r) => r.text()).catch(() => "");
  const enLigne = html.match(/assets\/(index-[^"]+\.js)/)?.[1];
  if (enLigne && enLigne !== version) location.reload();
}
document.addEventListener("visibilitychange", aJour);
setInterval(aJour, 5 * 60_000);

// Mesures d'écran envoyées une fois au lancement : pour régler le menu du bas sur le vrai iPhone
setTimeout(() => {
  const sonde = document.createElement("div");
  sonde.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";
  document.body.appendChild(sonde);
  const cs = getComputedStyle(sonde);
  const r = (sel: string) => { const b = document.querySelector(sel)?.getBoundingClientRect(); return b ? { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) } : null; };
  const diag = {
    ua: navigator.userAgent.slice(0, 160),
    standalone: matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true,
    screen: [screen.width, screen.height], inner: [innerWidth, innerHeight],
    client: document.documentElement.clientHeight, vv: Math.round(window.visualViewport?.height ?? 0),
    safeTop: cs.paddingTop, safeBottom: cs.paddingBottom, dpr: devicePixelRatio,
    app: r(".app"), nav: r(".nav"), bande: document.documentElement.classList.contains("bande-ios"), css: (document.querySelector('link[rel="stylesheet"]') as HTMLLinkElement | null)?.href.split("/").pop(),
  };
  sonde.remove();
  apiFetch("/api/suivi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diag }) }).catch(() => {});
}, 1500);

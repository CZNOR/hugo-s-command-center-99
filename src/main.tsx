import { createRoot } from "react-dom/client";
import App from "./App";
import { apiFetch } from "@/lib/api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);

// iPhone, app installée sur l'écran d'accueil : avec la barre d'état transparente (« black-translucent »),
// la vue s'arrête avant le bas de l'écran — il manque la hauteur de la barre d'état (59 px sur un 15 Pro Max).
// D'où la bande noire sous le menu. On étire l'app jusqu'au bord réel de l'écran.
const enApp = () => matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
function caler() {
  const manque = screen.height - innerHeight; // clavier ouvert ou paysage : écart trop grand, on ne touche à rien
  document.documentElement.style.setProperty("--app-h", enApp() && manque > 0 && manque < 120 ? `${screen.height}px` : "100%");
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
    app: r(".app"), nav: r(".nav"), appH: getComputedStyle(document.documentElement).getPropertyValue("--app-h"), css: (document.querySelector('link[rel="stylesheet"]') as HTMLLinkElement | null)?.href.split("/").pop(),
  };
  sonde.remove();
  apiFetch("/api/suivi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diag }) }).catch(() => {});
}, 1500);

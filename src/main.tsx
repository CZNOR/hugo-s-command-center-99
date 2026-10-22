import { createRoot } from "react-dom/client";
import App from "./App";
import { apiFetch } from "@/lib/api";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);

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
    app: r(".app"), nav: r(".nav"), css: (document.querySelector('link[rel="stylesheet"]') as HTMLLinkElement | null)?.href.split("/").pop(),
  };
  sonde.remove();
  apiFetch("/api/suivi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ diag }) }).catch(() => {});
}, 1500);

// usePushSubscription.ts — Service Worker + abonnement push des rappels d'appels
//
// L'abonnement n'est considéré comme actif qu'une fois enregistré côté serveur
// (réponse 200 de /api/push/subscribe). Tant que ce n'est pas le cas, l'app
// affiche le bouton d'activation, avec la raison exacte si ça bloque.
import { useEffect, useCallback, useState } from "react";
import { apiFetch } from "./api";

const VAPID_PUBLIC_KEY = "BP3pESPfbab2cV4X1THfe2hF_PQGEfOQsmkoBHUxWZWcMGKkYct-5HzdWV6bCUhyJqV-pHt01-GiV8CCGJHxufw";
const REGISTERED_KEY = "push_registered_endpoint";

export type PushStatus =
  | "checking"       // vérification au démarrage
  | "unsupported"    // navigateur sans push
  | "not-installed"  // iPhone : ouvert dans Safari au lieu de l'icône
  | "denied"         // refusé dans les réglages
  | "off"            // pas encore activé sur cet appareil
  | "busy"
  | "on"             // abonnement enregistré côté serveur
  | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;

function initialStatus(): PushStatus {
  if (isIos() && !isStandalone()) return "not-installed";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" ? "checking" : "off";
}

// Crée (ou reprend) l'abonnement et l'enregistre côté serveur
async function register(): Promise<void> {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  const r = await apiFetch("/api/push/subscribe", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (r.status === 401) throw new Error("Code d'accès manquant : entre-le puis réessaie.");
  if (!r.ok) throw new Error(`Serveur : erreur ${r.status}`);
  try { localStorage.setItem(REGISTERED_KEY, sub.endpoint); } catch { /* stockage bloqué */ }
}

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>(initialStatus);
  const [error, setError] = useState("");

  // Bouton « Activer » : demande la permission (geste requis sur iPhone)
  const subscribe = useCallback(async (): Promise<boolean> => {
    setError("");
    setStatus("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return false;
      }
      await register();
      setStatus("on");
      return true;
    } catch (e: any) {
      setError(String(e?.message ?? e));
      setStatus("error");
      return false;
    }
  }, []);

  // Permission déjà accordée : on réenregistre en silence à chaque ouverture
  useEffect(() => {
    if (initialStatus() !== "checking") return;
    register()
      .then(() => setStatus("on"))
      .catch((e) => { setError(String(e?.message ?? e)); setStatus("error"); });
  }, []);

  return { status, error, subscribe, subscribed: status === "on", permission: status === "on" ? "granted" : "default" };
}

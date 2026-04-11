// usePushSubscription.ts — Enregistre le Service Worker + subscription push
import { useEffect, useCallback, useState } from "react";

const VAPID_PUBLIC_KEY = "BP3pESPfbab2cV4X1THfe2hF_PQGEfOQsmkoBHUxWZWcMGKkYct-5HzdWV6bCUhyJqV-pHt01-GiV8CCGJHxufw";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription() {
  const [permission, setPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [subscribed, setSubscribed] = useState(false);

  // ── Enregistre le SW et crée la subscription ──────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push non supporté sur ce navigateur");
      return false;
    }

    // 1. Demander la permission
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return false;

    // 2. Enregistrer le SW
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // 3. Créer la subscription VAPID
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 4. Envoyer au serveur Vercel pour stockage Supabase
    const r = await fetch("/api/push/subscribe", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ subscription: sub.toJSON() }),
    });

    const ok = r.ok;
    setSubscribed(ok);
    return ok;
  }, []);

  // ── Vérifie si déjà subscrit au montage ──────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" })
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  return { permission, subscribed, subscribe };
}

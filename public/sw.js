// ── Dring Service Worker — notifications d'appels ───────────────────────────

const CACHE = "dring-v1";

// Installation
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

// Activation : on efface les anciens caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => clients.claim())
  );
});

// ── Cache : ouverture instantanée ────────────────────────────────────────────
// Fichiers versionnés (/assets/…), polices et icônes : servis depuis le cache.
// Pages : réseau d'abord (toujours la dernière version), cache si hors ligne.
// /api/ n'est jamais mis en cache.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  if (/^\/(assets|fonts)\/|\.(png|ico)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }))
    );
  }
});

// ── Push reçu depuis le serveur ──────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = { title: "Dring", body: "Nouvel appel", url: "/" };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}

  const options = {
    body:    data.body,
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    tag:     data.tag || "dring-notif",
    data:    { url: data.url || "/" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Clic sur la notification → ouvre l'app ───────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // Si l'app est déjà ouverte → focus + navigate
      for (const win of wins) {
        if (win.url.includes(self.location.origin)) {
          win.focus();
          win.navigate(url);
          return;
        }
      }
      // Sinon → ouvrir un nouvel onglet
      return clients.openWindow(url);
    })
  );
});

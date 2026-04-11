// ── CZN Service Worker — Push Notifications ──────────────────────────────────
const CACHE_NAME = "czn-v1";

// Installation
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// ── Push reçu depuis le serveur ──────────────────────────────────────────────
self.addEventListener("push", (e) => {
  let data = { title: "CZN", body: "Rappel de tâche", url: "/tasks" };
  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch {}

  const options = {
    body:    data.body,
    icon:    "/czn-logo.png",
    badge:   "/czn-logo.png",
    tag:     data.tag || "czn-notif",
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

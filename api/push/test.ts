// api/push/test.ts — Envoie une notif de test à tous les abonnés
import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";

const SB_URL        = process.env.VITE_SUPABASE_URL!;
const SB_KEY        = process.env.VITE_SUPABASE_ANON_KEY!;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const subs: any[] = await r.json();

  if (!subs?.length) return res.status(200).json({ sent: 0, reason: "no subscribers" });

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify({
          title: "🔔 Test notification",
          body:  "Les notifications fonctionnent parfaitement !",
          tag:   "test",
          url:   "/",
        })
      );
      sent++;
    } catch (err: any) {
      console.error("Push error:", err.statusCode, err.body);
    }
  }

  return res.status(200).json({ sent, total: subs.length });
}

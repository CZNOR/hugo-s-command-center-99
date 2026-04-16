// api/push/ritual.ts — sends the morning or evening ritual push notification.
// Triggered by Vercel Cron (see vercel.json) at the configured hours.
// Query param `?mode=morning` or `?mode=evening` decides the payload.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";

const SB_URL        = process.env.VITE_SUPABASE_URL!;
const SB_KEY        = process.env.VITE_SUPABASE_ANON_KEY!;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

async function getSubscriptions(): Promise<any[]> {
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  if (!r.ok) return [];
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

async function sendToAll(subs: any[], payload: object): Promise<number> {
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410) {
        await fetch(`${SB_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        });
      }
    }
  }
  return sent;
}

function isSunday(): boolean {
  // Vercel runs UTC; Paris is UTC+1 (winter) or UTC+2 (summer). For the weekly day-off,
  // we accept a 1h drift either way — only skip if we're clearly on Sunday Paris time.
  const now = new Date();
  const parisOffsetHours = 1; // good enough; in summer it's 2 but cron runs at 9h/19h ParisTime
  const paris = new Date(now.getTime() + parisOffsetHours * 60 * 60 * 1000);
  return paris.getUTCDay() === 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const mode = (req.query.mode ?? "morning") as "morning" | "evening";

  // Sunday off per user preference (weekendMode: "saturday" → Sunday off)
  if (isSunday()) {
    return res.status(200).json({ skipped: true, reason: "sunday-off" });
  }

  const subs = await getSubscriptions();
  if (subs.length === 0) return res.status(200).json({ sent: 0, mode });

  const payload = mode === "morning"
    ? {
        title: "☀️ Prépare ta journée",
        body: "Tes 3 priorités + intention du jour. 30 secondes.",
        url: "/",
        tag: "ritual-morning",
      }
    : {
        title: "🌙 Bilan de la journée",
        body: "Qu'as-tu closé ? Un win à garder. 30 secondes.",
        url: "/",
        tag: "ritual-evening",
      };

  const sent = await sendToAll(subs, payload);
  return res.status(200).json({ sent, total: subs.length, mode });
}

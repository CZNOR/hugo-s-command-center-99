// api/push/weekly-digest.ts — Sunday 20h Bangkok recap push.
// Reads the last 7 days of daily_rituals from Supabase, computes wins count
// and streak, then sends a summary push to every registered subscription.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";

const SB_URL        = process.env.VITE_SUPABASE_URL!;
const SB_KEY        = process.env.VITE_SUPABASE_ANON_KEY!;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

function daysAgoLocal(n: number): string {
  // UTC+7 (Bangkok) local date, n days ago
  const d = new Date(Date.now() + 7 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

async function fetchRecentRituals(): Promise<any[]> {
  const since = daysAgoLocal(6); // last 7 days inclusive
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/daily_rituals?date=gte.${since}&select=*&order=date.asc`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    if (!r.ok) return [];
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } catch { return []; }
}

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

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const rituals = await fetchRecentRituals();
  const completeDays = rituals.filter(r => r.morning_at && r.evening_at).length;
  const wins = rituals
    .map(r => r.win)
    .filter((w): w is string => typeof w === "string" && w.trim().length > 0);

  const title = "📅 Ta semaine · résumé";
  const body = completeDays === 0
    ? "Aucun rituel complet cette semaine. Reprends lundi, un jour à la fois."
    : `${completeDays}/7 jours bouclés · ${wins.length} win${wins.length > 1 ? "s" : ""} · ${wins[wins.length - 1] ? `Dernier: ${wins[wins.length - 1].slice(0, 60)}` : ""}`;

  const subs = await getSubscriptions();
  if (subs.length === 0) return res.status(200).json({ sent: 0, completeDays, wins: wins.length });

  const sent = await sendToAll(subs, {
    title, body, url: "/", tag: "weekly-digest",
  });

  return res.status(200).json({ sent, total: subs.length, completeDays, wins: wins.length });
}

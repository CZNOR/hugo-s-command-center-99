// api/push/subscribe.ts — Sauvegarde la subscription push en Supabase
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SB_URL = process.env.VITE_SUPABASE_URL!;
const SB_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { subscription } = req.body as { subscription: PushSubscriptionJSON };
  if (!subscription?.endpoint) return res.status(400).json({ error: "no subscription" });

  // Upsert dans Supabase (endpoint est unique)
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      endpoint:   subscription.endpoint,
      p256dh:     (subscription.keys as any)?.p256dh ?? "",
      auth:       (subscription.keys as any)?.auth ?? "",
      updated_at: new Date().toISOString(),
    }),
  });

  if (!r.ok) return res.status(500).json({ error: "supabase error" });
  return res.status(200).json({ ok: true });
}

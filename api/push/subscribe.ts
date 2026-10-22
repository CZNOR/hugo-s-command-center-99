// api/push/subscribe.ts — Sauvegarde la subscription push en Supabase
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, sbHeaders, hasAccess, grantDevice } from "../_lib/server.js";


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  // Sans code, n'importe qui pourrait s'abonner aux notifs d'appels
  if (!hasAccess(req)) return res.status(401).json({ error: "code d'accès requis" });
  grantDevice(req, res);

  const { subscription } = req.body as { subscription: PushSubscriptionJSON };
  if (!subscription?.endpoint) return res.status(400).json({ error: "no subscription" });

  // Upsert dans Supabase : endpoint est unique, on_conflict le désigne comme clé
  // (sans lui, une 2e inscription du même appareil échouait en 500)
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
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

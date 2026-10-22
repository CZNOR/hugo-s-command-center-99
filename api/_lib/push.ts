// api/_lib/push.ts — Envoi d'une notif push à tous les appareils abonnés
import webpush from "web-push";
import { SB_URL, sbHeaders } from "./server.js";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export interface PushPayload { title: string; body: string; tag: string; url: string; silent?: boolean }

export async function pushAll(payload: PushPayload): Promise<number> {
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?select=*`, { headers: sbHeaders() });
  const subs: any[] = await r.json().catch(() => []);
  let sent = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: any) {
      // 410 = abonnement mort (app supprimée) : on le retire
      if (err.statusCode === 410) {
        await fetch(`${SB_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
          method: "DELETE", headers: sbHeaders(),
        });
      }
    }
  }
  return sent;
}

// Lecture / écriture d'une ligne JSON de task_meta (stockage clé → valeur de l'app)
export async function metaGet<T>(key: string): Promise<T | null> {
  const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.${encodeURIComponent(key)}&select=completed_at&limit=1`, {
    headers: sbHeaders(),
  });
  const rows: any[] = await r.json().catch(() => []);
  try { return rows?.[0]?.completed_at ? JSON.parse(rows[0].completed_at) : null; } catch { return null; }
}

export async function metaSet(key: string, value: unknown): Promise<boolean> {
  const r = await fetch(`${SB_URL}/rest/v1/task_meta?on_conflict=notion_id`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      notion_id: key, business: "__snapshot__", priority: "normale", time: null,
      completed_at: JSON.stringify(value), updated_at: new Date().toISOString(),
    }),
  });
  return r.ok;
}

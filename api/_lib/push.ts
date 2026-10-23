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
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?select=*`, { headers: sbHeaders(), signal: AbortSignal.timeout(9000) });
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
    headers: sbHeaders(), signal: AbortSignal.timeout(9000),
  }).catch(() => null); // base injoignable : comme une ligne absente
  if (!r) return null;
  const rows: any[] = await r.json().catch(() => []);
  try { return rows?.[0]?.completed_at ? JSON.parse(rows[0].completed_at) : null; } catch { return null; }
}

export async function metaSet(key: string, value: unknown): Promise<boolean> {
  const r = await fetch(`${SB_URL}/rest/v1/task_meta?on_conflict=notion_id`, {
    method: "POST", signal: AbortSignal.timeout(9000),
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      notion_id: key, business: "__snapshot__", priority: "normale", time: null,
      completed_at: JSON.stringify(value), updated_at: new Date().toISOString(),
    }),
  }).catch(() => null);
  return !!r?.ok;
}

// Plusieurs lignes JSON d'un coup (une seule requête)
export async function metaGetMany<T>(keys: string[]): Promise<Record<string, T>> {
  if (!keys.length) return {};
  const liste = keys.map((k) => `"${k.replace(/"/g, "")}"`).join(",");
  const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=in.(${encodeURIComponent(liste)})&select=notion_id,completed_at`, {
    headers: sbHeaders(),
  });
  const rows: any[] = await r.json().catch(() => []);
  const out: Record<string, T> = {};
  for (const row of rows ?? []) {
    try { out[row.notion_id] = JSON.parse(row.completed_at); } catch { /* ligne illisible */ }
  }
  return out;
}

// api/push/notify.ts — Cron Vercel toutes les minutes
// Vérifie tâches + nouveaux calls Cal.com et envoie les pushs natifs
import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";

const SB_URL        = process.env.VITE_SUPABASE_URL!;
const SB_KEY        = process.env.VITE_SUPABASE_ANON_KEY!;
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";
const CALCOM_KEY    = process.env.VITE_CALCOM_API_KEY!;

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ── Helpers ────────────────────────────────────────────────────────────────
async function sbGet<T>(path: string): Promise<T> {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

async function sbPost(path: string, body: object) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
}

function taskDateTime(task: any): Date | null {
  if (!task.deadline) return null;
  const [y, mo, d] = task.deadline.split("-").map(Number);
  if (task.time) {
    const [h, mi] = task.time.split(":").map(Number);
    return new Date(y, mo - 1, d, h, mi, 0);
  }
  return new Date(y, mo - 1, d, 23, 59, 0);
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

// ── Handler principal ──────────────────────────────────────────────────────
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Charger les subscriptions push
    const subs = await sbGet<any[]>("push_subscriptions?select=*");
    if (!subs?.length) return res.status(200).json({ sent: 0, reason: "no subscribers" });

    let totalSent = 0;

    // ── 1. TÂCHES : notif 5 min avant ─────────────────────────────────────
    const snap  = await sbGet<any[]>("task_meta?notion_id=eq.__tasks_v2__&limit=1");
    const tasks: any[] = snap?.[0]?.completed_at ? JSON.parse(snap[0].completed_at) : [];
    const now   = Date.now();

    for (const task of tasks) {
      if (task.status === "done") continue;
      const dt = taskDateTime(task);
      if (!dt) continue;
      const diffMs   = dt.getTime() - now;
      const diffMins = diffMs / 60_000;

      if (diffMins >= 4 && diffMins < 6) {
        totalSent += await sendToAll(subs, {
          title: `⏰ Dans 5 min — ${task.title}`,
          body:  `${task.time ? `à ${task.time}` : "aujourd'hui"} · ${task.business}`,
          tag:   `5min-${task.id}`,
          url:   "/tasks",
        });
      }
      if (diffMs < 0 && diffMs > -180_000) {
        totalSent += await sendToAll(subs, {
          title: `🔴 En retard — ${task.title}`,
          body:  task.time ? `Prévu à ${task.time}` : "Prévu aujourd'hui",
          tag:   `late-${task.id}`,
          url:   "/tasks",
        });
      }
    }

    // ── 2. CAL.COM : nouveaux calls dans les 2 dernières minutes ──────────
    try {
      const calRes = await fetch(
        "https://api.cal.com/v2/bookings?status=upcoming&limit=10",
        { headers: { Authorization: `Bearer ${CALCOM_KEY}`, "cal-api-version": "2024-08-13" } }
      );
      const calJson = await calRes.json();
      const bookings: any[] = Array.isArray(calJson?.data) ? calJson.data : [];

      // Charger les IDs déjà notifiés (stockés dans Supabase)
      const seen = await sbGet<any[]>("task_meta?notion_id=eq.__cal_notified__&limit=1");
      const seenIds: Set<number> = new Set(
        seen?.[0]?.completed_at ? JSON.parse(seen[0].completed_at) : []
      );

      const twoMinsAgo = Date.now() - 2 * 60 * 1000;
      const newIds: number[] = [];

      for (const b of bookings) {
        if (seenIds.has(b.id)) continue;
        const createdAt = new Date(b.createdAt).getTime();
        // Nouveau booking créé dans les 2 dernières minutes
        if (createdAt >= twoMinsAgo) {
          const attendee  = b.attendees?.[0];
          const startDate = new Date(b.start);
          const dateStr   = startDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
          const timeStr   = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          const budget    = b.bookingFieldsResponses?.budget?.[0] ?? "";
          const niveau    = b.bookingFieldsResponses?.niveau?.[0] ?? "";

          totalSent += await sendToAll(subs, {
            title: `📞 Nouveau call — ${attendee?.name ?? "Inconnu"}`,
            body:  `${dateStr} à ${timeStr}${budget ? ` · ${budget}` : ""}${niveau ? ` · ${niveau}` : ""}`,
            tag:   `cal-${b.id}`,
            url:   "/appels",
          });
        }
        newIds.push(b.id);
      }

      // Sauvegarder les IDs notifiés (on garde les 100 derniers)
      const allSeen = [...seenIds, ...newIds].slice(-100);
      await sbPost("task_meta", {
        notion_id:    "__cal_notified__",
        business:     "__snapshot__",
        priority:     "normale",
        time:         null,
        completed_at: JSON.stringify(allSeen),
        updated_at:   new Date().toISOString(),
      });
    } catch (calErr) {
      console.error("Cal.com error:", calErr);
    }

    return res.status(200).json({ sent: totalSent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err) });
  }
}

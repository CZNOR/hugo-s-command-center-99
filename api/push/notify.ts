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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug trace — opt-in via ?debug=1 so the response shows what the handler saw.
  // Version stamp lets us verify a deploy is live without relying on logs.
  const debug = req.query?.debug === "1";
  const trace: any = { version: "2026-04-22-first-sight", now: new Date().toISOString() };
  try {
    const subs = await sbGet<any[]>("push_subscriptions?select=*");
    trace.subs = subs?.length ?? 0;
    if (!subs?.length) {
      return res.status(200).json(debug ? { sent: 0, reason: "no subscribers", trace } : { sent: 0, reason: "no subscribers" });
    }

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

    // ── 2. CAL.COM : nouveaux calls + rappel 5 min avant ─────────────────
    let calBookings: any[] = [];
    trace.cal = { status: "start" };
    try {
      const calRes = await fetch(
        "https://api.cal.com/v2/bookings?status=upcoming&limit=10",
        { headers: { Authorization: `Bearer ${CALCOM_KEY}`, "cal-api-version": "2024-08-13" } }
      );
      const calJson = await calRes.json();
      calBookings = Array.isArray(calJson?.data) ? calJson.data : [];
      trace.cal = { status: calRes.status, count: calBookings.length, ids: calBookings.map((b: any) => b.id) };

      // Charger les IDs déjà notifiés pour "nouveau booking" (snapshot Supabase)
      const seen = await sbGet<any[]>("task_meta?notion_id=eq.__cal_notified__&limit=1");
      const seenIds: Set<number> = new Set(
        seen?.[0]?.completed_at ? JSON.parse(seen[0].completed_at) : []
      );

      const newIds: number[] = [];
      const calDecisions: any[] = [];

      for (const b of calBookings) {
        if (seenIds.has(b.id)) {
          calDecisions.push({ id: b.id, skip: "already-seen" });
          newIds.push(b.id); continue;
        }
        const startMs = new Date(b.start).getTime();
        if (startMs > now) {
          const attendee  = b.attendees?.[0];
          const startDate = new Date(b.start);
          const dateStr   = startDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
          const timeStr   = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          const budget    = b.bookingFieldsResponses?.budget?.[0] ?? "";
          const niveau    = b.bookingFieldsResponses?.niveau?.[0] ?? "";

          const sent = await sendToAll(subs, {
            title: `📞 Nouveau call — ${attendee?.name ?? "Inconnu"}`,
            body:  `${dateStr} à ${timeStr}${budget ? ` · ${budget}` : ""}${niveau ? ` · ${niveau}` : ""}`,
            tag:   `cal-${b.id}`,
            url:   "/coaching/leads",
          });
          totalSent += sent;
          calDecisions.push({ id: b.id, notified: sent, attendee: attendee?.name, start: b.start });
        } else {
          calDecisions.push({ id: b.id, skip: "in-past", start: b.start });
        }
        newIds.push(b.id);
      }
      trace.calDecisions = calDecisions;
      await sbPost("task_meta", {
        notion_id: "__cal_notified__", business: "__snapshot__", priority: "normale",
        time: null, completed_at: JSON.stringify(newIds.slice(-100)),
        updated_at: new Date().toISOString(),
      });
    } catch (calErr) {
      console.error("Cal.com error:", calErr);
    }

    // ── 3. APPELS MANUELS : snapshot Supabase ────────────────────────────
    let manualCalls: any[] = [];
    try {
      const mcSnap = await sbGet<any[]>("task_meta?notion_id=eq.__manual_calls__&limit=1");
      manualCalls = mcSnap?.[0]?.completed_at ? JSON.parse(mcSnap[0].completed_at) : [];
    } catch (mcErr) {
      console.error("Manual calls fetch error:", mcErr);
    }

    // ── 4. RAPPEL 5 MIN AVANT (Cal.com + manuels) ────────────────────────
    // Dédup via un snapshot des IDs déjà rappelés. Un ID reste dans la liste 24h
    // max (purge côté post-write en gardant les 200 derniers).
    try {
      const reminded = await sbGet<any[]>("task_meta?notion_id=eq.__cal_reminded__&limit=1");
      const remindedIds: Set<string> = new Set(
        reminded?.[0]?.completed_at ? JSON.parse(reminded[0].completed_at) : []
      );
      const newlyReminded: string[] = [];

      // Cal.com bookings
      for (const b of calBookings) {
        const key = `cal-${b.id}`;
        if (remindedIds.has(key)) { newlyReminded.push(key); continue; }
        const startMs = new Date(b.start).getTime();
        const diffMin = (startMs - now) / 60_000;
        if (diffMin >= 4 && diffMin < 7) {
          const attendee = b.attendees?.[0];
          const timeStr  = new Date(b.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          totalSent += await sendToAll(subs, {
            title: `⏰ Dans 5 min — Call ${attendee?.name ?? "Cal.com"}`,
            body:  `Rendez-vous à ${timeStr}`,
            tag:   `cal-remind-${b.id}`,
            url:   "/coaching/leads",
          });
          newlyReminded.push(key);
        } else if (diffMin > 7) {
          // Keep previously reminded keys alive until the call has passed so we don't
          // re-send. For upcoming-but-not-yet-due calls, don't add to reminded set yet.
        }
      }

      // Manual calls — (date, time) stored in Bangkok local tz (UTC+7).
      // Rebuild the absolute UTC ms: BKK local 14:00 = 07:00 UTC, so we subtract 7h
      // after interpreting the pair as if it were UTC.
      const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;
      for (const mc of manualCalls) {
        const key = `mc-${mc.id}`;
        if (remindedIds.has(key)) { newlyReminded.push(key); continue; }
        if (!mc.date || !mc.time) continue;
        const [y, mo, d] = String(mc.date).split("-").map(Number);
        const [h, mi]    = String(mc.time).split(":").map(Number);
        // Date.UTC(...) treats the args as UTC. We subtract the BKK offset to get
        // the real UTC ms for a BKK-local datetime.
        const startMs = Date.UTC(y, (mo ?? 1) - 1, d, h ?? 0, mi ?? 0) - BKK_OFFSET_MS;
        const diffMin = (startMs - now) / 60_000;
        if (diffMin >= 4 && diffMin < 7) {
          totalSent += await sendToAll(subs, {
            title: `⏰ Dans 5 min — ${mc.clientName}`,
            body:  `${mc.time} · ${mc.business}${mc.notes ? ` · ${String(mc.notes).slice(0, 60)}` : ""}`,
            tag:   `mc-remind-${mc.id}`,
            url:   "/agenda",
          });
          newlyReminded.push(key);
        }
      }

      // Persister les IDs rappelés (cap à 200 pour éviter le gonflement)
      const merged = Array.from(new Set([...Array.from(remindedIds), ...newlyReminded])).slice(-200);
      await sbPost("task_meta", {
        notion_id: "__cal_reminded__", business: "__snapshot__", priority: "normale",
        time: null, completed_at: JSON.stringify(merged),
        updated_at: new Date().toISOString(),
      });
    } catch (remErr) {
      console.error("Reminder error:", remErr);
    }

    return res.status(200).json(debug ? { sent: totalSent, trace } : { sent: totalSent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: String(err), trace });
  }
}

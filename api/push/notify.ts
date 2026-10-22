// api/push/notify.ts — Cron Vercel toutes les minutes
// Vérifie tâches + nouveaux calls Cal.com et envoie les pushs natifs
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, APP_TZ, sbHeaders, calHeaders, hasAccess } from "../_lib/server.js";
import webpush from "web-push";

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// ── Helpers ────────────────────────────────────────────────────────────────
async function sbGet<T>(path: string): Promise<T> {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: sbHeaders(),
  });
  const t = await r.text();
  return t ? JSON.parse(t) : [];
}

async function sbPost(path: string, body: object) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify(body),
  });
}

// Décalage (ms) entre APP_TZ et UTC à un instant donné, heure d'été comprise
function tzOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - utcMs;
}

// Heure locale APP_TZ (date + heure saisies à la main) → instant UTC
function localToUtcMs(y: number, mo: number, d: number, h: number, mi: number): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - tzOffsetMs(guess);
  return guess - tzOffsetMs(first);
}

function taskDateTime(task: any): Date | null {
  if (!task.deadline) return null;
  const [y, mo, d] = task.deadline.split("-").map(Number);
  if (task.time) {
    const [h, mi] = task.time.split(":").map(Number);
    return new Date(localToUtcMs(y, mo, d, h, mi));
  }
  return new Date(localToUtcMs(y, mo, d, 23, 59));
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
          method: "DELETE", headers: sbHeaders(),
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
  // La trace contient des noms de clients : réservée au code d'accès.
  const debug = req.query?.debug === "1" && hasAccess(req);
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

      // Same 3-8 min window as the call reminders — the cron runs every 5 min.
      if (diffMins >= 3 && diffMins < 8) {
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
        { headers: calHeaders }
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
          const dateStr   = startDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: APP_TZ });
          const timeStr   = startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TZ });
          const r = b.bookingFieldsResponses ?? {};
          const pick = (v: any) => Array.isArray(v) ? v[0] : v;
          // Mobile push body has ~3 short tags max — pick the most actionable.
          const budget    = pick(r.budget) ?? "";
          const niveau    = pick(r.niveau) ?? "";
          const objectif  = pick(r["objectif-principal"]) ?? "";
          const tags = [budget, niveau, objectif].filter(Boolean).map(s => String(s)).join(" · ");

          const sent = await sendToAll(subs, {
            title: `📞 Nouveau call — ${attendee?.name ?? "Inconnu"}`,
            body:  `${dateStr} à ${timeStr}${tags ? ` · ${tags}` : ""}`,
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
    // Poll cadence is 5 min (GitHub Actions schedule), so the reminder window
    // must be at least 5 min wide to avoid missing calls. 3-8 min guarantees
    // exactly one trigger per call even with a worst-case 5-min drift.
    try {
      const reminded = await sbGet<any[]>("task_meta?notion_id=eq.__cal_reminded__&limit=1");
      const remindedIds: Set<string> = new Set(
        reminded?.[0]?.completed_at ? JSON.parse(reminded[0].completed_at) : []
      );
      const newlyReminded: string[] = [];
      const REMIND_MIN = 3;   // fire any time 3..8 min before start
      const REMIND_MAX = 8;

      // Cal.com bookings
      for (const b of calBookings) {
        const key = `cal-${b.id}`;
        if (remindedIds.has(key)) { newlyReminded.push(key); continue; }
        const startMs = new Date(b.start).getTime();
        const diffMin = (startMs - now) / 60_000;
        if (diffMin >= REMIND_MIN && diffMin < REMIND_MAX) {
          const attendee = b.attendees?.[0];
          const timeStr  = new Date(b.start).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TZ });
          totalSent += await sendToAll(subs, {
            title: `⏰ Dans 5 min — Call ${attendee?.name ?? "Cal.com"}`,
            body:  `Rendez-vous à ${timeStr}`,
            tag:   `cal-remind-${b.id}`,
            url:   "/coaching/leads",
          });
          newlyReminded.push(key);
        }
      }

      // Manual calls — (date, time) saisis dans le fuseau APP_TZ (Paris par défaut).
      for (const mc of manualCalls) {
        const key = `mc-${mc.id}`;
        if (remindedIds.has(key)) { newlyReminded.push(key); continue; }
        if (!mc.date || !mc.time) continue;
        const [y, mo, d] = String(mc.date).split("-").map(Number);
        const [h, mi]    = String(mc.time).split(":").map(Number);
        const startMs = localToUtcMs(y, mo ?? 1, d, h ?? 0, mi ?? 0);
        const diffMin = (startMs - now) / 60_000;
        if (diffMin >= REMIND_MIN && diffMin < REMIND_MAX) {
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

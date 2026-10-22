// api/cal/webhook.ts — Webhook Cal.com → push natif instantané
//
// Remplace le polling (cron Vercel limité à 1x/jour sur le plan Hobby).
// Cal.com appelle cet endpoint dès qu'une réservation est créée/annulée,
// la notif part dans la seconde.
//
// URL à configurer dans Cal.com :
//   https://<domaine>/api/cal/webhook?token=<CAL_WEBHOOK_SECRET>
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { SB_URL, APP_TZ, sbHeaders } from "../_lib/server.js";
import { metaGet, metaSet } from "../_lib/push.js";
import webpush from "web-push";

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || "mailto:hugo@agencemade.com";
const WEBHOOK_TOKEN = process.env.CAL_WEBHOOK_SECRET || "";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

// Cal.com renvoie les réponses du formulaire sous plusieurs formes selon la
// version : "valeur", ["valeur"], { value: "valeur" } ou { value: ["valeur"] }.
function pick(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return typeof v[0] === "string" ? v[0] : "";
  if (typeof v === "object" && "value" in v) return pick((v as any).value);
  return "";
}

async function sendToAll(payload: object): Promise<number> {
  const r = await fetch(`${SB_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: sbHeaders(),
  });
  const subs: any[] = await r.json();
  if (!subs?.length) return 0;

  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any,
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      // 410 Gone = abonnement mort (navigateur désinstallé / cache vidé)
      if (err.statusCode === 410) {
        await fetch(
          `${SB_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
          { method: "DELETE", headers: sbHeaders() }
        );
      }
    }
  }
  return sent;
}

// Cherche les paramètres utm_* où que Cal les range (tracking, metadata, responses…)
function findUtm(obj: any, out: Record<string, string> = {}, depth = 0): Record<string, string> {
  if (!obj || typeof obj !== "object" || depth > 4) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = k.toLowerCase().replace(/^utm/, "utm_").replace("utm__", "utm_");
    if (/^utm_(source|medium|campaign|content|term)$/.test(key) && typeof v === "string" && v) out[key] = v.slice(0, 120);
    else if (v && typeof v === "object") findUtm(v, out, depth + 1);
  }
  return out;
}

async function markNotified(id: number) {
  const r = await fetch(`${SB_URL}/rest/v1/task_meta?notion_id=eq.__cal_notified__&limit=1`, {
    headers: sbHeaders(),
  });
  const rows: any[] = await r.json().catch(() => []);
  const seen: number[] = rows?.[0]?.completed_at ? JSON.parse(rows[0].completed_at) : [];
  if (seen.includes(id)) return;
  await fetch(`${SB_URL}/rest/v1/task_meta`, {
    method: "POST",
    headers: sbHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }),
    body: JSON.stringify({
      notion_id: "__cal_notified__", business: "__snapshot__", priority: "normale",
      time: null, completed_at: JSON.stringify([...seen, id].slice(-100)),
      updated_at: new Date().toISOString(),
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ping de vérification depuis le navigateur
  if (req.method === "GET") return res.status(200).json({ ok: true, endpoint: "cal-webhook" });
  if (req.method !== "POST") return res.status(405).end();

  // Le secret vit dans l'URL du webhook, connue de Cal.com seul.
  if (WEBHOOK_TOKEN && req.query?.token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: "bad token" });
  }

  try {
    const body: any = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const trigger: string = body?.triggerEvent ?? "";
    const p: any = body?.payload ?? {};

    const attendee = p.attendees?.[0] ?? {};
    const name     = attendee.name || pick(p.responses?.name) || "Inconnu";

    const start   = new Date(p.startTime ?? p.start ?? Date.now());
    const dateStr = start.toLocaleDateString("fr-FR", {
      weekday: "short", day: "numeric", month: "short", timeZone: APP_TZ,
    });
    const timeStr = start.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: APP_TZ,
    });

    // Réponses du formulaire de qualification (identifiants du lien
    // "Appel Coaching & Académie").
    const r = { ...(p.responses ?? {}), ...(p.userFieldsResponses ?? {}) };
    const budget    = pick(r["budget"]);
    const temps     = pick(r["temps-disponible"]);
    const niveau    = pick(r["connaissance-ecom"]);
    const situation = pick(r["situation-actuelle"]);

    // Le corps d'une push mobile n'affiche que ~2 lignes : on garde les
    // signaux de qualification les plus actionnables.
    const tags = [budget, temps, niveau, situation].filter(Boolean).join(" · ");

    let title: string;
    if (trigger === "BOOKING_CANCELLED") {
      title = `❌ Call annulé — ${name}`;
    } else if (trigger === "BOOKING_RESCHEDULED") {
      title = `🔄 Call replanifié — ${name}`;
    } else {
      title = `📞 Nouveau call — ${name}`;
    }

    const sent = await sendToAll({
      title,
      body: `${dateStr} à ${timeStr}${tags ? ` · ${tags}` : ""}`,
      tag:  `cal-hook-${p.uid ?? p.bookingId ?? start.getTime()}`,
      url:  "/",
    });

    // Marque le call comme déjà notifié pour que le cron api/push/notify.ts
    // n'envoie pas un 2e « Nouveau call » pour la même réservation.
    const bookingId = Number(p.bookingId ?? p.id);
    if (trigger === "BOOKING_CREATED" && Number.isFinite(bookingId)) {
      await markNotified(bookingId);
      // Source de la réservation, pour la fiche prospect
      const utm = findUtm(p);
      const fiche: any = (await metaGet(`prospect:${bookingId}`)) ?? {};
      await metaSet(`prospect:${bookingId}`, { ...fiche, source: { ...utm, capte: new Date().toISOString() } });
    }

    return res.status(200).json({ ok: true, trigger, sent });
  } catch (err) {
    console.error("cal webhook error:", err);
    // On répond 200 : un 5xx ferait retenter Cal.com en boucle pour rien.
    return res.status(200).json({ ok: false, error: String(err) });
  }
}

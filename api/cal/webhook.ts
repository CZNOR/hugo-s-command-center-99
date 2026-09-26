// api/cal/webhook.ts — Webhook Cal.com → push natif instantané
//
// Remplace le polling (cron Vercel limité à 1x/jour sur le plan Hobby).
// Cal.com appelle cet endpoint dès qu'une réservation est créée/annulée,
// la notif part dans la seconde.
//
// URL à configurer dans Cal.com :
//   https://<domaine>/api/cal/webhook?token=<CAL_WEBHOOK_SECRET>
import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";

const SB_URL        = process.env.VITE_SUPABASE_URL!;
const SB_KEY        = process.env.VITE_SUPABASE_ANON_KEY!;
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
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
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
          { method: "DELETE", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
        );
      }
    }
  }
  return sent;
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
      weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris",
    });
    const timeStr = start.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
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
      url:  "/coaching/leads",
    });

    return res.status(200).json({ ok: true, trigger, sent });
  } catch (err) {
    console.error("cal webhook error:", err);
    // On répond 200 : un 5xx ferait retenter Cal.com en boucle pour rien.
    return res.status(200).json({ ok: false, error: String(err) });
  }
}

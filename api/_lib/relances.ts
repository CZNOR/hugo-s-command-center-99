// api/_lib/relances.ts — Qui relancer, et qui n'a pas encore été noté
// Même calcul que l'app (src/lib/messages.ts), fait côté serveur : il sert aux
// notifs « relances du jour » et aux sessions Claude (tools/dring_fiches.py).
import { calHeaders } from "./server.js";
import { metaGetMany } from "./push.js";
import { toCall, type Call } from "../../src/lib/booking.js";
import { etatMessage, plan, quandLisible, suiviEffectif } from "../../src/lib/messages.js";
import type { Fiche } from "../../src/lib/prospect.js";

const JOURS = 45; // les relances courent jusqu'à J+30 après l'appel

export interface Relance {
  id: number; nom: string; appel: string;          // appel : date lisible de l'appel
  type: "a-envoyer" | "a-noter" | "a-venir";
  titre: string; quand: string; quandIso: string; etat: string; texte: string;
}

export async function calculerRelances(now = Date.now()): Promise<{ aEnvoyer: Relance[]; aNoter: Relance[]; aVenir: Relance[] }> {
  const r = await fetch("https://api.cal.com/v2/bookings?status=past&limit=150&sortStart=desc", { headers: calHeaders });
  const json: any = await r.json().catch(() => ({}));
  const appels: Call[] = (Array.isArray(json?.data) ? json.data : [])
    .filter((b: any) => b.status !== "cancelled" && b.status !== "rejected")
    .map(toCall)
    .filter((c: Call) => c.start.getTime() > now - JOURS * 86_400_000 && c.end.getTime() < now);
  const fiches = await metaGetMany<Fiche>(appels.map((c) => `prospect:${c.id}`));

  const aEnvoyer: Relance[] = [], aNoter: Relance[] = [], aVenir: Relance[] = [];
  for (const c of appels) {
    const appel = quandLisible(c.start, now);
    const su = fiches[`prospect:${c.id}`]?.suivi;
    if (su && suiviEffectif(su, c.end).stop) continue; // « ne plus relancer »
    // Appel passé sans rien de noté : à remplir (dans les 7 derniers jours seulement)
    if (!su?.venu || (su.venu === "venu" && !su.resultat)) {
      if (c.start.getTime() > now - 7 * 86_400_000) {
        aNoter.push({ id: c.id, nom: c.name, appel, type: "a-noter", titre: "Appel à noter dans la fiche", quand: appel, quandIso: c.start.toISOString(), etat: "a-noter", texte: "" });
      }
      continue;
    }
    const eff = suiviEffectif(su, c.end);
    const pl = plan(c, eff);
    const m = pl?.messages.find((x) => !su.envoyes?.includes(x.id));
    if (!m) continue;
    const etat = etatMessage(m, su, now);
    const item: Relance = { id: c.id, nom: c.name, appel, type: "a-envoyer", titre: m.titre, quand: quandLisible(m.quand, now), quandIso: m.quand.toISOString(), etat, texte: m.texte };
    if (etat === "retard" || etat === "aujourdhui") aEnvoyer.push(item);
    else if (m.quand.getTime() < now + 7 * 86_400_000) aVenir.push({ ...item, type: "a-venir" });
  }
  const parDate = (a: Relance, b: Relance) => a.quandIso.localeCompare(b.quandIso);
  return { aEnvoyer: aEnvoyer.sort(parDate), aNoter: aNoter.sort(parDate), aVenir: aVenir.sort(parDate) };
}

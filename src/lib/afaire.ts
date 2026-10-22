// Ce qu'Hugo doit faire aujourd'hui : messages dus (ou en retard) et appels pas encore notés
import type { Call } from "./booking.js";
import type { Fiche } from "./prospect.js";
import { etatMessage, prochain, suiviEffectif } from "./messages.js";

export interface AFaire { c: Call; titre: string; quand: Date; e: "retard" | "aujourdhui" | "noter" }

export function aFaire(suivis: Call[], recents: Call[], fiches: Record<number, Fiche>, now: number): AFaire[] {
  const dus: AFaire[] = suivis.flatMap((c) => {
    const su = fiches[c.id]?.suivi;
    const m = su ? prochain(c, su) : null;
    if (!m || !su) return [];
    const e = etatMessage(m, su, now);
    return e === "retard" || e === "aujourdhui" ? [{ c, titre: m.titre, quand: m.quand, e }] : [];
  }).sort((a, b) => a.quand.getTime() - b.quand.getTime());
  const aNoter: AFaire[] = recents.filter((c) => {
    const su = fiches[c.id]?.suivi;
    if (su && suiviEffectif(su, c.end).stop) return false;
    return !su?.venu || (su.venu === "venu" && !su.resultat);
  }).map((c) => ({ c, titre: "Appel à noter dans la fiche", quand: c.start, e: "noter" as const }));
  return [...dus, ...aNoter];
}

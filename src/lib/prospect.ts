// Analyse d'un prospect à partir de sa réservation Cal : alertes, offre conseillée,
// questions de découverte et messages de relance. Tout est calculé dans l'app.
import type { Call } from "./cal";
import { TZ } from "./cal";
import { GROUPES } from "@/content/liens";

export interface Fiche {
  source?: Record<string, string>;
  suivi?: { venu?: "venu" | "absent"; resultat?: Resultat; note?: string; maj?: string };
  historique?: { quand: string; venu: string | null; resultat: string | null }[];
}
export type Resultat = "interesse" | "relancer" | "pas-interesse" | "signe";

export const RESULTATS: { id: Resultat; label: string }[] = [
  { id: "interesse", label: "Intéressé" },
  { id: "relancer", label: "À relancer" },
  { id: "pas-interesse", label: "Pas intéressé" },
  { id: "signe", label: "Signé" },
];

const prenom = (c: Call) => c.name.trim().split(/\s+/)[0] ?? "";

// ── Budget : les réponses du formulaire, ramenées à un palier ──────────────
type Palier = "moins-500" | "500-1500" | "plus-1500" | "inconnu";
export function palier(c: Call): Palier {
  const b = (c.raw.budget ?? "").toLowerCase().replace(/\s/g, "");
  if (!b) return "inconnu";
  if (/plusde1500/.test(b)) return "plus-1500";
  if (/500.*(1500|1000)/.test(b)) return "500-1500";
  if (/moinsde(100|500)|100€?et500|100et500/.test(b)) return "moins-500";
  return "inconnu";
}

const avance = (c: Call) =>
  /expert|génère|genere|chiffre/i.test(`${c.raw.niveau ?? ""} ${c.raw["connaissance-ecom"] ?? ""}`) ||
  /croissance|cap/i.test(c.raw["objectif-principal"] ?? "");
const beaucoupDeTemps = (c: Call) => /10h|20h|temps plein/i.test(c.raw["temps-disponible"] ?? "");

// ── Signaux d'alerte → badge « à confirmer » ──────────────────────────────
const NOMS_BIDON = /^(test|aaa+|azerty|qwerty|cacca|caca|toto|titi|lol|xxx+|abc|bite|zizi|pipi)$/i;

export function alertes(c: Call): string[] {
  const out: string[] = [];
  const nom = c.name.trim();
  if (nom.length < 3 || NOMS_BIDON.test(nom) || /\d/.test(nom) || !/[aeiouyéèàù]/i.test(nom)) out.push("Nom fantaisiste");
  const m = c.email.toLowerCase().match(/^([^@]+)@gmail\.com$/);
  if (m && m[1].length < 6) out.push(`Mail Gmail de ${m[1].length} caractères`);
  if (c.createdAt) {
    const h = Number(c.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", hour12: false, timeZone: TZ }).slice(0, 2));
    if (h >= 1 && h < 6) out.push(`Réservé à ${c.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ })} du matin`);
  }
  if (palier(c) === "moins-500") out.push("Budget sous 500 €");
  return out;
}

// ── Offre conseillée ──────────────────────────────────────────────────────
export interface Offre { nom: string; prix: string; pourquoi: string; liens: { label: string; url: string }[] }

// Liens de paiement d'une offre, avec un libellé court pour les boutons (« 1 fois · 1 497 € »)
const liensDe = (titre: string) =>
  (GROUPES.find((g) => g.title === titre)?.liens ?? []).map((l) => ({
    label: l.label.replace(/^En /, "").replace("échéances", "suivi") + (l.detail ? ` · ${l.detail.replace(" au total", "")}` : ""),
    url: l.url,
  }));

export function offre(c: Call): Offre | null {
  const p = palier(c);
  if (p === "moins-500") return null;
  if (p === "plus-1500" && avance(c)) {
    return {
      nom: "Coaching +", prix: "4 998 € · ou 3 × 1 665 €",
      pourquoi: "Budget au-dessus de 1 500 € et déjà lancé : il lui faut un accompagnement, pas une formation seule.",
      liens: liensDe("Paiement · Coaching +"),
    };
  }
  if (p === "plus-1500") {
    return {
      nom: "Académie", prix: "1 497 € · ou Académie + suivi 3 500 €",
      pourquoi: beaucoupDeTemps(c)
        ? "Budget au-dessus de 1 500 € et du temps à y mettre : l'Académie, ou le suivi MADE s'il veut aller vite."
        : "Budget au-dessus de 1 500 € : l'Académie colle, le suivi MADE s'il veut être accompagné.",
      liens: [...liensDe("Paiement · Académie").slice(0, 1), ...liensDe("Paiement · Académie + suivi MADE")],
    };
  }
  return {
    nom: "Académie", prix: "3 × 499 € · ou 1 497 € en 1 fois",
    pourquoi: p === "500-1500"
      ? "Budget entre 500 et 1 500 € : l'Académie en 3 fois passe mieux."
      : "Budget inconnu : demande-le en appel, l'Académie est le point d'entrée.",
    liens: [...liensDe("Paiement · Académie")].reverse(),
  };
}

// ── 3 questions de découverte, selon ses réponses ─────────────────────────
export function questions(c: Call): string[] {
  const q: string[] = [];
  const sit = c.raw["situation-actuelle"] ?? "";
  const temps = c.raw["temps-disponible"] ?? "";
  if (/salari/i.test(sit)) q.push("Tu es salarié : tu te vois lancer ta marque en parallèle, ou quitter ton job à terme ?");
  else if (/indépendant|chef/i.test(sit)) q.push("Tu as déjà une activité : qu'est-ce que l'e-commerce doit t'apporter en plus ?");
  else if (/étudiant/i.test(sit)) q.push("Tu es étudiant : combien de temps tu peux vraiment y mettre pendant les cours ?");
  else q.push("Raconte-moi où tu en es aujourd'hui, en 2 phrases.");

  if (avance(c)) q.push("Qu'est-ce qui bloque aujourd'hui pour passer le cap suivant ? Ton chiffre actuel ?");
  else if (temps) q.push(`Tu as indiqué « ${temps.toLowerCase()} » : c'est le soir, le week-end ? Qu'est-ce qui t'a bloqué jusqu'ici ?`);
  else q.push("Combien d'heures par semaine tu peux y consacrer, honnêtement ?");

  q.push(palier(c) === "moins-500" || palier(c) === "inconnu"
    ? "Si on trouve la bonne formule, quel budget tu peux mettre pour te lancer ?"
    : "Dans 6 mois, ça ressemble à quoi pour toi, une réussite ?");
  return q;
}

// ── Messages prêts à copier ───────────────────────────────────────────────
export function messageConfirmation(c: Call): string {
  const quand = c.start.toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: TZ });
  return `Salut ${prenom(c)} ! C'est Hugo, je confirme notre appel ${quand} ? Réponds juste « ok » 🙏`;
}

export function relances(c: Call, o: Offre | null): { j1: string; j3: string } {
  const lien = o?.liens[0]?.url;
  return {
    j1: `Salut ${prenom(c)}, merci pour l'appel d'hier !${lien ? ` Comme promis, le lien pour ${o!.nom} : ${lien}` : ""} Dis-moi si tu as des questions 🙂`,
    j3: `Hello ${prenom(c)}, tu as pu y réfléchir ? Je garde ta place jusqu'à la fin de la semaine.`,
  };
}

// Source lisible : « TikTok · bio » à partir des utm_*
export function sourceLisible(src?: Record<string, string>): string | null {
  if (!src?.utm_source) return null;
  const s = src.utm_source.toLowerCase();
  const nom = /tiktok|tt/.test(s) ? "TikTok" : /insta|ig/.test(s) ? "Instagram" : /you ?tube|yt/.test(s) ? "YouTube" : /academie|site|bnls/.test(s) ? "Site Académie" : src.utm_source;
  const detail = [src.utm_medium, src.utm_content, src.utm_campaign].filter(Boolean).join(" · ");
  return detail ? `${nom} · ${detail}` : nom;
}

// ── Visite du site (envoyée par hugo-bnls.fr au clic sur « Réserver ») ─────
export interface Visite {
  quand: string; bouton: string; duree_s: number; provenance: string; appareil: string;
  pages: { page: string; lu: number; s: number }[]; faq: string[];
  utm: Record<string, string>; visites: number; premiere: string;
}

// La visite dont le clic précède la réservation de 0 à 45 min (le plus proche)
export function visiteDe(c: Call, visites: Visite[]): Visite | null {
  if (!c.createdAt) return null;
  const t = c.createdAt.getTime();
  let best: Visite | null = null, ecart = Infinity;
  for (const v of visites) {
    const d = t - new Date(v.quand).getTime();
    if (d >= -2 * 60_000 && d <= 45 * 60_000 && Math.abs(d) < ecart) { best = v; ecart = Math.abs(d); }
  }
  return best;
}

export const duree = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")}`);

export function provenanceLisible(v: Visite): string {
  const p = v.provenance.toLowerCase();
  return /tiktok/.test(p) ? "TikTok" : /instagram/.test(p) ? "Instagram" : /google/.test(p) ? "Google" : /youtube/.test(p) ? "YouTube" : p === "direct" ? "Accès direct" : v.provenance;
}

const PAGES: Record<string, string> = { accueil: "Accueil", academie: "Page Académie", "academie/chine": "Page Chine" };
export const pageLisible = (p: string) => PAGES[p] ?? p;

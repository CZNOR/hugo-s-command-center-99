// Messages de suivi après l'appel : 3 messages datés, recalculés à chaque info notée
// sur la fiche (venu, résultat, produit, modalité, frein, date de rappel, note).
// Tout est calculé dans l'app, sans IA payante : des scénarios écrits à la main,
// avec des variantes par frein et par produit. L'app n'envoie rien : Hugo copie.
import type { Call } from "./booking.js";
import { TZ } from "./tz.js";
import { GROUPES } from "../content/liens.js";
import { offre, type Frein, type Modalite, type Produit, type Suivi } from "./prospect.js";

export interface Message {
  id: string;        // stable : sert à cocher « envoyé »
  quand: Date;       // date et heure conseillées
  titre: string;     // à quoi sert ce message
  texte: string;
}

export interface Plan {
  resume: string;    // la stratégie en une phrase
  messages: Message[];
}

const ESPACE = "https://made-academie.vercel.app/login";

const PRIX: Record<Produit, Partial<Record<Modalite, string>>> = {
  academie: { "1fois": "1 497 €", "3fois": "3 × 499 €" },
  coaching: { "1fois": "4 998 €", "3fois": "3 × 1 665 €" },
  suivi: { echeances: "3 500 € en échéances" },
  ads: { "1fois": "3 000 €", "3fois": "3 × 1 000 €/mois" },
};

// ── Lien de paiement selon le produit et la modalité ─────────────────────
function lien(produit: Produit, modalite: Modalite): string {
  if (produit === "ads") return ""; // pas de lien GoCardless pour le coaching ads : Hugo l'envoie à part
  const titre = produit === "academie" ? "Paiement · Académie" : produit === "coaching" ? "Paiement · Coaching +" : "Paiement · Académie + suivi MADE";
  const liens = GROUPES.find((g) => g.title === titre)?.liens ?? [];
  const cible = modalite === "3fois" ? "En 3 fois" : modalite === "echeances" ? "En échéances" : "En 1 fois";
  return (liens.find((l) => l.label === cible) ?? liens[0])?.url ?? "";
}

// ── Dates en heure de Paris ──────────────────────────────────────────────
// Créneaux qui marchent pour un message perso : 12h15 (pause déj) et 18h30 (sortie du travail)
// Décalage (ms) entre Paris et UTC à un instant donné, heure d'été comprise
function decalage(utcMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const v = (t: string) => Number(parts.find((x) => x.type === t)?.value);
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second")) - utcMs;
}

// Le jour « base + jours » à h:m, heure de Paris
function aParis(base: Date, jours: number, h: number, m: number): Date {
  const jour = new Date(base.getTime() + jours * 86_400_000).toLocaleDateString("fr-CA", { timeZone: TZ });
  const [y, mo, d] = jour.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, m);
  return new Date(guess - decalage(guess - decalage(guess)));
}

// Le dimanche, on décale au lundi
function ouvrable(d: Date): Date {
  const jour = d.toLocaleDateString("en-US", { weekday: "short", timeZone: TZ });
  return jour === "Sun" ? new Date(d.getTime() + 86_400_000) : d;
}

const midi = (base: Date, j: number) => ouvrable(aParis(base, j, 12, 15));
const soir = (base: Date, j: number) => ouvrable(aParis(base, j, 18, 30));

// Le soir même si l'appel finit avant 17 h 30, sinon le lendemain midi
function apresAppel(c: Call): Date {
  const fin = c.end.getTime();
  const ceSoir = aParis(c.end, 0, 18, 30);
  return fin < ceSoir.getTime() - 60 * 60_000 ? ceSoir : midi(c.end, 1);
}

function dateRappel(s: Suivi): Date | null {
  if (!s.rappel || !/^\d{4}-\d{2}-\d{2}$/.test(s.rappel)) return null;
  return ouvrable(aParis(new Date(`${s.rappel}T12:00:00Z`), 0, 12, 15));
}

const plus = (d: Date, jours: number, h = 18, m = 30) => ouvrable(aParis(d, jours, h, m));

// ── Lecture de la note : frein, date de rappel, produit et paiement devinés ──
// Les dates relatives (« demain », « jeudi », « le 27 ») partent du jour de l'appel,
// pas d'aujourd'hui : une note écrite le 20 qui dit « demain » vise le 21.
const iso = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export interface NoteLue { frein?: Frein; rappel?: string; produit?: Produit; modalite?: Modalite }

export function lireNote(note: string, ref: Date = new Date()): NoteLue {
  const n = note.toLowerCase();
  const [ry, rm, rd] = ref.toLocaleDateString("fr-CA", { timeZone: TZ }).split("-").map(Number);
  const refJour = new Date(Date.UTC(ry, rm - 1, rd));
  const decale = (j: number) => { const x = new Date(refJour.getTime() + j * 86_400_000); return iso(x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()); };

  // Date de rappel : jour de la semaine, « demain », « le 27 » ou « le 3/11 », puis « début de mois »
  let rappel: string | undefined;
  const verbe = "(rappeler|relancer|recontacter|revenir|reprendre|rappel|relance)";
  const jours = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const j = n.match(new RegExp(verbe + ".{0,20}?\\b(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|après-demain)\\b"));
  if (j) {
    if (j[2] === "demain") rappel = decale(1);
    else if (j[2] === "après-demain") rappel = decale(2);
    else rappel = decale(((jours.indexOf(j[2]) - refJour.getUTCDay() + 7) % 7) || 7);
  }
  const d = !rappel && n.match(new RegExp(verbe + ".{0,15}?\\ble (\\d{1,2})(?:\\/(\\d{1,2}))?\\b"));
  if (d) {
    const jour = Number(d[2]);
    let mois = d[3] ? Number(d[3]) : rm;
    let an = ry;
    if (!d[3] && jour < rd) mois += 1;          // « le 3 » écrit le 20 : le 3 du mois suivant
    if (d[3] && mois < rm) an += 1;
    if (mois > 12) { mois -= 12; an += 1; }
    if (jour >= 1 && jour <= 31) rappel = iso(an, mois, jour);
  }
  if (!rappel && /début (de|du) mois/.test(n)) rappel = rm === 12 ? iso(ry + 1, 1, 1) : iso(ry, rm + 1, 1);

  // Frein
  const frein: Frein | undefined =
    /début (de|du) mois|fin du mois|salaire|paie|virement/.test(n) ? "date-paiement"
    : /cher|prix|budget|argent|moyens|financ/.test(n) ? "prix"
    : /copine|copain|femme|mari|conjoint|associ|parents|famille|en parler/.test(n) ? "entourage"
    : /temps|dispo|boulot|travail|charg/.test(n) ? "temps"
    : /réfléchir|reflechir|hésite|hesite|penser/.test(n) ? "reflechir"
    : /pas le moment|plus tard|mois prochain|rentrée|janvier|après les fêtes/.test(n) ? "moment"
    : /confiance|arnaque|preuve|avis|résultats/.test(n) ? "confiance"
    : undefined;

  // Produit et paiement
  const produit: Produit | undefined =
    /\bads\b|pub|meta ads|facebook ads/.test(n) ? "ads"
    : /suivi/.test(n) ? "suivi"
    : /coaching/.test(n) ? "coaching"
    : /formation|académie|academie/.test(n) ? "academie"
    : undefined;
  const modalite: Modalite | undefined =
    /3 ?(fois|x)|par mois|\/ ?mois|mensualit/.test(n) ? "3fois"
    : /1 ?fois|cash|comptant|en une fois/.test(n) ? "1fois"
    : undefined;

  return { frein, rappel, produit, modalite };
}

// Suivi complété par la note : ce qu'Hugo a coché passe avant, la note comble les trous
export function suiviEffectif(s: Suivi, ref?: Date): Suivi {
  // « demain » part du jour où la note a été écrite ; à défaut, du jour de l'appel
  const lu = s.note ? lireNote(s.note, s.noteLe ? new Date(s.noteLe) : ref) : {};
  const produit = s.produit ?? lu.produit;
  return {
    ...s,
    frein: s.frein ?? lu.frein,
    rappel: s.rappel ?? lu.rappel,
    produit,
    modalite: s.modalite ?? (produit === "suivi" ? "echeances" : lu.modalite),
  };
}

// ── Les scénarios ────────────────────────────────────────────────────────
// Règles d'Hugo : des messages courts, comme un texto, et jamais de lien de paiement
// en relance. Le lien part seulement quand le prospect dit oui (bouton « s'il dit oui »).
const COURT: Record<Produit, string> = { academie: "l'Académie", coaching: "le coaching", suivi: "l'Académie avec le suivi", ads: "le coaching ads" };

export function plan(c: Call, s: Suivi): Plan | null {
  if (!s.venu) return null;
  const p = c.name.trim().split(/\s+/)[0] || "";
  const heure = c.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(":", "h");

  // Pas venu : on prend des nouvelles, on propose un autre moment, puis on lâche
  if (s.venu === "absent") {
    return {
      resume: "Pas venu : prendre des nouvelles, proposer un autre moment, puis lâcher.",
      messages: [
        { id: "absent-1", quand: new Date(c.start.getTime() + 15 * 60_000), titre: "Juste après",
          texte: `Hello ${p}, je t'attendais pour l'appel de ${heure}, tout va bien ?` },
        { id: "absent-2", quand: midi(c.start, 1), titre: "Le lendemain",
          texte: `Re ${p} ! Tu veux qu'on cale un autre moment cette semaine ?` },
        { id: "absent-3", quand: soir(c.start, 4), titre: "Dernier message",
          texte: `${p}, je te laisse tranquille. Si tu veux en reparler, fais-moi signe 🙂` },
      ],
    };
  }

  if (!s.resultat) return null;
  const produit: Produit = s.produit ?? (offre(c)?.nom === "Coaching +" ? "coaching" : "academie");
  const court = COURT[produit];
  const rappel = dateRappel(s);
  const base = apresAppel(c);

  // Signé : l'accès, puis on vérifie qu'il démarre
  if (s.resultat === "signe") {
    const seance = produit === "coaching" || produit === "ads";
    return {
      resume: "Signé : l'accès tout de suite, puis on vérifie qu'il démarre bien.",
      messages: [
        { id: "signe-1", quand: new Date(c.end.getTime() + 30 * 60_000), titre: "Bienvenue",
          texte: seance
            ? `Bienvenue ${p} 🎉 Envoie-moi tes dispos de la semaine, on cale la première séance.`
            : `Bienvenue ${p} 🎉 Ton accès : ${ESPACE}\nDis-moi quand tu es connecté.` },
        { id: "signe-2", quand: midi(c.end, 1), titre: "Le lendemain",
          texte: seance ? `Tu as pu regarder tes dispos ?` : `Ça a marché pour te connecter ?` },
        { id: "signe-3", quand: soir(c.end, 7), titre: "Une semaine après",
          texte: `Alors ${p}, cette première semaine ?` },
      ],
    };
  }

  // Pas intéressé : on remercie et on garde le contact
  if (s.resultat === "pas-interesse") {
    return {
      resume: "Pas intéressé : remercier, garder le contact, reprendre des nouvelles dans 1 et 3 mois.",
      messages: [
        { id: "non-1", quand: base, titre: "Merci",
          texte: `Merci pour ton temps ${p} ! Je fais des lives presque tous les soirs sur TikTok (@hugo.bnls) si tu veux passer 🙂` },
        { id: "non-2", quand: midi(c.end, 30), titre: "Dans un mois",
          texte: `Hello ${p}, ça avance ton projet ?` },
        { id: "non-3", quand: midi(c.end, 90), titre: "Dans trois mois",
          texte: `Hello ${p} ! Ça fait un moment, tu en es où ?` },
      ],
    };
  }

  // Intéressé ou à relancer : 1er message selon le frein, à la date notée s'il y en a une
  const ecart: Record<Frein, number> = { prix: 1, "date-paiement": 7, temps: 1, entourage: 2, reflechir: 1, moment: 14, confiance: 1, autre: 2 };
  const interesse = s.resultat === "interesse";
  const t1 = rappel ?? (interesse && !s.frein ? base : midi(c.end, ecart[s.frein ?? "autre"]));
  const t2 = plus(t1, s.frein === "moment" ? 7 : 2, 12, 15);
  const t3 = plus(t2, s.frein === "moment" ? 14 : 3);
  // À la date convenue : « on lance ? » s'il était intéressé, une question s'il était à relancer
  const premier = rappel
    ? interesse
      ? `Hello ${p} ! Comme convenu je reviens vers toi 🙂 On lance ${court} ?`
      : `Hello ${p} ! Comme convenu je reviens vers toi 🙂 ${QUESTION[s.frein ?? "autre"]}`
    : interesse && !s.frein
      ? `Merci pour l'appel ${p} ! Je t'envoie le lien pour démarrer ${court} ?`
      : leverFrein(p, s.frein) ?? `Hello ${p}, tu as pu y repenser depuis notre appel ?`;
  return {
    resume: rappel
      ? `Reprise convenue le ${quandLisible(rappel).toLowerCase()} : rien avant, puis 2 relances courtes.`
      : `${interesse ? "Intéressé" : "À relancer"}${s.frein ? ` (${libelleFrein(s.frein)})` : ""} : 3 messages courts, le lien seulement s'il dit oui.`,
    messages: [
      { id: rappel ? "suite-r1" : "suite-1", quand: t1, titre: rappel ? "À la date convenue" : s.frein ? `Son frein : ${libelleFrein(s.frein)}` : "Premier message", texte: premier },
      { id: "suite-2", quand: t2, titre: "Petite relance",
        texte: `Re ${p} ! Dis-moi juste si c'est toujours d'actualité pour toi.` },
      { id: "suite-3", quand: t3, titre: "Dernier message",
        texte: `${p}, je te laisse tranquille. Si tu veux en reparler, je suis là 🙂` },
    ],
  };
}

function libelleFrein(f: Frein): string {
  return { prix: "le prix", "date-paiement": "paie à une date précise", temps: "le temps", entourage: "en parler à un proche", reflechir: "veut réfléchir", moment: "pas le bon moment", confiance: "pas encore confiance", autre: "autre" }[f];
}

// La question de reprise « à la date convenue », selon son frein
const QUESTION: Record<Frein, string> = {
  prix: "On peut le faire en 3 fois si ça t'aide, ça change quelque chose ?",
  "date-paiement": "C'est bon pour toi de ton côté ?",
  temps: "Tu as pu voir comment caser ça dans ta semaine ?",
  entourage: "Tu as pu en parler ?",
  reflechir: "Tu as pu y réfléchir ?",
  moment: "Ça a bougé de ton côté ?",
  confiance: "Tu veux que je t'envoie des retours d'élèves ?",
  autre: "Tu as pu y réfléchir ?",
};

// Le premier message, selon ce qui le bloque : une phrase, une question
function leverFrein(p: string, f: Frein | undefined): string | null {
  switch (f) {
    case "prix": return `Hello ${p}, j'ai repensé à notre appel : on peut le faire en 3 fois si ça t'aide. Ça change quelque chose ?`;
    case "date-paiement": return `Hello ${p}, comme convenu je reviens vers toi 🙂 On lance ?`;
    case "temps": return `Hello ${p}, pour le temps, on peut l'organiser selon ta semaine. Tu veux qu'on en parle 5 min ?`;
    case "entourage": return `Hello ${p}, tu as pu en parler ? Je peux répondre à ses questions si tu veux.`;
    case "reflechir": return `Hello ${p}, tu as pu y réfléchir ? Qu'est-ce qui te fait hésiter ?`;
    case "moment": return `Hello ${p}, ça a bougé de ton côté depuis notre appel ?`;
    case "confiance": return `Hello ${p}, si ça peut t'aider, je t'envoie des retours d'élèves ?`;
    default: return null;
  }
}

// Le lien à envoyer quand il dit oui (aucun pour le coaching ads)
export function lienSiOui(s: Suivi, c: Call): { label: string; url: string }[] {
  const produit: Produit = s.produit ?? (offre(c)?.nom === "Coaching +" ? "coaching" : "academie");
  if (produit === "ads") return [];
  if (produit === "suivi") return [{ label: "Échéances · 3 500 €", url: lien("suivi", "echeances") }];
  const prix = PRIX[produit];
  return (["1fois", "3fois"] as Modalite[]).map((m) => ({ label: `${m === "1fois" ? "1 fois" : "3 fois"} · ${prix[m]}`, url: lien(produit, m) }));
}

// ── Affichage des dates ───────────────────────────────────────────────────
export function quandLisible(d: Date, now = Date.now()): string {
  const k = (x: Date) => x.toLocaleDateString("fr-CA", { timeZone: TZ });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(":", "h");
  const auj = new Date(now);
  if (k(d) === k(auj)) return `Aujourd'hui ${heure}`;
  if (k(d) === k(new Date(now + 86_400_000))) return `Demain ${heure}`;
  if (k(d) === k(new Date(now - 86_400_000))) return `Hier ${heure}`;
  return `${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ })} · ${heure}`;
}

// État d'un message : déjà envoyé, en retard, à faire aujourd'hui, ou plus tard
export function etatMessage(m: Message, s: Suivi, now = Date.now()): "envoye" | "retard" | "aujourdhui" | "plus-tard" {
  if (s.envoyes?.includes(m.id)) return "envoye";
  const k = (x: Date) => x.toLocaleDateString("fr-CA", { timeZone: TZ });
  if (k(m.quand) === k(new Date(now))) return m.quand.getTime() < now - 3 * 3600_000 ? "retard" : "aujourdhui";
  return m.quand.getTime() < now ? "retard" : "plus-tard";
}

// Prochain message à envoyer (pour la liste « À envoyer aujourd'hui » de l'accueil)
export function prochain(c: Call, s: Suivi | undefined): Message | null {
  if (!s) return null;
  const pl = plan(c, suiviEffectif(s, c.end));
  return pl?.messages.find((m) => !s.envoyes?.includes(m.id)) ?? null;
}

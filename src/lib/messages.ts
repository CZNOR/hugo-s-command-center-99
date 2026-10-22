// Messages de suivi après l'appel : 3 messages datés, recalculés à chaque info notée
// sur la fiche (venu, résultat, produit, modalité, frein, date de rappel, note).
// Tout est calculé dans l'app, sans IA payante : des scénarios écrits à la main,
// avec des variantes par frein et par produit. L'app n'envoie rien : Hugo copie.
import type { Call } from "./cal";
import { TZ } from "./cal";
import { GROUPES } from "@/content/liens";
import { offre, type Frein, type Modalite, type Produit, type Suivi } from "./prospect";

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

const CAL = "https://cal.com/team/made-academie/appel-coaching-academie";
const ESPACE = "https://made-academie.vercel.app/login";

const NOMS: Record<Produit, string> = { academie: "l'Académie", coaching: "le Coaching +", suivi: "l'Académie + suivi MADE", ads: "le coaching ads" };
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

// « : <lien> », ou la promesse d'envoyer le lien quand il n'existe pas encore (coaching ads)
const avecLien = (url: string) => (url ? ` : ${url}` : ", je t'envoie le lien de paiement dès que tu me dis go");

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
  const lu = s.note ? lireNote(s.note, ref) : {};
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
export function plan(c: Call, s: Suivi): Plan | null {
  if (!s.venu) return null;
  const p = c.name.trim().split(/\s+/)[0] || "";
  const heure = c.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).replace(":", "h");

  // Pas venu : on récupère le rendez-vous, sans insister
  if (s.venu === "absent") {
    const t0 = new Date(c.start.getTime() + 15 * 60_000);
    return {
      resume: "Il n'est pas venu : on lui propose de reprendre un créneau, 3 messages espacés puis on lâche.",
      messages: [
        { id: "absent-1", quand: t0, titre: "Juste après le rendez-vous manqué",
          texte: `Hello ${p} ! On avait rendez-vous à ${heure} pour ton appel, je ne t'ai pas vu 🙂 Tout va bien ? Si ce n'était pas le bon moment, reprends un créneau ici : ${CAL}` },
        { id: "absent-2", quand: midi(c.start, 1), titre: "Le lendemain midi",
          texte: `Re ${p}, je reviens vers toi pour ton appel d'hier. Il me reste des créneaux cette semaine si tu veux qu'on en parle : ${CAL}` },
        { id: "absent-3", quand: soir(c.start, 4), titre: "Dernier message, porte ouverte",
          texte: `Dernier message de ma part ${p} : si lancer ta marque te parle toujours, mon agenda est ici ${CAL}. Sinon aucun souci, bonne continuation 🙏` },
      ],
    };
  }

  if (!s.resultat) return null;
  const produit: Produit = s.produit ?? (offre(c)?.nom === "Coaching +" ? "coaching" : "academie");
  // Frein « prix » sans paiement choisi : tous les messages proposent le 3 fois
  const modalite: Modalite = s.modalite ?? (produit === "suivi" ? "echeances" : s.frein === "prix" ? "3fois" : "1fois");
  const nom = NOMS[produit];
  const prix = PRIX[produit][modalite] ?? Object.values(PRIX[produit])[0];
  const url = lien(produit, modalite);
  const rappel = dateRappel(s);
  const base = apresAppel(c);
  const temps = (c.raw["temps-disponible"] ?? "").toLowerCase();

  // Signé : bienvenue, accès, puis point d'étape
  if (s.resultat === "signe") {
    const coaching = produit === "coaching";
    return {
      resume: `Il a signé ${nom} : on sécurise le démarrage pour qu'il ne décroche pas la 1re semaine.`,
      messages: [
        { id: "signe-1", quand: new Date(c.end.getTime() + 30 * 60_000), titre: "Bienvenue + accès",
          texte: coaching
            ? `Bienvenue dans le Coaching + ${p} 🎉 Ton accès à l'espace élèves : ${ESPACE}. Envoie-moi tes dispos de la semaine, on cale notre première séance.`
            : `Bienvenue dans ${nom} ${p} 🎉 Ton accès est ici : ${ESPACE}. Connecte-toi ce soir et dis-moi quand c'est fait, je vérifie que tout est ok.` },
        { id: "signe-2", quand: midi(c.end, 1), titre: "Vérifier qu'il a bien démarré",
          texte: `Hello ${p}, tu as bien pu te connecter ? Si tu bloques sur quoi que ce soit, réponds-moi ici, je t'aide tout de suite.` },
        { id: "signe-3", quand: soir(c.end, 7), titre: "Point d'étape à une semaine",
          texte: `${p}, une semaine déjà ! Où tu en es ? Dis-moi ce qui avance et ce qui coince, on ajuste ensemble.` },
      ],
    };
  }

  // Pas intéressé : on garde le contact, sans relancer la vente
  if (s.resultat === "pas-interesse") {
    const budget = s.frein === "prix" ? ` Et si c'était une question de budget, l'Académie existe aussi en 3 fois (3 × 499 €).` : "";
    return {
      resume: "Pas intéressé : on remercie, on garde le lien avec les lives gratuits, et on reprend des nouvelles dans 1 et 3 mois.",
      messages: [
        { id: "non-1", quand: base, titre: "Merci, sans pression",
          texte: `Merci pour ton temps ${p} ! Je comprends, ce n'est pas le moment pour tout le monde.${budget} Je fais des lives presque tous les soirs sur TikTok, passe quand tu veux, c'est gratuit : https://www.tiktok.com/@hugo.bnls` },
        { id: "non-2", quand: midi(c.end, 30), titre: "Nouvelles dans un mois",
          texte: `Hello ${p}, comment avance ton projet e-commerce depuis notre appel ?` },
        { id: "non-3", quand: midi(c.end, 90), titre: "Nouvelles dans trois mois",
          texte: `Hello ${p}, ça fait un moment ! Si tu veux refaire le point sur ton projet, mon agenda est ici : ${CAL}` },
      ],
    };
  }

  // Intéressé : il a dit oui sur le principe, on envoie le lien et on lève le dernier doute
  if (s.resultat === "interesse" && rappel) {
    // Date de reprise convenue (« relancer le 27 », « début de mois ») : rien avant, puis on lance
    return {
      resume: `Intéressé par ${nom} (${prix}), reprise convenue le ${quandLisible(rappel).toLowerCase()} : 1er message ce jour-là, puis 2 relances.`,
      messages: [
        { id: "oui-r1", quand: rappel, titre: "Reprise à la date convenue",
          texte: leverFrein(p, s.frein === "date-paiement" ? "date-paiement" : undefined, nom, produit, temps, prix, url)
            ?? `Hello ${p} ! Comme convenu, je reviens vers toi aujourd'hui 🙂 On lance ${nom} (${prix})${avecLien(url)}` },
        { id: "oui-r2", quand: plus(rappel, 2, 12, 15), titre: s.frein && s.frein !== "date-paiement" ? `Lever le frein : ${libelleFrein(s.frein)}` : "Petite relance",
          texte: (s.frein && s.frein !== "date-paiement" ? leverFrein(p, s.frein, nom, produit, temps, prix, url) : null)
            ?? `Re ${p}, tu as vu mon message ? Si tu as une question avant de te lancer, réponds juste ici.` },
        { id: "oui-r3", quand: plus(rappel, 5), titre: "Dernière relance",
          texte: `${p}, je reviens vers toi une dernière fois pour ${nom}. ${url ? `Si c'est le bon moment, le lien est ici : ${url}.` : "Si c'est le bon moment, dis-moi go et je t'envoie le lien."} Sinon dis-le-moi simplement, aucun souci 🙂` },
      ],
    };
  }

  if (s.resultat === "interesse") {
    const t1 = base;
    return {
      resume: `Intéressé par ${nom} (${prix}) : lien de paiement tout de suite, puis 2 relances pour lever le dernier frein.`,
      messages: [
        { id: "oui-1", quand: t1, titre: "Récap + lien de paiement",
          texte: `Merci pour l'appel ${p} ! Comme on a dit, ${nom} (${prix})${avecLien(url)}.\nDès que c'est réglé, on démarre.` },
        { id: "oui-2", quand: midi(t1, 1), titre: s.frein ? `Lever le frein : ${libelleFrein(s.frein)}` : "Répondre à ses questions",
          texte: leverFrein(p, s.frein, nom, produit, temps, prix, url) ?? `Hello ${p}, tu as pu regarder ? Si tu as la moindre question avant de te lancer, je suis là.` },
        { id: "oui-3", quand: plus(t1, 3), titre: "Dernière relance sur le lien",
          texte: `${p}, je reviens vers toi une dernière fois pour ${nom}. ${url ? `Si c'est le bon moment, le lien est ici : ${url}.` : "Si c'est le bon moment, dis-moi go et je t'envoie le lien."} Sinon dis-le-moi simplement, aucun souci 🙂` },
      ],
    };
  }

  // À relancer : on attaque le frein, au bon moment
  const ecart: Record<Frein, number> = { prix: 1, "date-paiement": 7, temps: 1, entourage: 2, reflechir: 1, moment: 14, confiance: 1, autre: 2 };
  const t1 = rappel ?? midi(c.end, ecart[s.frein ?? "autre"]);
  const t2 = plus(t1, s.frein === "moment" ? 7 : 2);
  const t3 = plus(t2, s.frein === "moment" ? 14 : 4);
  return {
    resume: `À relancer${s.frein ? ` (frein : ${libelleFrein(s.frein).toLowerCase()})` : ""} : 1er message ${rappel ? "à la date notée" : "au bon moment"}, puis lien, puis dernière relance.`,
    messages: [
      { id: "relance-1", quand: t1, titre: s.frein ? `Lever le frein : ${libelleFrein(s.frein)}` : "Reprendre contact",
        texte: leverFrein(p, s.frein, nom, produit, temps, prix, url) ?? `Hello ${p}, tu as pu y réfléchir depuis notre appel ? Dis-moi ce qui te fait encore hésiter, je te réponds franchement.` },
      { id: "relance-2", quand: t2, titre: "Le lien, sans pression",
        texte: url
          ? `Re ${p}, je te remets le lien pour ${nom} (${prix}) si tu veux avancer : ${url}\nEt si tu as une question, réponds juste ici.`
          : `Re ${p}, on lance ${nom} (${prix}) ? Dis-moi go et je t'envoie le lien de paiement. Et si tu as une question, réponds juste ici.` },
      { id: "relance-3", quand: t3, titre: "Dernière relance",
        texte: `${p}, dernier message de ma part sur ${nom}. Si ce n'est pas le moment, je comprends tout à fait, tu sais où me trouver 🙏` },
    ],
  };
}

function libelleFrein(f: Frein): string {
  return { prix: "le prix", "date-paiement": "paie à une date précise", temps: "le temps", entourage: "en parler à un proche", reflechir: "veut réfléchir", moment: "pas le bon moment", confiance: "pas encore confiance", autre: "autre" }[f];
}

// Le message qui répond au frein noté sur la fiche
function leverFrein(p: string, f: Frein | undefined, nom: string, produit: Produit, temps: string, prix = "", url = ""): string | null {
  switch (f) {
    case "date-paiement":
      return `Hello ${p} ! Comme convenu, je reviens vers toi pour ton paiement 🙂 On lance ${nom} (${prix})${avecLien(url)}`;
    case "prix": {
      const trois = produit === "coaching" ? "3 × 1 665 €" : produit === "suivi" ? "des échéances (3 500 € au total)" : produit === "ads" ? "3 × 1 000 €/mois" : "3 × 499 €";
      const url3 = lien(produit, produit === "suivi" ? "echeances" : "3fois");
      return `Hello ${p}, j'ai repensé à notre échange : si payer en une fois bloque, ${nom} existe en ${trois}${url3 ? `. Le lien : ${url3}` : ""}.\nÇa change quelque chose pour toi ?`;
    }
    case "temps":
      return `Hello ${p}, sur le temps : tout est fait pour avancer à ton rythme${temps ? `, même avec ${temps}` : ""}. Tu veux qu'on regarde ensemble comment l'organiser sur ta semaine ?`;
    case "entourage":
      return `Hello ${p}, tu as pu en parler ? Si ça peut aider, je peux répondre directement aux questions de la personne concernée, en 10 minutes au téléphone.`;
    case "reflechir":
      return `Hello ${p}, tu as pu y réfléchir ? Dis-moi ce qui te fait encore hésiter, je te réponds franchement, même si la réponse est « pas pour toi ».`;
    case "moment":
      return `Hello ${p}, tu m'avais dit que ce n'était pas le bon moment. Est-ce que ça a bougé de ton côté ? Si oui, on peut reprendre là où on s'était arrêtés.`;
    case "confiance":
      return `Hello ${p}, je comprends que tu veuilles être sûr avant de te lancer. Regarde les résultats de mes élèves ici : https://hugo-bnls.fr/academie/#resultats\nEt si tu veux, on refait un point de 10 minutes pour répondre à toutes tes questions.`;
    default:
      return null;
  }
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

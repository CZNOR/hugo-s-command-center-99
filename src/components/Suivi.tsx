import { useEffect, useState } from "react";

// Avancement en direct : envoyé toutes les 20 s par tools/publish_suivi.py depuis le Mac.
// L'app ne fait que lire : Hugo change tout depuis le Mac, dans ses sessions.
export interface Attente { qui: string; quoi: string; quand?: string; src?: "etat" | "session" }
export interface FaitDuJour { qui: string; quoi: string; heure: string }
export interface Session { nom: string; statut: string; etape: string; pct: number | null; reste_min: number | null }
export interface Projet {
  nom: string; faites: number; total: number; etape: string; niveau?: "projet" | "outil" | "fini";
  objectif?: string; fini_quand?: string; prochaine?: string; attend_hugo?: string;
}
export interface SuiviData {
  maj?: number;
  attente?: Attente[]; // src « etat » : son plan (ETAT.json) ; « session » : une session attend sa réponse
  faits?: FaitDuJour[]; // fait aujourd'hui
  direct?: Session[];
  projets?: Projet[];
  sante?: { rappels: string | null }; // dernier passage du minuteur des notifs (chaque minute)
}

// Barre fine ; « vivante » : un reflet passe dessus tant que ça tourne
export const Barre = ({ pct, vivante }: { pct: number; vivante?: boolean }) => (
  <div className={`barre ${vivante ? "vivante" : ""}`}><i style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} /></div>
);

// Groupe replié : une ligne « titre (n) », un tap l'ouvre
export function Repli({ titre, n, children }: { titre: string; n: number; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  if (!n) return null;
  return (
    <div className={`repli ${ouvert ? "ouvert" : ""}`}>
      <button className="repli-tete" onClick={() => setOuvert(!ouvert)}>
        <span>{titre}</span><b>{n}</b><i className="fleche" aria-hidden="true" />
      </button>
      {ouvert && <div className="repli-corps">{children}</div>}
    </div>
  );
}

// « il y a 12 s » qui avance tout seul, sans redessiner le reste de l'app
export function Age({ ms }: { ms: number | null }) {
  const [, tic] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tic((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (ms == null) return <>jamais</>;
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  return <>{s < 90 ? `il y a ${s} s` : s < 5400 ? `il y a ${Math.round(s / 60)} min` : `il y a ${Math.round(s / 3600)} h`}</>;
}

// Une session au travail, comme dans le widget : point qui pulse, nom, avancement, barre, étape
export function CarteSession({ s, question }: { s: Session; question?: string }) {
  const attend = s.statut === "attend";
  const droite = attend ? "t'attend" : s.pct != null ? `${s.pct} %${s.reste_min ? ` · ~${s.reste_min} min` : ""}` : "en cours";
  return (
    <div className="carte">
      <div className="carte-haut">
        <i className={`pastille ${attend ? "ambre" : "lavande pulse"}`} />
        <b>{s.nom}</b>
        <span className={`etat ${attend ? "ambre" : ""}`}>{droite}</span>
      </div>
      {!attend && s.pct != null && <Barre pct={s.pct} vivante />}
      {(attend ? question || s.etape : s.etape) && <p className={`texte ${attend ? "ambre" : ""}`}>{attend ? question || s.etape : s.etape}</p>}
    </div>
  );
}

// Un projet : nom, étapes, barre, la suite ; un tap déplie le texte
export function CarteProjet({ p }: { p: Projet }) {
  const [ouvert, setOuvert] = useState(false);
  const pct = p.total ? Math.round((100 * p.faites) / p.total) : 0;
  const suite = p.prochaine || p.etape;
  return (
    <button className="carte cliquable" onClick={() => setOuvert(!ouvert)}>
      <span className="carte-haut">
        <b>{p.nom}</b>
        <span className="etat">{p.faites}/{p.total} étapes</span>
      </span>
      <Barre pct={pct} />
      {suite && <span className={`texte ${ouvert ? "libre" : ""}`}>→ {suite}</span>}
      {p.attend_hugo && <span className={`texte ambre ${ouvert ? "libre" : ""}`}>Pour toi : {p.attend_hugo}</span>}
      {ouvert && p.objectif && <span className="texte doux libre">Objectif : {p.objectif}</span>}
    </button>
  );
}

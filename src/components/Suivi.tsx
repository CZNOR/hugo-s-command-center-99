import { useState } from "react";

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
}

export const Barre = ({ pct }: { pct: number }) => (
  <div className="barre"><i style={{ width: `${Math.max(4, Math.min(100, pct))}%` }} /></div>
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

// Une ligne qui avance : nom, pourcentage, barre, une ligne de texte ; le détail s'ouvre d'un tap
export function Avancement({ nom, pct, droite, texte, detail, alerte }: {
  nom: string; pct: number | null; droite?: string; texte?: string; detail?: React.ReactNode; alerte?: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <button className="ligne avance" onClick={() => detail && setOuvert(!ouvert)}>
      <span className="ligne-haut">
        <b>{nom}</b>
        <span className={`pct ${alerte ? "alerte" : ""}`}>{droite ?? (pct != null ? `${pct} %` : "")}</span>
      </span>
      {pct != null && <Barre pct={pct} />}
      {texte && <span className={`ligne-sous ${ouvert ? "" : "une-ligne"}`}>{texte}</span>}
      {ouvert && detail && <span className="projet-detail">{detail}</span>}
    </button>
  );
}

export const pctProjet = (p: Projet) => (p.total ? Math.round((100 * p.faites) / p.total) : 0);

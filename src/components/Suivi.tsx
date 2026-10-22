import { useEffect, useState } from "react";

// Le Suivi (version 2) : calculé une seule fois sur le Mac par tools/publish_suivi.py,
// le même pour Dring et pour le widget Suivi (contrat : reports/suivi-spec.md).
// Dring ne recalcule rien : il dessine les sections, dans l'ordre, avec les textes et couleurs reçus.
export type Couleur = "lavande" | "ambre" | "rouge" | "vert" | "creme" | "gris";
export interface Carte {
  pastille: Couleur; pulse: boolean; titre: string; droite: string; couleur_droite: Couleur;
  barre: number | null; barre_vivante: boolean;
  lignes: { signe: string; texte: string; couleur: Couleur }[];
  lien: { type: "session"; id: string } | { type: "appel"; id: number } | null;
}
export interface Section { id: string; titre: string; couleur: Couleur; repliee: boolean; vide: string; cartes: Carte[] }
export interface SuiviData {
  version?: number;
  maj?: number;
  entete?: { titre: string; resume: string; pour_toi: number; au_travail: number; anneau: "tourne" | "calme" };
  alertes?: string[];
  sections?: Section[];
  chiffres?: { releve: string; sections: { titre: string; markdown: string }[] };
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

// Une carte du Suivi, telle que reçue : pastille, titre, état à droite, barre, lignes
export function CarteSuivi({ c, onOpenFiche }: { c: Carte; onOpenFiche: (id: number) => void }) {
  const contenu = (
    <>
      <span className="carte-haut">
        <i className={`pastille ${c.pastille} ${c.pulse ? "pulse" : ""}`} />
        <b>{c.titre}</b>
        {c.droite && <span className={`etat ${c.couleur_droite}`}>{c.droite}</span>}
      </span>
      {c.barre != null && <Barre pct={c.barre * 100} vivante={c.barre_vivante} />}
      {c.lignes.map((l, i) => (
        <span key={i} className={`texte ${l.couleur}`}>{l.signe && <span className="signe">{l.signe}</span>}{l.texte}</span>
      ))}
    </>
  );
  // Les fiches d'appel s'ouvrent dans Dring ; les sessions Claude, elles, vivent sur le Mac
  return c.lien?.type === "appel"
    ? <button className="carte cliquable" onClick={() => onOpenFiche((c.lien as { id: number }).id)}>{contenu}</button>
    : <div className="carte">{contenu}</div>;
}

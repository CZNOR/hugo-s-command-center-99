import { useState } from "react";
import { IcFolder, IcStar } from "./Icons";

// Avancement en direct : envoyé toutes les 20 s par tools/publish_suivi.py depuis le Mac
export interface Projet {
  nom: string; faites: number; total: number; etape: string; niveau?: "projet" | "outil" | "fini";
  objectif?: string; fini_quand?: string; prochaine?: string; attend_hugo?: string;
}
export interface Attente { qui: string; quoi: string; quand?: string; src?: "etat" | "session" }
export interface SuiviData {
  maj?: number;
  // src « etat » : à cocher quand c'est fait ; « session » : une session attend ta réponse
  attente?: Attente[];
  direct?: { nom: string; statut: string; etape: string; pct: number | null; reste_min: number | null }[];
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

// Un projet : nom, barre épaisse, étape suivante ; le détail s'ouvre d'un tap
function Projet({ p }: { p: Projet }) {
  const [ouvert, setOuvert] = useState(false);
  const ensuite = p.prochaine || p.etape;
  return (
    <button className={`ligne projet ${ouvert ? "ouvert" : ""}`} onClick={() => setOuvert(!ouvert)}>
      <span className="ligne-haut"><b>{p.nom}</b><span className="fraction">{p.faites}/{p.total}</span></span>
      <Barre pct={p.total ? (100 * p.faites) / p.total : 0} />
      {ensuite && <span className={`ligne-sous ${ouvert ? "" : "une-ligne"}`}>{ensuite}</span>}
      {ouvert && (
        <span className="projet-detail">
          {p.objectif && <span><b>Objectif</b> {p.objectif}</span>}
          {p.fini_quand && <span><b>Fini quand</b> {p.fini_quand}</span>}
          {p.attend_hugo && <span className="pour-toi"><b>Pour toi</b> {p.attend_hugo}</span>}
        </span>
      )}
    </button>
  );
}

// Le suivi en direct : ce qui t'attend, les sessions au travail (barres en direct), les projets
// « Pour toi » : un tap sur la case = c'est fait, retiré partout (app, ETAT.json, panneau Suivi, widget)
export default function Suivi({ data, now, apres, onFait }: { data: SuiviData; now: number; apres?: React.ReactNode; onFait: (a: Attente) => void }) {
  const [toutVoir, setToutVoir] = useState(false);
  if (!data.maj) return <p className="vide">Le suivi arrive dès que le Mac l'envoie.</p>;
  const ageMin = Math.round((now / 1000 - data.maj) / 60);
  const projets = data.projets ?? [];
  const gros = projets.filter((p) => (p.niveau ?? "projet") === "projet");
  const outils = projets.filter((p) => p.niveau === "outil");
  const finis = projets.filter((p) => p.niveau === "fini");
  const sessions = (data.direct ?? []).filter((s) => s.statut === "travaille" || s.statut === "attend");
  const attente = data.attente ?? [];
  const visibles = toutVoir ? attente : attente.slice(0, 3);

  return (
    <>
      {attente.length > 0 && (
        <section className="bloc jaune">
          <h2 className="bloc-titre"><IcStar />Pour toi <span className="pastille-n">{attente.length}</span></h2>
          {visibles.map((a) => (
            <div key={`${a.qui}|${a.quoi}`} className="ligne a-cocher">
              <span className="a-cocher-texte">
                <span className="ligne-sur">{a.qui}{a.quand ? ` · ${a.quand}` : ""}</span>
                <b className="ligne-texte">{a.quoi}</b>
                {a.src === "session" && <span className="ligne-sous">Réponds-lui dans sa session</span>}
              </span>
              {a.src !== "session" && (
                <button className="tick" aria-label="C'est fait" onClick={() => onFait(a)}>✓</button>
              )}
            </div>
          ))}
          {attente.length > 3 && (
            <button className="bloc-plus" onClick={() => setToutVoir(!toutVoir)}>{toutVoir ? "Voir moins" : `Tout voir (${attente.length})`}</button>
          )}
        </section>
      )}

      <section className="bloc lavande">
        <h2 className="bloc-titre">
          <span className={`direct ${ageMin > 5 ? "eteint" : ""}`} aria-hidden="true" />
          En direct
          <span className="bloc-droite">{ageMin > 5 ? `Mac hors ligne · ${ageMin} min` : "mis à jour à l'instant"}</span>
        </h2>
        {sessions.length === 0 && <p className="ligne-sous">Aucune session ne travaille en ce moment.</p>}
        {sessions.map((s, i) => (
          <div key={i} className="ligne">
            <span className="ligne-haut">
              <b>{s.nom}</b>
              <span className="fraction">{s.statut === "attend" ? "t'attend" : s.pct != null ? `${s.pct} %` : "en cours"}</span>
            </span>
            {s.etape && <span className="ligne-sous">{s.etape}</span>}
            {s.pct != null && <Barre pct={s.pct} />}
            {s.statut !== "attend" && !!s.reste_min && <span className="ligne-sous fort">~{s.reste_min} min restantes</span>}
          </div>
        ))}
      </section>

      {gros.length > 0 && (
        <section className="bloc sombre">
          <h2 className="bloc-titre"><IcFolder />Projets</h2>
          {gros.map((p) => <Projet key={p.nom} p={p} />)}
        </section>
      )}

      <div className="replis">
        <Repli titre="Sous-projets et outils" n={outils.length}>{outils.map((p) => <Projet key={p.nom} p={p} />)}</Repli>
        <Repli titre="Terminés" n={finis.length}>{finis.map((p) => <div key={p.nom} className="ligne"><b>✓ {p.nom}</b></div>)}</Repli>
        {apres}
      </div>
    </>
  );
}

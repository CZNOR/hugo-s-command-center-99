import { useState } from "react";

// Avancement en direct : envoyé toutes les 20 s par tools/publish_suivi.py depuis le Mac
export interface Projet {
  nom: string; faites: number; total: number; etape: string; niveau?: "projet" | "outil" | "fini";
  objectif?: string; fini_quand?: string; prochaine?: string; attend_hugo?: string;
}
export interface SuiviData {
  maj?: number;
  attente?: { qui: string; quoi: string }[];
  direct?: { nom: string; statut: string; etape: string; pct: number | null; reste_min: number | null }[];
  projets?: Projet[];
}

const Bar = ({ pct }: { pct: number }) => (
  <div className="bar"><i style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} /></div>
);

// Groupe replié par défaut : une ligne « titre (n) », un tap l'ouvre
export function Repli({ titre, n, children }: { titre: string; n: number; children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  if (!n) return null;
  return (
    <div className={`repli ${ouvert ? "ouvert" : ""}`}>
      <button className="li repli-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="li-title">{titre}</span>
        <span className="li-side">{n}</span>
        <span className="chev tourne" aria-hidden="true" />
      </button>
      {ouvert && <div className="repli-corps">{children}</div>}
    </div>
  );
}

// Un projet : une ligne compacte, le détail s'ouvre d'un tap
function LigneProjet({ p }: { p: Projet }) {
  const [ouvert, setOuvert] = useState(false);
  const ensuite = p.prochaine || p.etape;
  return (
    <button className={`li stack projet ${ouvert ? "ouvert" : ""}`} onClick={() => setOuvert(!ouvert)}>
      <div className="li-row"><span className="li-title">{p.nom}</span><span className="li-side">{p.faites}/{p.total}</span></div>
      <Bar pct={p.total ? (100 * p.faites) / p.total : 0} />
      {ensuite && <span className={`li-sub ${ouvert ? "" : "une-ligne"}`}>{ensuite}</span>}
      {ouvert && (
        <span className="projet-detail">
          {p.objectif && <span className="li-text"><b>Objectif.</b> {p.objectif}</span>}
          {p.fini_quand && <span className="li-text"><b>Fini quand.</b> {p.fini_quand}</span>}
          {p.attend_hugo && <span className="li-text todo"><b>Pour toi.</b> {p.attend_hugo}</span>}
        </span>
      )}
    </button>
  );
}

export default function Suivi({ data, now }: { data: SuiviData; now: number }) {
  const [toutVoir, setToutVoir] = useState(false);
  if (!data.maj) return null;
  const ageMin = Math.round((now / 1000 - data.maj) / 60);
  const projets = data.projets ?? [];
  const gros = projets.filter((p) => (p.niveau ?? "projet") === "projet");
  const outils = projets.filter((p) => p.niveau === "outil");
  const finis = projets.filter((p) => p.niveau === "fini");
  const actives = (data.direct ?? []).filter((s) => s.statut === "travaille" || s.statut === "attend");
  const attente = data.attente ?? [];
  const visibles = toutVoir ? attente : attente.slice(0, 3);

  return (
    <>
      <p className="resume">
        {attente.length ? <><b>{attente.length}</b> chose{attente.length > 1 ? "s" : ""} pour toi</> : "Rien ne t'attend"}
        {" · "}<b>{gros.length}</b> projet{gros.length > 1 ? "s" : ""} en route
        {ageMin > 5 && <span className="late"> · Mac hors ligne depuis {ageMin} min</span>}
      </p>

      {attente.length > 0 && (
        <>
          <h2 className="sec">Pour toi</h2>
          <div className="list">
            {visibles.map((a, i) => (
              <div key={i} className="li">
                <span className="li-main"><span className="li-sub">{a.qui}</span><span className="li-title wrap">{a.quoi}</span></span>
              </div>
            ))}
            {attente.length > 3 && (
              <button className="li action" onClick={() => setToutVoir(!toutVoir)}>{toutVoir ? "Voir moins" : `Tout voir (${attente.length})`}</button>
            )}
          </div>
        </>
      )}

      {gros.length > 0 && (
        <>
          <h2 className="sec">Projets</h2>
          <div className="list">{gros.map((p) => <LigneProjet key={p.nom} p={p} />)}</div>
        </>
      )}

      <div className="list replis">
        <Repli titre="Sous-projets et outils" n={outils.length}>
          {outils.map((p) => <LigneProjet key={p.nom} p={p} />)}
        </Repli>
        <Repli titre="Terminés" n={finis.length}>
          {finis.map((p) => <div key={p.nom} className="li"><span className="li-title done">✓ {p.nom}</span></div>)}
        </Repli>
        <Repli titre="Sessions au travail" n={actives.length}>
          {actives.map((s, i) => (
            <div key={i} className="li stack">
              <div className="li-row">
                <span className="li-title">{s.nom}</span>
                <span className={`li-side ${s.statut === "attend" ? "todo" : ""}`}>{s.statut === "attend" ? "t'attend" : s.reste_min ? `~${s.reste_min} min` : "en cours"}</span>
              </div>
              {s.etape && <span className="li-sub">{s.etape}</span>}
              {s.pct != null && <Bar pct={s.pct} />}
            </div>
          ))}
        </Repli>
      </div>
    </>
  );
}

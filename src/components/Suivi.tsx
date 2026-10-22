// Avancement en direct : envoyé chaque minute par tools/publish_suivi.py depuis le Mac
export interface SuiviData {
  maj?: number;
  attente?: { qui: string; quoi: string }[];
  direct?: { nom: string; statut: string; etape: string; pct: number | null; reste_min: number | null }[];
  projets?: {
    nom: string; faites: number; total: number; etape: string;
    objectif?: string; fini_quand?: string; prochaine?: string; attend_hugo?: string;
  }[];
}

const Bar = ({ pct }: { pct: number }) => (
  <div className="bar"><i style={{ width: `${Math.max(3, Math.min(100, pct))}%` }} /></div>
);

export default function Suivi({ data, now }: { data: SuiviData; now: number }) {
  if (!data.maj) return null;
  const ageMin = Math.round((now / 1000 - data.maj) / 60);
  // Seules les sessions qui avancent ou t'attendent : le reste est du bruit
  const actives = (data.direct ?? []).filter((s) => s.statut === "travaille" || s.statut === "attend");

  return (
    <>
      {!!data.attente?.length && (
        <>
          <h2 className="sec">À toi de jouer<span>{data.attente.length}</span></h2>
          <div className="list">
            {data.attente.map((a, i) => (
              <div key={i} className="li">
                <span className="li-main"><span className="li-sub">{a.qui}</span><span className="li-title wrap">{a.quoi}</span></span>
              </div>
            ))}
          </div>
        </>
      )}

      {actives.length > 0 && (
        <>
          <h2 className="sec">En cours{ageMin > 5 && <span>Mac hors ligne depuis {ageMin} min</span>}</h2>
          <div className="list">
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
          </div>
        </>
      )}

      {!!data.projets?.length && (
        <>
          <h2 className="sec">Projets</h2>
          <div className="list">
            {data.projets.map((p, i) => (
              <div key={i} className="li stack">
                <div className="li-row"><span className="li-title">{p.nom}</span><span className="li-side">{p.faites}/{p.total}</span></div>
                <Bar pct={p.total ? (100 * p.faites) / p.total : 0} />
                {p.objectif && <span className="li-sub">Objectif : {p.objectif}</span>}
                {(p.prochaine || p.etape) && <span className="li-text">Ensuite : {p.prochaine || p.etape}</span>}
                {p.attend_hugo && <span className="li-text todo">Pour toi : {p.attend_hugo}</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

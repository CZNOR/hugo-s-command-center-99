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
          <h2 className="sh">À toi de jouer <b className="count">{data.attente.length}</b></h2>
          <div className="group">
            {data.attente.map((a, i) => (
              <div key={i} className="item">
                <span className="chip">{a.qui}</span>
                <p className="item-text">{a.quoi}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {actives.length > 0 && (
        <>
          <h2 className="sh">En cours{ageMin > 5 && <span>Mac hors ligne depuis {ageMin} min</span>}</h2>
          <div className="group">
            {actives.map((s, i) => (
              <div key={i} className="item">
                <div className="item-head">
                  <b>{s.nom}</b>
                  {s.statut === "attend"
                    ? <span className="tag-amber">t'attend</span>
                    : <span className="muted">{s.reste_min ? `~${s.reste_min} min` : "en cours"}</span>}
                </div>
                {s.etape && <p className="item-sub">{s.etape}</p>}
                {s.pct != null && <Bar pct={s.pct} />}
              </div>
            ))}
          </div>
        </>
      )}

      {!!data.projets?.length && (
        <>
          <h2 className="sh">Projets</h2>
          {data.projets.map((p, i) => (
            <div key={i} className="group project">
              <div className="item-head">
                <b>{p.nom}</b>
                <span className="pill">{p.faites}/{p.total}</span>
              </div>
              <Bar pct={p.total ? (100 * p.faites) / p.total : 0} />
              {p.objectif && <p className="item-sub clamp2">🎯 {p.objectif}</p>}
              {(p.prochaine || p.etape) && (
                <p className="next"><span>Ensuite</span>{p.prochaine || p.etape}</p>
              )}
              {p.attend_hugo && <p className="wait">👉 {p.attend_hugo}</p>}
            </div>
          ))}
        </>
      )}
    </>
  );
}

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

const STATUT: Record<string, string> = { travaille: "travaille", attend: "attend ta réponse", pause: "en pause", fini: "fini" };

const Bar = ({ pct }: { pct: number }) => (
  <div className="bar"><i style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} /></div>
);

export default function Suivi({ data, now }: { data: SuiviData; now: number }) {
  if (!data.maj) return null;
  const ageMin = Math.round((now / 1000 - data.maj) / 60);
  const stale = ageMin > 5;

  return (
    <>
      {!!data.attente?.length && (
        <div className="card hero">
          <div className="lbl">À toi de jouer</div>
          <ul className="pt" style={{ marginTop: 6 }}>
            {data.attente.map((a, i) => (
              <li key={i}><span className="when">{a.qui}</span><span className="full">{a.quoi}</span></li>
            ))}
          </ul>
        </div>
      )}

      {!!data.direct?.length && (
        <div className="card">
          <div className="lbl">En direct{stale ? ` · Mac hors ligne depuis ${ageMin} min` : ""}</div>
          {data.direct.map((s, i) => (
            <div key={i} className="live">
              <div className="live-top">
                <b>{s.nom}</b>
                <span className={`st ${s.statut}`}>{STATUT[s.statut] ?? s.statut}</span>
              </div>
              {s.etape && <div className="sub">{s.etape}</div>}
              {s.pct != null && (
                <>
                  <Bar pct={s.pct} />
                  <div className="sub">{s.pct} %{s.reste_min ? ` · ~${s.reste_min} min restantes` : ""}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!!data.projets?.length && (
        <div className="card">
          <div className="lbl">Projets</div>
          {data.projets.map((p, i) => (
            <div key={i} className="live">
              <div className="live-top"><b>{p.nom}</b><span className="sub">{p.faites}/{p.total}</span></div>
              <Bar pct={p.total ? (100 * p.faites) / p.total : 0} />
              {p.objectif && <div className="fiche">🎯 {p.objectif}</div>}
              {(p.prochaine || p.etape) && <div className="fiche">→ {p.prochaine || p.etape}</div>}
              {p.attend_hugo && <div className="fiche ambre">👉 {p.attend_hugo}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

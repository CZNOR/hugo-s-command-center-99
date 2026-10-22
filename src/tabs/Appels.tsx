import { fmtCountdown, fmtDay, fmtTime, type Call } from "@/lib/cal";
import { todayRows } from "@/lib/markdown";
import { IcBell, IcPhone, IcVideo } from "@/components/Icons";

interface Props {
  calls: Call[] | null;
  error: string;
  point: string;
  now: number;
  notifOn: boolean;
  onEnableNotif: () => void;
  onOpenPoint: () => void;
}

export default function Appels({ calls, error, point, now, notifOn, onEnableNotif, onOpenPoint }: Props) {
  const [next, ...rest] = calls ?? [];
  const today = todayRows(point);

  return (
    <>
      {!notifOn && (
        <div className="card notif">
          <IcBell />
          <span style={{ flex: 1 }}>Active les notifs pour être prévenu de chaque appel.</span>
          <button className="btn" onClick={onEnableNotif}>Activer</button>
        </div>
      )}

      {calls === null && !error && <div className="card empty">Chargement des appels…</div>}
      {error && <div className="card empty">Appels indisponibles : {error}</div>}
      {calls && !next && (
        <div className="card hero">
          <div className="lbl">Prochain appel</div>
          <div className="who" style={{ marginTop: 6 }}>Aucun appel prévu.</div>
          <div className="sub">Les réservations Cal apparaissent ici dès qu'elles tombent.</div>
        </div>
      )}

      {next && (
        <div className="card hero">
          <div className="lbl">Prochain appel · {fmtCountdown(next.start, now)}</div>
          <div className="big">{fmtTime(next.start)}</div>
          <div className="who">{next.name} <span className="sub">· {fmtDay(next.start)}</span></div>
          {next.answers.length > 0 && (
            <dl className="answers">
              {next.answers.map((a) => (
                <div key={a.label}><dt>{a.label}</dt><dd>{a.value}</dd></div>
              ))}
            </dl>
          )}
          <div className="btns">
            {next.meetingUrl && (
              <a className="btn" href={next.meetingUrl} target="_blank" rel="noreferrer"><IcVideo />Rejoindre</a>
            )}
            {next.phone && (
              <a className="btn ghost" href={`tel:${next.phone}`}><IcPhone />Appeler</a>
            )}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="card">
          <div className="lbl">Ensuite</div>
          {rest.map((c, i) => (
            <div key={c.id}>
              {i > 0 && <div className="sep" />}
              <div className="row" style={{ marginTop: i === 0 ? 10 : 0 }}>
                <div className="t"><small>{fmtDay(c.start)}</small>{fmtTime(c.start)}</div>
                <div className="n">
                  <b>{c.name}</b>
                  <span>{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="lbl">Point du jour</div>
        {today.length ? (
          <ul className="pt" style={{ marginTop: 6 }}>
            {today.map((r, i) => (
              <li key={i}><span className="when">{r.when}</span><span>{r.what}</span></li>
            ))}
          </ul>
        ) : (
          <p className="empty" style={{ marginTop: 6 }}>Pas encore de point aujourd'hui.</p>
        )}
        <button className="more" onClick={onOpenPoint}>Voir le point complet →</button>
      </div>
    </>
  );
}

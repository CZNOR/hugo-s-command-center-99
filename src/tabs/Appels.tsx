import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, type Call } from "@/lib/cal";
import { todayRows } from "@/lib/markdown";
import { IcBell, IcPhone, IcVideo } from "@/components/Icons";
import type { PushStatus } from "@/lib/usePushSubscription";

// Bandeau visible tant que cet appareil n'a pas d'abonnement enregistré côté serveur
const NOTIF_TEXT: Partial<Record<PushStatus, string>> = {
  "off":           "Active les rappels d'appels sur cet appareil.",
  "busy":          "Activation en cours…",
  "denied":        "Notifications bloquées : Réglages iPhone → Notifications → Dring → Autoriser.",
  "not-installed": "Ouvre l'app depuis l'icône Dring de l'écran d'accueil pour activer les rappels.",
  "unsupported":   "Ce navigateur ne gère pas les notifications.",
};

interface Props {
  calls: Call[] | null;
  error: string;
  point: string;
  now: number;
  pushStatus: PushStatus;
  pushError: string;
  onEnableNotif: () => void;
  onOpenPoint: () => void;
}

export default function Appels({ calls, error, point, now, pushStatus, pushError, onEnableNotif, onOpenPoint }: Props) {
  const [next, ...rest] = calls ?? [];
  const today = todayRows(point);

  return (
    <>
      {pushStatus !== "on" && pushStatus !== "checking" && (
        <div className="banner">
          <IcBell />
          <span>{pushStatus === "error" ? `Activation impossible : ${pushError}` : NOTIF_TEXT[pushStatus]}</span>
          {(pushStatus === "off" || pushStatus === "error") && (
            <button className="btn small" onClick={onEnableNotif}>{pushStatus === "error" ? "Réessayer" : "Activer"}</button>
          )}
        </div>
      )}

      <h2 className="sh">Prochain appel{next && <span>{fmtCountdown(next.start, now)}</span>}</h2>
      {calls === null && !error && <div className="group"><p className="item empty">Chargement…</p></div>}
      {error && <div className="group"><p className="item empty">Appels indisponibles : {error}</p></div>}
      {calls && !next && (
        <div className="group">
          <div className="item">
            <b className="item-title">Aucun appel prévu</b>
            <p className="item-sub">Les réservations Cal apparaissent ici dès qu'elles tombent.</p>
          </div>
        </div>
      )}

      {next && (
        <div className="hero">
          <div className="big">{fmtTime(next.start)}</div>
          <div className="who">{next.name}</div>
          <div className="when-day">{fmtDay(next.start)}</div>
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
        <>
          <h2 className="sh">Ensuite</h2>
          <div className="group">
            {rest.map((c) => (
              <div key={c.id} className="item row">
                <div className="t"><small>{fmtDayShort(c.start)}</small>{fmtTime(c.start)}</div>
                <div className="n">
                  <b>{c.name}</b>
                  <span>{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="sh">Aujourd'hui</h2>
      <div className="group">
        {today.length ? today.map((r, i) => (
          <div key={i} className="item">
            <span className="chip">{r.when}</span>
            <p className="item-text">{r.what}</p>
          </div>
        )) : <p className="item empty">Pas encore de point aujourd'hui.</p>}
        <button className="item link" onClick={onOpenPoint}>Voir le point complet</button>
      </div>
    </>
  );
}

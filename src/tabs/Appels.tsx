import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, type Call } from "@/lib/cal";
import { todayRows } from "@/lib/markdown";
import { IcBell, IcPhone, IcVideo } from "@/components/Icons";
import type { PushStatus } from "@/lib/usePushSubscription";
import { alertes, RESULTATS, type Fiche } from "@/lib/prospect";
import { etatMessage, prochain, quandLisible } from "@/lib/messages";

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
  recents: Call[];
  suivis: Call[];        // appels des 45 derniers jours, pour les messages à envoyer
  fiches: Record<number, Fiche>;
  onOpenFiche: (id: number) => void;
}

// Étiquette du suivi après l'appel, pour la liste « Récents »
function etat(f?: Fiche): string {
  if (!f?.suivi) return "À noter";
  const r = RESULTATS.find((x) => x.id === f.suivi?.resultat)?.label;
  return r ?? (f.suivi.venu === "absent" ? "Pas venu" : f.suivi.venu === "venu" ? "Venu" : "À noter");
}

export default function Appels({ calls, error, point, now, pushStatus, pushError, onEnableNotif, onOpenPoint, recents, suivis, fiches, onOpenFiche }: Props) {
  const [next, ...rest] = calls ?? [];
  // Messages de suivi dus aujourd'hui (ou en retard), du plus ancien au plus récent
  const aEnvoyer = suivis.flatMap((c) => {
    const su = fiches[c.id]?.suivi;
    const m = su ? prochain(c, su) : null;
    if (!m || !su) return [];
    const e = etatMessage(m, su, now);
    return e === "retard" || e === "aujourdhui" ? [{ c, m, e }] : [];
  }).sort((a, b) => a.m.quand.getTime() - b.m.quand.getTime());
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

      {aEnvoyer.length > 0 && (
        <>
          <h2 className="sh">À envoyer aujourd'hui <b className="count">{aEnvoyer.length}</b></h2>
          <div className="group">
            {aEnvoyer.map(({ c, m, e }) => (
              <button key={c.id + m.id} className="item row" onClick={() => onOpenFiche(c.id)}>
                <div className="n"><b>{c.name}</b><span>{m.titre}</span></div>
                <span className={`etat ${e === "retard" ? "todo" : ""}`}>{e === "retard" ? "En retard" : quandLisible(m.quand, now).replace("Aujourd'hui ", "")}</span>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        </>
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
          <div className="who">{next.name}{alertes(next).length > 0 && <span className="hero-flag">à confirmer</span>}</div>
          <div className="when-day">{fmtDay(next.start)}</div>
          {next.answers.length > 0 && (
            <dl className="answers">
              {next.answers.map((a) => (
                <div key={a.label}><dt>{a.label}</dt><dd>{a.value}</dd></div>
              ))}
            </dl>
          )}
          <button className="btn fiche-btn" onClick={() => onOpenFiche(next.id)}>Voir sa fiche</button>
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
              <button key={c.id} className="item row" onClick={() => onOpenFiche(c.id)}>
                <div className="t"><small>{fmtDayShort(c.start)}</small>{fmtTime(c.start)}</div>
                <div className="n">
                  <b>{c.name}</b>
                  <span>{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span>
                </div>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {recents.length > 0 && (
        <>
          <h2 className="sh">Appels récents</h2>
          <div className="group">
            {recents.slice(0, 8).map((c) => (
              <button key={c.id} className="item row" onClick={() => onOpenFiche(c.id)}>
                <div className="t"><small>{fmtDayShort(c.start)}</small>{fmtTime(c.start)}</div>
                <div className="n"><b>{c.name}</b><span>{c.answers[0]?.value ?? c.email}</span></div>
                <span className={`etat ${etat(fiches[c.id]) === "À noter" ? "todo" : ""}`}>{etat(fiches[c.id])}</span>
              </button>
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

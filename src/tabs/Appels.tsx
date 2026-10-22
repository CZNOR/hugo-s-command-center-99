import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, type Call } from "@/lib/cal";
import { todayRows } from "@/lib/markdown";
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
  // À faire aujourd'hui : messages dus (ou en retard), puis appels passés pas encore notés
  const aEnvoyer = suivis.flatMap((c) => {
    const su = fiches[c.id]?.suivi;
    const m = su ? prochain(c, su) : null;
    if (!m || !su) return [];
    const e = etatMessage(m, su, now);
    return e === "retard" || e === "aujourdhui" ? [{ c, titre: m.titre, quand: m.quand, e }] : [];
  }).sort((a, b) => a.quand.getTime() - b.quand.getTime());
  const aNoter = recents.filter((c) => {
    const su = fiches[c.id]?.suivi;
    return !su?.venu || (su.venu === "venu" && !su.resultat);
  });
  const aFaire = [...aEnvoyer, ...aNoter.map((c) => ({ c, titre: "Appel à noter dans la fiche", quand: c.start, e: "noter" as const }))];
  const today = todayRows(point);

  return (
    <>
      {pushStatus !== "on" && pushStatus !== "checking" && (
        <div className="notice">
          <p>{pushStatus === "error" ? `Activation impossible : ${pushError}` : NOTIF_TEXT[pushStatus]}</p>
          {(pushStatus === "off" || pushStatus === "error") && (
            <button className="textbtn" onClick={onEnableNotif}>{pushStatus === "error" ? "Réessayer" : "Activer"}</button>
          )}
        </div>
      )}

      {aFaire.length > 0 && (
        <>
          <h2 className="sec">À faire aujourd'hui<span>{aFaire.length}</span></h2>
          <div className="list">
            {aFaire.map(({ c, titre, quand, e }) => (
              <button key={`${c.id}-${titre}`} className="li" onClick={() => onOpenFiche(c.id)}>
                <span className="li-main"><span className="li-title">{c.name}</span><span className="li-sub">{titre}</span></span>
                <span className={`li-side ${e === "retard" ? "late" : "todo"}`}>
                  {e === "retard" ? "En retard" : e === "noter" ? "À noter" : quandLisible(quand, now).replace("Aujourd'hui ", "")}
                </span>
                <span className="chev" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}

      <h2 className="sec">Prochain appel{next && <span>{fmtCountdown(next.start, now)}</span>}</h2>
      {calls === null && !error && <p className="empty">Chargement…</p>}
      {error && <p className="empty">Appels indisponibles : {error}</p>}
      {calls && !next && <p className="empty">Aucun appel prévu. Les réservations Cal arrivent ici dès qu'elles tombent.</p>}

      {next && (
        <>
          <div className="lead">
            <div className="lead-time">{fmtTime(next.start)}</div>
            <div className="lead-name">{next.name}</div>
            <div className="lead-meta">{fmtDay(next.start)}{alertes(next).length > 0 && <span className="todo"> · à confirmer</span>}</div>
          </div>
          {next.answers.length > 0 && (
            <div className="list">
              {next.answers.map((a) => (
                <div key={a.label} className="li kv"><span>{a.label}</span><span>{a.value}</span></div>
              ))}
            </div>
          )}
          <div className="list actions">
            {next.meetingUrl && <a className="li action" href={next.meetingUrl} target="_blank" rel="noreferrer">Rejoindre la visio<span className="chev" aria-hidden="true" /></a>}
            {next.phone && <a className="li action" href={`tel:${next.phone}`}>Appeler {next.phone}<span className="chev" aria-hidden="true" /></a>}
            <button className="li action" onClick={() => onOpenFiche(next.id)}>Ouvrir sa fiche<span className="chev" aria-hidden="true" /></button>
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="sec">Ensuite</h2>
          <div className="list">
            {rest.map((c) => (
              <button key={c.id} className="li" onClick={() => onOpenFiche(c.id)}>
                <span className="li-time"><small>{fmtDayShort(c.start)}</small>{fmtTime(c.start)}</span>
                <span className="li-main"><span className="li-title">{c.name}</span><span className="li-sub">{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span></span>
                <span className="chev" aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}

      {recents.length > 0 && (
        <>
          <h2 className="sec">Appels récents</h2>
          <div className="list">
            {recents.slice(0, 8).map((c) => {
              const t = etat(fiches[c.id]);
              return (
                <button key={c.id} className="li" onClick={() => onOpenFiche(c.id)}>
                  <span className="li-time"><small>{fmtDayShort(c.start)}</small>{fmtTime(c.start)}</span>
                  <span className="li-main"><span className="li-title">{c.name}</span><span className="li-sub">{c.answers[0]?.value ?? c.email}</span></span>
                  <span className={`li-side ${t === "À noter" ? "todo" : ""}`}>{t}</span>
                  <span className="chev" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <h2 className="sec">Aujourd'hui<button className="sec-link" onClick={onOpenPoint}>Le point</button></h2>
      <div className="list">
        {today.length ? today.map((r, i) => (
          <div key={i} className="li">
            <span className="li-main"><span className="li-sub">{r.when}</span><span className="li-title wrap">{r.what}</span></span>
          </div>
        )) : <p className="empty">Pas encore de point aujourd'hui.</p>}
      </div>
    </>
  );
}

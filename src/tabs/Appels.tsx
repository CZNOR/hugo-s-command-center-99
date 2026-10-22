import { useEffect, useState } from "react";
import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, type Call } from "@/lib/cal";
import { alertes, RESULTATS, type Fiche } from "@/lib/prospect";
import { suiviEffectif } from "@/lib/messages";
import { Sec } from "@/components/Deco";
import { IcClock, IcHistory, IcPhone } from "@/components/Icons";

interface Props {
  calls: Call[] | null;
  error: string;
  now: number;
  recents: Call[];
  fiches: Record<number, Fiche>;
  onOpenFiche: (id: number) => void;
}

// Étiquette du suivi après l'appel, pour la liste « Appels récents »
function etat(c: Call, f?: Fiche): string {
  if (!f?.suivi) return "À noter";
  if (suiviEffectif(f.suivi, c.end).stop) return "Clos";
  const r = RESULTATS.find((x) => x.id === f.suivi?.resultat)?.label;
  return r ?? (f.suivi.venu === "absent" ? "Pas venu" : f.suivi.venu === "venu" ? "Venu" : "À noter");
}

// Les appels : le prochain en grand, la suite, les récents (les relances sont dans « Aujourd'hui »)
export default function Appels({ calls, error, now, recents, fiches, onOpenFiche }: Props) {
  const [next, ...rest] = calls ?? [];

  // Compte à rebours à la seconde dans la dernière heure avant l'appel
  const [tic, setTic] = useState(Date.now());
  useEffect(() => {
    if (!next) return;
    const id = setInterval(() => {
      const r = next.start.getTime() - Date.now();
      if (r < 3600_000 && r > -1800_000) setTic(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [next?.id]);
  const reste = next ? next.start.getTime() - Math.max(tic, now) : 0;
  const imminent = !!next && reste < 3600_000;
  const compte = reste <= 0 ? "C'est maintenant"
    : `dans ${Math.floor(reste / 60_000)} min ${String(Math.floor((reste % 60_000) / 1000)).padStart(2, "0")} s`;

  return (
    <>
      <Sec icone={IcPhone} teinte="vert" droite={next ? fmtCountdown(next.start, now) : undefined}>Prochain appel</Sec>
      {calls === null && !error && <p className="empty">Chargement…</p>}
      {error && <p className="empty">Appels indisponibles : {error}</p>}
      {calls && !next && <p className="empty">Aucun appel prévu. Les réservations Cal arrivent ici dès qu'elles tombent.</p>}

      {next && (
        <>
          <div className="lead">
            <div className="lead-time">{fmtTime(next.start)}</div>
            <div className="lead-name">{next.name}</div>
            <div className="lead-meta">{fmtDay(next.start)}{alertes(next).length > 0 && <span className="todo"> · à confirmer</span>}</div>
            {imminent && (
              <>
                <div className="compte">{compte}</div>
                <div className="compte-barre"><i style={{ width: `${Math.min(100, Math.max(0, 100 - reste / 36_000))}%` }} /></div>
              </>
            )}
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
          <Sec icone={IcClock} teinte="bleu" droite={rest.length}>Ensuite</Sec>
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
          <Sec icone={IcHistory} teinte="gris">Appels récents</Sec>
          <div className="list">
            {recents.slice(0, 10).map((c) => {
              const t = etat(c, fiches[c.id]);
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
    </>
  );
}

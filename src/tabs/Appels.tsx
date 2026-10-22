import { useEffect, useState } from "react";
import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, type Call } from "@/lib/cal";
import { alertes, RESULTATS, type Fiche } from "@/lib/prospect";
import { quandLisible, suiviEffectif } from "@/lib/messages";
import { aFaire } from "@/lib/afaire";
import { IcBell, IcCheck, IcClock, IcHistory, IcPhone } from "@/components/Icons";

interface Props {
  calls: Call[] | null;
  error: string;
  now: number;
  recents: Call[];
  suivis: Call[];
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
export default function Appels({ calls, error, now, recents, suivis, fiches, onOpenFiche }: Props) {
  const [next, ...rest] = calls ?? [];
  const taches = aFaire(suivis, recents, fiches, now);

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
      {/* À relancer : en tête, pour n'oublier personne */}
      <section className={`bloc ${taches.length ? "orange" : "vert"}`}>
        <h2 className="bloc-titre">
          {taches.length > 0 ? <span className="cloche"><IcBell /></span> : <IcCheck />}
          {taches.length ? "À relancer" : "Tout est à jour"}
          {taches.length > 0 && <span className="pastille-n">{taches.length}</span>}
        </h2>
        {taches.length === 0 && <p className="ligne-sous">Personne à relancer, aucun appel à noter.</p>}
        {taches.map(({ c, titre, quand, e }) => (
          <button key={`${c.id}-${titre}`} className="ligne cliquable" onClick={() => onOpenFiche(c.id)}>
            <span className="ligne-haut"><b>{c.name}</b><span className={`fraction ${e === "retard" ? "en-retard" : "a-faire"}`}>{e === "retard" ? "en retard" : e === "noter" ? "à noter" : quandLisible(quand, now).replace("Aujourd'hui ", "")}</span></span>
            <span className="ligne-sous">{titre}</span>
          </button>
        ))}
      </section>

      {/* Prochain appel */}
      <section className="bloc lavande">
        <h2 className="bloc-titre"><IcPhone />Prochain appel{next && <span className="bloc-droite">{fmtCountdown(next.start, now)}</span>}</h2>
        {calls === null && !error && <p className="ligne-sous">Chargement…</p>}
        {error && <p className="ligne-sous">Appels indisponibles : {error}</p>}
        {calls && !next && <p className="ligne-sous">Aucun appel prévu. Les réservations Cal arrivent ici dès qu'elles tombent.</p>}
        {next && (
          <>
            <div className="gros-chiffre">{fmtTime(next.start)}</div>
            <b className="gros-nom">{next.name}</b>
            <span className="ligne-sous">{fmtDay(next.start)}{alertes(next).length > 0 && " · à confirmer"}</span>
            {imminent && (
              <>
                <div className="compte">{compte}</div>
                <div className="barre"><i style={{ width: `${Math.min(100, Math.max(4, 100 - reste / 36_000))}%` }} /></div>
              </>
            )}
            {next.answers.length > 0 && (
              <div className="reponses">
                {next.answers.map((a) => <span key={a.label}><em>{a.label}</em>{a.value}</span>)}
              </div>
            )}
            <div className="boutons">
              {next.meetingUrl && <a className="bouton noir" href={next.meetingUrl} target="_blank" rel="noreferrer">Rejoindre</a>}
              {next.phone && <a className="bouton clair" href={`tel:${next.phone}`}>Appeler</a>}
            </div>
            <button className="bouton clair plein" onClick={() => onOpenFiche(next.id)}>Ouvrir sa fiche</button>
          </>
        )}
      </section>

      {rest.length > 0 && (
        <section className="bloc sombre">
          <h2 className="bloc-titre"><IcClock />Ensuite</h2>
          {rest.map((c) => (
            <button key={c.id} className="ligne cliquable" onClick={() => onOpenFiche(c.id)}>
              <span className="ligne-haut"><b>{c.name}</b><span className="fraction">{fmtDayShort(c.start)} {fmtTime(c.start)}</span></span>
              <span className="ligne-sous">{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span>
            </button>
          ))}
        </section>
      )}

      {recents.length > 0 && (
        <section className="bloc sombre">
          <h2 className="bloc-titre"><IcHistory />Appels récents</h2>
          {recents.slice(0, 10).map((c) => {
            const t = etat(c, fiches[c.id]);
            return (
              <button key={c.id} className="ligne cliquable" onClick={() => onOpenFiche(c.id)}>
                <span className="ligne-haut"><b>{c.name}</b><span className={`fraction ${t === "À noter" ? "a-faire" : ""}`}>{t}</span></span>
                <span className="ligne-sous">{fmtDayShort(c.start)} {fmtTime(c.start)} · {c.answers[0]?.value ?? c.email}</span>
              </button>
            );
          })}
        </section>
      )}
    </>
  );
}

import { memo, useEffect, useState } from "react";
import { fmtCountdown, fmtDay, fmtDayShort, fmtTime, TZ, type Call } from "@/lib/cal";
import { alertes, RESULTATS, type Fiche } from "@/lib/prospect";
import { quandLisible, suiviEffectif } from "@/lib/messages";
import { aFaire } from "@/lib/afaire";
import { Nombre } from "@/components/Deco";
import { Age, Barre } from "@/components/Suivi";

interface Props {
  calls: Call[] | null;
  error: string;
  maj: number; // dernière lecture réussie de Cal
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

// Les appels : les chiffres en gros, les relances, le prochain appel en grand, la suite, les récents
function Appels({ calls, error, maj, now, recents, suivis, fiches, onOpenFiche }: Props) {
  const [next, ...rest] = calls ?? [];
  const taches = aFaire(suivis, recents, fiches, now);
  const jour = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: TZ });
  const auj = new Set([...(calls ?? []), ...recents].filter((c) => jour(c.start) === jour(new Date(now))).map((c) => c.id)).size;

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
      <p className={`live ${error || !maj ? "eteint" : ""}`}>
        <i aria-hidden="true" />
        {error ? "Cal injoignable, nouvel essai dans 30 s" : maj ? <>Cal en direct · lu <Age ms={maj} /></> : "Lecture de Cal…"}
      </p>
      <div className="kpis">
        <div className="kpi accent"><b><Nombre n={auj} /></b><span>aujourd'hui</span></div>
        <div className="kpi"><b><Nombre n={calls?.length ?? 0} /></b><span>à venir</span></div>
        <div className={`kpi ${taches.length ? "chaud" : ""}`}><b><Nombre n={taches.length} /></b><span>à relancer</span></div>
      </div>

      {/* À relancer : en tête, pour n'oublier personne */}
      <h2 className="sec-titre ambre">À relancer<span className="sec-droite">{taches.length ? `${taches.length}` : "personne"}</span></h2>
      <div className="cartes">
        {taches.length === 0 && (
          <p className="carte"><span className="carte-haut"><i className="pastille vert" /><b>Tout est à jour</b></span><span className="texte doux">Personne à relancer, aucun appel à noter.</span></p>
        )}
        {taches.map(({ c, titre, quand, e }) => (
          <button key={`${c.id}-${titre}`} className="carte cliquable" onClick={() => onOpenFiche(c.id)}>
            <span className="carte-haut">
              <i className={`pastille ${e === "retard" ? "rouge" : "ambre"}`} />
              <b>{c.name}</b>
              <span className={`etat ${e === "retard" ? "rouge" : "ambre"}`}>{e === "retard" ? "en retard" : e === "noter" ? "à noter" : quandLisible(quand, now).replace("Aujourd'hui ", "")}</span>
            </span>
            <span className="texte doux">{titre}</span>
          </button>
        ))}
      </div>

      {/* Prochain appel : l'heure en très grand */}
      <h2 className="sec-titre">Prochain appel{next && <span className="sec-droite">{fmtCountdown(next.start, now)}</span>}</h2>
      {calls === null && !error && <p className="carte"><span className="texte doux">Chargement…</span></p>}
      {error && <p className="carte"><span className="texte ambre">Appels indisponibles : {error}</span></p>}
      {calls && !next && <p className="carte"><span className="texte doux">Aucun appel prévu. Les réservations Cal arrivent ici dès qu'elles tombent.</span></p>}
      {next && (
        <div className="carte prochain">
          <div className="gros-chiffre">{fmtTime(next.start)}</div>
          <b className="gros-nom">{next.name}</b>
          <span className="texte doux">{fmtDay(next.start)}{alertes(next).length > 0 && " · à confirmer"}</span>
          {imminent && (
            <>
              <div className="compte">{compte}</div>
              <Barre pct={Math.min(100, Math.max(4, 100 - reste / 36_000))} vivante />
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
        </div>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="sec-titre">Ensuite</h2>
          <div className="cartes">
            {rest.map((c) => (
              <button key={c.id} className="carte cliquable" onClick={() => onOpenFiche(c.id)}>
                <span className="carte-haut"><i className="pastille lavande" /><b>{c.name}</b><span className="etat">{fmtDayShort(c.start)} {fmtTime(c.start)}</span></span>
                <span className="texte doux">{c.answers.map((a) => a.value).slice(0, 2).join(" · ") || c.email}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {recents.length > 0 && (
        <>
          <h2 className="sec-titre">Appels récents</h2>
          <div className="cartes">
            {recents.slice(0, 10).map((c) => {
              const t = etat(c, fiches[c.id]);
              return (
                <button key={c.id} className="carte cliquable" onClick={() => onOpenFiche(c.id)}>
                  <span className="carte-haut">
                    <i className={`pastille ${t === "À noter" ? "ambre" : t === "Signé" ? "vert" : ""}`} />
                    <b>{c.name}</b>
                    <span className={`etat ${t === "À noter" ? "ambre" : "gris"}`}>{t}</span>
                  </span>
                  <span className="texte doux">{fmtDayShort(c.start)} {fmtTime(c.start)} · {c.answers[0]?.value ?? c.email}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

export default memo(Appels);

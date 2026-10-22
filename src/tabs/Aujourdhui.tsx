import { useEffect, useMemo, useState } from "react";
import { fmtTime, TZ, type Call } from "@/lib/cal";
import { markdownSections } from "@/lib/markdown";
import { aFaire } from "@/lib/afaire";
import { quandLisible } from "@/lib/messages";
import type { Fiche } from "@/lib/prospect";
import type { PushStatus } from "@/lib/usePushSubscription";
import Suivi, { Repli, type SuiviData } from "@/components/Suivi";
import { Anneau, Nombre, Sec } from "@/components/Deco";
import { IcBell, IcPhone } from "@/components/Icons";

const NOTIF_TEXT: Partial<Record<PushStatus, string>> = {
  "off":           "Active les rappels d'appels sur cet appareil.",
  "busy":          "Activation en cours…",
  "denied":        "Notifications bloquées : Réglages iPhone → Notifications → Dring → Autoriser.",
  "not-installed": "Ouvre l'app depuis l'icône Dring de l'écran d'accueil pour activer les rappels.",
};

interface Props {
  calls: Call[] | null;
  recents: Call[];
  suivis: Call[];
  fiches: Record<number, Fiche>;
  suivi: SuiviData;
  point: { markdown: string; updatedAt: string | null };
  now: number;
  pushStatus: PushStatus;
  pushError: string;
  onEnableNotif: () => void;
  onOpenFiche: (id: number) => void;
  onGo: (tab: "appels") => void;
}

const jour = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: TZ });

// Accueil : ce qu'il y a à faire aujourd'hui, le prochain appel, l'essentiel du point
export default function Aujourdhui({ calls, recents, suivis, fiches, suivi, point, now, pushStatus, pushError, onEnableNotif, onOpenFiche, onGo }: Props) {
  const taches = aFaire(suivis, recents, fiches, now);
  const next = calls?.[0];
  const appelsDuJour = (calls ?? []).filter((c) => jour(c.start) === jour(new Date(now))).length;
  const pourToi = suivi.attente?.length ?? 0;
  const sections = useMemo(() => markdownSections(point.markdown), [point.markdown]);

  // Compte à rebours à la seconde dans la dernière heure
  const [tic, setTic] = useState(Date.now());
  useEffect(() => {
    if (!next) return;
    const id = setInterval(() => { if (next.start.getTime() - Date.now() < 3600_000) setTic(Date.now()); }, 1000);
    return () => clearInterval(id);
  }, [next?.id]);
  const reste = next ? next.start.getTime() - Math.max(tic, now) : 0;
  const compte = !next ? "" : reste <= 0 ? "maintenant"
    : reste < 3600_000 ? `${Math.floor(reste / 60_000)} min ${String(Math.floor((reste % 60_000) / 1000)).padStart(2, "0")} s`
    : quandLisible(next.start, now);

  const vers = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      {pushStatus !== "on" && pushStatus !== "checking" && pushStatus !== "unsupported" && (
        <div className="notice">
          <p>{pushStatus === "error" ? `Activation impossible : ${pushError}` : NOTIF_TEXT[pushStatus]}</p>
          {(pushStatus === "off" || pushStatus === "error") && (
            <button className="textbtn" onClick={onEnableNotif}>{pushStatus === "error" ? "Réessayer" : "Activer"}</button>
          )}
        </div>
      )}

      {/* Les 3 chiffres du jour */}
      <div className="compteurs">
        <button className={taches.length ? "chaud" : "calme"} onClick={() => vers("a-relancer")}>
          <span className="compteur-n"><Nombre n={taches.length} /></span><span className="compteur-l">à relancer</span>
        </button>
        <button onClick={() => onGo("appels")}>
          <span className="compteur-n"><Nombre n={appelsDuJour} /></span><span className="compteur-l">appel{appelsDuJour > 1 ? "s" : ""} aujourd'hui</span>
        </button>
        <button onClick={() => vers("pour-toi")}>
          <span className="compteur-n"><Nombre n={pourToi} /></span><span className="compteur-l">pour toi</span>
        </button>
      </div>

      {/* Prochain appel, avec l'anneau qui se remplit pendant la dernière heure */}
      <Sec icone={IcPhone} teinte="vert">Prochain appel</Sec>
      {calls === null ? <p className="empty">Chargement…</p> : !next ? (
        <p className="empty">Aucun appel prévu.</p>
      ) : (
        <div className="list">
          <button className="li prochain" onClick={() => onOpenFiche(next.id)}>
            <Anneau pct={reste < 3600_000 ? 1 - reste / 3600_000 : 0}><span>{fmtTime(next.start)}</span></Anneau>
            <span className="li-main">
              <span className="li-title">{next.name}</span>
              <span className={`li-sub ${reste < 3600_000 ? "accent" : ""}`}>{reste < 3600_000 ? `dans ${compte}` : compte}</span>
            </span>
            <span className="chev" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* À relancer */}
      <section id="a-relancer">
        <Sec icone={IcBell} teinte="orange" sonne={taches.length > 0} droite={taches.length || undefined}>À relancer</Sec>
        {taches.length === 0 ? (
          <p className="tout-bon"><span className="coche-anim" aria-hidden="true" />Personne à relancer, tout est à jour.</p>
        ) : (
          <div className="list">
            {taches.map(({ c, titre, quand, e }) => (
              <button key={`${c.id}-${titre}`} className="li" onClick={() => onOpenFiche(c.id)}>
                <span className="li-main"><span className="li-title">{c.name}</span><span className="li-sub">{titre}</span></span>
                <span className={`li-side ${e === "retard" ? "late" : "todo"}`}>
                  {e === "retard" ? "En retard" : e === "noter" ? "À noter" : quandLisible(quand, now).replace("Aujourd'hui ", "")}
                </span>
                <span className="chev" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Pour toi, projets, et le reste replié */}
      <Suivi data={suivi} now={now} apres={sections.length > 0 && (
        <Repli titre="Le point complet" n={sections.length}>
          {sections.map((s) => (
            <details key={s.title} className="acc">
              <summary>{s.title}</summary>
              <div className="md" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ))}
        </Repli>
      )} />
    </>
  );
}

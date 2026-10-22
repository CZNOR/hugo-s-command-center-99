import { memo, useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import { aFaire } from "@/lib/afaire";
import { fmtTime, TZ, type Call } from "@/lib/cal";
import type { Fiche } from "@/lib/prospect";
import { Age, CarteProjet, CarteSession, Repli, type SuiviData } from "@/components/Suivi";
import { Anneau, Nombre } from "@/components/Deco";

interface Props {
  suivi: SuiviData;
  point: { markdown: string; updatedAt: string | null };
  now: number;
  callsMaj: number; // dernière lecture réussie de Cal
  calls: Call[] | null;
  recents: Call[];
  suivis: Call[];
  fiches: Record<number, Fiche>;
  onOpenFiche: (id: number) => void;
}

// Le texte du point écrit le matin vieillit dans la journée : on n'en garde que ce qui n'existe
// pas en direct (les chiffres, les blocages, le bilan du soir une fois rempli).
const EN_DIRECT = /aujourd|attente|tourne/i;

// Une ligne du plan du jour
interface Item { heure: string; quoi: string; qui: string; fait?: boolean; retard?: boolean; ouvrir?: () => void; tri: string }

const jourDe = (d: Date) => d.toLocaleDateString("fr-CA", { timeZone: TZ });
const hh = (d: Date) => fmtTime(d).replace(":", "h");

// « sam. 24/10 », « avant lun. 26/10 », « 17h30 » : date (jour, mois) et heure lues dans le texte
function lireQuand(quand = "", aujourdhui: string): { plusTard: boolean; heure: string } {
  const [, mois, jour] = aujourdhui.split("-").map(Number);
  const d = quand.match(/(\d{1,2})\/(\d{1,2})/);
  const m = d ? Number(d[2]) : 0, j = d ? Number(d[1]) : 0;
  const plusTard = !!d && (m > mois || (m === mois && j > jour) || m < mois - 6); // m < mois - 6 : l'an prochain
  const h = quand.match(/(\d{1,2})h(\d{2})?/);
  return { plusTard, heure: h ? `${h[1].padStart(2, "0")}h${h[2] ?? "00"}` : "" };
}

// Accueil : le reporting en direct, dans le style du widget Suivi.
// Le plan du jour (ce qui reste, ce qui est fait), les sessions au travail, les projets.
// Rien ne se modifie ici : tout se change depuis le Mac.
function Point({ suivi, point, now, callsMaj, calls, recents, suivis, fiches, onOpenFiche }: Props) {
  const sections = useMemo(
    () => markdownSections(point.markdown).filter((s) => !EN_DIRECT.test(s.title) && !/remplie au point du soir/.test(s.html)),
    [point.markdown],
  );
  const releve = point.markdown.match(/Relevé à (\d{1,2}h\d{2})/)?.[1];
  const aujourdhui = jourDe(new Date(now));

  // ── Le plan du jour : appels, relances, ce qu'il a à faire, ce qui est fait ──
  const appels = [...(calls ?? []), ...recents].filter((c, i, t) => jourDe(c.start) === aujourdhui && t.findIndex((x) => x.id === c.id) === i);
  const plan: Item[] = [];
  for (const c of appels) {
    const passe = c.end.getTime() < now;
    if (passe && !fiches[c.id]?.suivi?.venu) continue; // pas encore noté : il est dans « Noter l'appel »
    plan.push({ heure: hh(c.start), quoi: `Appel · ${c.name}`, qui: "Appels", fait: passe, ouvrir: () => onOpenFiche(c.id), tri: hh(c.start) });
  }
  for (const r of aFaire(suivis, recents, fiches, now)) {
    const noter = r.e === "noter";
    plan.push({
      heure: r.e === "retard" ? "retard" : noter ? "à noter" : hh(r.quand),
      quoi: noter ? `Noter l'appel de ${r.c.name}` : `Relancer ${r.c.name}`,
      qui: "Appels", retard: r.e === "retard", ouvrir: () => onOpenFiche(r.c.id), tri: r.e === "retard" ? "00" : noter ? "01" : hh(r.quand),
    });
  }
  const plusTard: { quand: string; quoi: string; qui: string }[] = [];
  for (const a of suivi.attente ?? []) {
    if (a.src === "session") continue; // une session attend sa réponse : visible dans « En direct »
    const q = lireQuand(a.quand, aujourdhui);
    if (q.plusTard) plusTard.push({ quand: a.quand ?? "", quoi: a.quoi, qui: a.qui });
    else plan.push({ heure: q.heure, quoi: a.quoi, qui: a.qui, tri: q.heure || "99" });
  }
  for (const f of suivi.faits ?? []) plan.push({ heure: f.heure, quoi: f.quoi, qui: f.qui, fait: true, tri: f.heure });
  const aFaireAuj = plan.filter((x) => !x.fait).sort((a, b) => a.tri.localeCompare(b.tri));
  const faitsAuj = plan.filter((x) => x.fait).sort((a, b) => a.tri.localeCompare(b.tri));

  // ── Le direct ──
  const majMac = suivi.maj ? suivi.maj * 1000 : null;
  const horsLigne = !majMac || now - majMac > 300_000;
  const sessions = (suivi.direct ?? []).filter((s) => s.statut === "travaille" || s.statut === "attend");
  const projets = suivi.projets ?? [];
  const gros = projets.filter((p) => (p.niveau ?? "projet") === "projet");
  const outils = projets.filter((p) => p.niveau === "outil");
  const finis = projets.filter((p) => p.niveau === "fini");
  const questions = new Map((suivi.attente ?? []).filter((a) => a.src === "session").map((a) => [a.qui, a.quoi]));

  // Chaque source et son âge : tout doit bouger en continu
  const rappels = suivi.sante?.rappels ? Date.parse(suivi.sante.rappels) : null;
  const sources = [
    { nom: "Sessions et projets", detail: "envoyés par ton Mac toutes les 20 s", ms: majMac, max: 90_000 },
    { nom: "Appels Cal", detail: "relus toutes les 30 s", ms: callsMaj || null, max: 120_000 },
    { nom: "Rappels d'appels", detail: "le serveur vérifie chaque minute", ms: rappels, max: 180_000 },
  ];
  const enRetard = sources.filter((x) => x.ms == null || now - x.ms > x.max);

  return (
    <>
      <p className={`live ${enRetard.length ? "eteint" : ""}`}>
        <i aria-hidden="true" />
        {horsLigne ? "Mac hors ligne · le suivi reprend quand il se rallume"
          : enRetard.length ? `${enRetard.map((x) => x.nom).join(", ")} : en retard`
          : <>En direct · tout est à jour · <Age ms={majMac} /></>}
      </p>

      {/* En-tête façon widget : l'anneau de la journée et le résumé en une ligne */}
      <div className="resume">
        <Anneau part={faitsAuj.length / Math.max(1, faitsAuj.length + aFaireAuj.length)} calme={!aFaireAuj.length}>
          <Nombre n={aFaireAuj.length} />
        </Anneau>
        <span className="resume-texte">
          <b>{aFaireAuj.length ? `${aFaireAuj.length} chose${aFaireAuj.length > 1 ? "s" : ""} à faire aujourd'hui` : "Rien à faire, tout est fait"}</b>
          <span>
            {faitsAuj.length} fait{faitsAuj.length > 1 ? "s" : ""}
            {" · "}{sessions.length} au travail
            {" · "}{appels.length ? `${appels.length} appel${appels.length > 1 ? "s" : ""}` : "aucun appel"}
          </span>
        </span>
      </div>

      <h2 className="sec-titre ambre">Aujourd'hui<span className="sec-droite">{aFaireAuj.length ? `${aFaireAuj.length} à faire` : "tout est fait"}</span></h2>
      <div className="cartes">
        {plan.length === 0 && <p className="carte"><span className="texte doux">Rien de prévu aujourd'hui.</span></p>}
        {[...aFaireAuj, ...faitsAuj].map((x, i) => {
          const contenu = (
            <span className="carte-haut">
              <i className={`pastille ${x.fait ? "vert" : x.retard ? "rouge" : "ambre"}`} />
              {x.heure && <span className={`heure ${x.retard ? "rouge" : x.heure === "à noter" ? "ambre" : ""}`}>{x.fait ? "fait" : x.heure}</span>}
              <b>{x.quoi}</b>
              <span className="qui">{x.qui}</span>
            </span>
          );
          return x.ouvrir
            ? <button key={i} className={`carte cliquable ${x.fait ? "fait" : ""}`} onClick={x.ouvrir}>{contenu}</button>
            : <div key={i} className={`carte ${x.fait ? "fait" : ""}`}>{contenu}</div>;
        })}
      </div>

      <h2 className="sec-titre">En direct<span className="sec-droite">{sessions.length ? `${sessions.length} au travail` : "au calme"}</span></h2>
      <div className="cartes">
        {sessions.length === 0 && <p className="carte"><span className="texte doux">Aucune session ne travaille en ce moment.</span></p>}
        {sessions.map((s, i) => <CarteSession key={i} s={s} question={questions.get(s.nom)} />)}
      </div>

      {gros.length > 0 && (
        <>
          <h2 className="sec-titre">Projets</h2>
          <div className="cartes">{gros.map((p) => <CarteProjet key={p.nom} p={p} />)}</div>
        </>
      )}

      <div className="replis">
        <Repli titre="Plus tard" n={plusTard.length}>
          {plusTard.map((a, i) => (
            <div key={i} className="ligne-repli">
              <span className="gauche">{a.quand.replace(/^avant /, "≤ ")}</span>
              <span className="milieu">{a.quoi}</span>
              <span className="droite">{a.qui}</span>
            </div>
          ))}
        </Repli>
        <Repli titre="Outils" n={outils.length}>
          <div className="cartes">{outils.map((p) => <CarteProjet key={p.nom} p={p} />)}</div>
        </Repli>
        <Repli titre="Terminés" n={finis.length}>
          {finis.map((p) => <div key={p.nom} className="ligne-repli"><span className="gauche ok">fini</span><span className="milieu">{p.nom}</span></div>)}
        </Repli>
        <Repli titre="Mises à jour" n={sources.length + 1}>
          {sources.map((x) => {
            const ok = x.ms != null && now - x.ms <= x.max;
            return (
              <div key={x.nom} className="ligne-repli">
                <span className={`gauche ${ok ? "ok" : "retard"}`}>{ok ? "ok" : "retard"}</span>
                <span className="milieu">{x.nom}<small>{x.detail}</small></span>
                <span className="droite"><Age ms={x.ms} /></span>
              </div>
            );
          })}
          <div className="ligne-repli">
            <span className="gauche ok">ok</span>
            <span className="milieu">Chiffres du point<small>relevés au point du matin et du soir</small></span>
            <span className="droite">{releve ? `à ${releve}` : "—"}</span>
          </div>
        </Repli>
        <Repli titre="Chiffres et blocages" n={sections.length}>
          {releve && <p className="explain">Relevés au point de {releve}.</p>}
          {sections.map((s) => (
            <details key={s.title} className="acc">
              <summary>{s.title}</summary>
              <div className="md" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ))}
        </Repli>
      </div>
    </>
  );
}

export default memo(Point);

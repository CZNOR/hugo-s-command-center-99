import { useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import { aFaire } from "@/lib/afaire";
import { fmtTime, TZ, type Call } from "@/lib/cal";
import type { Fiche } from "@/lib/prospect";
import { Avancement, pctProjet, Repli, type SuiviData } from "@/components/Suivi";
import { Nombre } from "@/components/Deco";
import { IcCheck, IcFolder, IcList } from "@/components/Icons";

interface Props {
  suivi: SuiviData;
  point: { markdown: string; updatedAt: string | null };
  now: number;
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
  const [an, mois, jour] = aujourdhui.split("-").map(Number);
  const d = quand.match(/(\d{1,2})\/(\d{1,2})/);
  const plusTard = !!d && (Number(d[2]) > mois || (Number(d[2]) === mois && Number(d[1]) > jour) || (Number(d[2]) < mois - 6 && an > 0));
  const h = quand.match(/(\d{1,2})h(\d{2})?/);
  return { plusTard, heure: h ? `${h[1].padStart(2, "0")}h${h[2] ?? "00"}` : "" };
}

// Accueil : le reporting en direct. Le plan du jour (ce qui est fait, ce qui reste),
// les sessions au travail, les projets. Rien ne se modifie ici : tout se change depuis le Mac.
export default function Point({ suivi, point, now, calls, recents, suivis, fiches, onOpenFiche }: Props) {
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
    else plan.push({ heure: q.heure || "—", quoi: a.quoi, qui: a.qui, tri: q.heure || "99" });
  }
  for (const f of suivi.faits ?? []) plan.push({ heure: f.heure, quoi: f.quoi, qui: f.qui, fait: true, tri: f.heure });
  const aFaireAuj = plan.filter((x) => !x.fait).sort((a, b) => a.tri.localeCompare(b.tri));
  const faitsAuj = plan.filter((x) => x.fait).sort((a, b) => a.tri.localeCompare(b.tri));

  // ── Le direct ──
  const ageS = suivi.maj ? Math.max(0, Math.round(now / 1000 - suivi.maj)) : null;
  const horsLigne = ageS == null || ageS > 300;
  const sessions = (suivi.direct ?? []).filter((s) => s.statut === "travaille" || s.statut === "attend");
  const projets = suivi.projets ?? [];
  const gros = projets.filter((p) => (p.niveau ?? "projet") === "projet");
  const outils = projets.filter((p) => p.niveau === "outil");
  const finis = projets.filter((p) => p.niveau === "fini");
  const questions = new Map((suivi.attente ?? []).filter((a) => a.src === "session").map((a) => [a.qui, a.quoi]));

  return (
    <>
      <p className={`live ${horsLigne ? "eteint" : ""}`}>
        <i aria-hidden="true" />
        {horsLigne ? `Mac hors ligne${ageS != null ? ` depuis ${Math.round(ageS / 60)} min` : ""}` : `En direct · mis à jour il y a ${ageS} s`}
      </p>

      <div className="kpis">
        <div className="kpi accent"><b><Nombre n={faitsAuj.length} /><small>/{faitsAuj.length + aFaireAuj.length}</small></b><span>fait aujourd'hui</span></div>
        <div className="kpi"><b><Nombre n={sessions.length} /></b><span>session{sessions.length > 1 ? "s" : ""} au travail</span></div>
        <div className="kpi"><b><Nombre n={appels.length} /></b><span>appel{appels.length > 1 ? "s" : ""} aujourd'hui</span></div>
      </div>

      <section className="bloc">
        <h2 className="bloc-titre"><IcList />Aujourd'hui<span className="bloc-droite">{aFaireAuj.length ? `${aFaireAuj.length} à faire` : "tout est fait"}</span></h2>
        {plan.length === 0 && <p className="ligne-sous">Rien de prévu aujourd'hui.</p>}
        {[...aFaireAuj, ...faitsAuj].map((x, i) => {
          const contenu = (
            <>
              <span className={`plan-heure ${x.retard ? "retard" : ""}`}>{x.fait ? <IcCheck /> : x.heure}</span>
              <span className="plan-quoi">{x.quoi}</span>
              <span className="plan-qui">{x.qui}</span>
            </>
          );
          return x.ouvrir
            ? <button key={i} className={`plan-ligne ${x.fait ? "fait" : ""}`} onClick={x.ouvrir}>{contenu}</button>
            : <div key={i} className={`plan-ligne ${x.fait ? "fait" : ""}`}>{contenu}</div>;
        })}
      </section>

      <section className="bloc">
        <h2 className="bloc-titre"><span className={`direct ${horsLigne ? "eteint" : ""}`} aria-hidden="true" />En direct<span className="bloc-droite">{sessions.length ? `${sessions.length} au travail` : "au calme"}</span></h2>
        {sessions.length === 0 && <p className="ligne-sous">Aucune session ne travaille en ce moment.</p>}
        {sessions.map((s, i) => (
          <Avancement
            key={i} nom={s.nom} pct={s.statut === "attend" ? null : s.pct}
            droite={s.statut === "attend" ? "t'attend" : s.pct == null ? "en cours" : undefined} alerte={s.statut === "attend"}
            texte={s.statut === "attend" ? questions.get(s.nom) ?? s.etape : `${s.etape}${s.reste_min ? ` · ~${s.reste_min} min` : ""}`}
          />
        ))}
      </section>

      {gros.length > 0 && (
        <section className="bloc">
          <h2 className="bloc-titre"><IcFolder />Projets</h2>
          {gros.map((p) => (
            <Avancement
              key={p.nom} nom={p.nom} pct={pctProjet(p)} droite={`${p.faites}/${p.total}`} texte={p.prochaine || p.etape}
              detail={<>
                {p.etape && <span><b>Où on en est</b> {p.etape}</span>}
                {p.objectif && <span><b>Objectif</b> {p.objectif}</span>}
                {p.attend_hugo && <span className="pour-toi"><b>Pour toi</b> {p.attend_hugo}</span>}
              </>}
            />
          ))}
        </section>
      )}

      <div className="replis">
        <Repli titre="Plus tard" n={plusTard.length}>
          {plusTard.map((a, i) => (
            <div key={i} className="plan-ligne">
              <span className="plan-heure large">{a.quand.replace(/^avant /, "≤ ")}</span>
              <span className="plan-quoi">{a.quoi}</span>
              <span className="plan-qui">{a.qui}</span>
            </div>
          ))}
        </Repli>
        <Repli titre="Outils" n={outils.length}>
          {outils.map((p) => <Avancement key={p.nom} nom={p.nom} pct={pctProjet(p)} droite={`${p.faites}/${p.total}`} texte={p.prochaine || p.etape} />)}
        </Repli>
        <Repli titre="Terminés" n={finis.length}>{finis.map((p) => <div key={p.nom} className="plan-ligne fait"><span className="plan-heure"><IcCheck /></span><span className="plan-quoi">{p.nom}</span></div>)}</Repli>
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

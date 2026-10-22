import { useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import { aFaire } from "@/lib/afaire";
import type { Call } from "@/lib/cal";
import type { Fiche } from "@/lib/prospect";
import Suivi, { Repli, type Attente, type SuiviData } from "@/components/Suivi";
import { IcBell } from "@/components/Icons";

interface Props {
  suivi: SuiviData;
  point: { markdown: string; updatedAt: string | null };
  now: number;
  recents: Call[];
  suivis: Call[];
  fiches: Record<number, Fiche>;
  onGo: (tab: "appels") => void;
  onFait: (a: Attente) => void;
}

// Le texte du point écrit le matin vieillit dans la journée : on n'en garde que ce qui n'existe
// pas en direct (les chiffres, les blocages, le bilan du soir une fois rempli).
// « Aujourd'hui », « En attente de ton go » et « Ce qui tourne » sont remplacés par le suivi en direct.
const EN_DIRECT = /aujourd|attente|tourne/i;

// Accueil : le suivi en direct (pour toi, sessions au travail, projets) + le point complet replié
export default function Point({ suivi, point, now, recents, suivis, fiches, onGo, onFait }: Props) {
  const sections = useMemo(
    () => markdownSections(point.markdown).filter((s) => !EN_DIRECT.test(s.title) && !/remplie au point du soir/.test(s.html)),
    [point.markdown],
  );
  const releve = point.markdown.match(/Relevé à (\d{1,2}h\d{2})/)?.[1];
  const relances = aFaire(suivis, recents, fiches, now).length;

  return (
    <>
      {relances > 0 && (
        <button className="rappel-relances" onClick={() => onGo("appels")}>
          <span className="cloche"><IcBell /></span>
          <b>{relances} relance{relances > 1 ? "s" : ""} à faire</b>
          <span className="fleche-droite" aria-hidden="true">→</span>
        </button>
      )}

      <Suivi data={suivi} now={now} onFait={onFait} apres={sections.length > 0 && (
        <Repli titre="Chiffres et blocages" n={sections.length}>
          {releve && <p className="explain">Relevés au point de {releve}. Le reste de la page est en direct.</p>}
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

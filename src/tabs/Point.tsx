import { useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import { aFaire } from "@/lib/afaire";
import type { Call } from "@/lib/cal";
import type { Fiche } from "@/lib/prospect";
import Suivi, { Repli, type SuiviData } from "@/components/Suivi";
import { IcBell } from "@/components/Icons";

interface Props {
  suivi: SuiviData;
  point: { markdown: string; updatedAt: string | null };
  now: number;
  recents: Call[];
  suivis: Call[];
  fiches: Record<number, Fiche>;
  onGo: (tab: "appels") => void;
}

// Accueil : le suivi en direct (pour toi, sessions au travail, projets) + le point complet replié
export default function Point({ suivi, point, now, recents, suivis, fiches, onGo }: Props) {
  const sections = useMemo(() => markdownSections(point.markdown), [point.markdown]);
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

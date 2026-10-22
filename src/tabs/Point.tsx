import { useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import Suivi, { type SuiviData } from "@/components/Suivi";

interface Props { markdown: string; updatedAt: string | null; suivi: SuiviData; now: number }

export default function Point({ markdown, updatedAt, suivi, now }: Props) {
  const sections = useMemo(() => markdownSections(markdown), [markdown]);
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : null;

  return (
    <>
      <Suivi data={suivi} now={now} />

      <h2 className="sh">Le point complet{when && <span>{when}</span>}</h2>
      {!sections.length && <div className="group"><p className="item empty">Pas encore de point aujourd'hui.</p></div>}
      {sections.length > 0 && (
        <div className="group">
          {sections.map((s, i) => (
            <details key={s.title} className="acc" open={i === 0}>
              <summary>{s.title}</summary>
              <div className="md" dangerouslySetInnerHTML={{ __html: s.html }} />
            </details>
          ))}
        </div>
      )}
    </>
  );
}

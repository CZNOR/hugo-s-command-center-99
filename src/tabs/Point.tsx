import { useMemo } from "react";
import { markdownSections } from "@/lib/markdown";
import Suivi, { Repli, type SuiviData } from "@/components/Suivi";

interface Props { markdown: string; updatedAt: string | null; suivi: SuiviData; now: number }

export default function Point({ markdown, updatedAt, suivi, now }: Props) {
  const sections = useMemo(() => markdownSections(markdown), [markdown]);
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : null;

  return (
    <>
      <Suivi data={suivi} now={now} />

      {!sections.length && <p className="empty">Pas encore de point aujourd'hui.</p>}
      {sections.length > 0 && (
        <div className="list replis">
          <Repli titre={`Le point complet${when ? ` · ${when}` : ""}`} n={sections.length}>
            {sections.map((s) => (
              <details key={s.title} className="acc">
                <summary>{s.title}</summary>
                <div className="md" dangerouslySetInnerHTML={{ __html: s.html }} />
              </details>
            ))}
          </Repli>
        </div>
      )}
    </>
  );
}

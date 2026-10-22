import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import Suivi, { type SuiviData } from "@/components/Suivi";

interface Props { markdown: string; updatedAt: string | null; suivi: SuiviData; now: number }

export default function Point({ markdown, updatedAt, suivi, now }: Props) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : null;

  return (
    <>
      <Suivi data={suivi} now={now} />
      {!markdown && <div className="card empty">Le point du jour n'a pas encore été envoyé.</div>}
      {when && <p className="sub" style={{ margin: "16px 0 10px" }}>Point du jour envoyé {when}</p>}
      <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

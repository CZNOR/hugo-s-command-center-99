import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function Point({ markdown, updatedAt }: { markdown: string; updatedAt: string | null }) {
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  const when = updatedAt
    ? new Date(updatedAt).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })
    : null;

  if (!markdown) return <div className="card empty">Le point du jour n'a pas encore été envoyé.</div>;
  return (
    <>
      {when && <p className="sub" style={{ marginBottom: 10 }}>Envoyé {when}</p>}
      <div className="md" dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

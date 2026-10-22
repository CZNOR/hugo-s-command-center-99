import { GROUPES } from "@/content/liens";
import CopyButton from "@/components/CopyButton";

export default function Liens({ toast }: { toast: (msg: string) => void }) {
  return (
    <>
      {GROUPES.map((g) => (
        <section key={g.title}>
          <h2 className="sh">{g.title}</h2>
          <div className="group">
            {g.liens.map((l) => (
              <div key={l.url} className="item row">
                <a className="n" href={l.url} target="_blank" rel="noreferrer">
                  <b>{l.label}{l.detail && <em className="amount"> · {l.detail}</em>}</b>
                  <span>{l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                </a>
                <CopyButton text={l.url} onCopied={() => toast("Lien copié")} />
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="foot">Un tap sur le carré copie le lien.</p>
    </>
  );
}

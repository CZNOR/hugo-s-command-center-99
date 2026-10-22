import { GROUPES } from "@/content/liens";
import CopyButton from "@/components/CopyButton";

export default function Liens({ toast }: { toast: (msg: string) => void }) {
  return (
    <>
      {GROUPES.map((g) => (
        <section key={g.title}>
          <div className="lbl section">{g.title}</div>
          <div className="card">
            {g.liens.map((l, i) => (
              <div key={l.url}>
                {i > 0 && <div className="sep" />}
                <div className="row">
                  <a className="n" href={l.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <b>{l.label}{l.detail && <em className="amount"> · {l.detail}</em>}</b>
                    <span>{l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                  </a>
                  <CopyButton text={l.url} onCopied={() => toast("Lien copié")} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p className="sub" style={{ textAlign: "center" }}>Un tap sur le carré = lien copié, prêt à coller.</p>
    </>
  );
}

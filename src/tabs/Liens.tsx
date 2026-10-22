import { LIENS } from "@/content/liens";
import CopyButton from "@/components/CopyButton";

export default function Liens({ toast }: { toast: (msg: string) => void }) {
  return (
    <>
      <h1 className="h">Liens <em>en appel</em></h1>
      <div className="card">
        {LIENS.map((l, i) => (
          <div key={l.url}>
            {i > 0 && <div className="sep" />}
            <div className="row">
              <a className="n" href={l.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                <b>{l.label}</b>
                <span>{l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
              </a>
              <CopyButton text={l.url} onCopied={() => toast("Lien copié")} />
            </div>
          </div>
        ))}
      </div>
      <p className="sub" style={{ textAlign: "center" }}>Un tap sur le carré = lien copié, prêt à coller.</p>
    </>
  );
}

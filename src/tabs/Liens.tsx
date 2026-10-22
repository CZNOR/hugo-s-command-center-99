import { GROUPES } from "@/content/liens";
import CopyButton from "@/components/CopyButton";

export default function Liens({ toast }: { toast: (msg: string) => void }) {
  return (
    <>
      {GROUPES.map((g) => (
        <section key={g.title}>
          <h2 className="sec">{g.title}</h2>
          <div className="list">
            {g.liens.map((l) => (
              <div key={l.url} className="li">
                <a className="li-main" href={l.url} target="_blank" rel="noreferrer">
                  <span className="li-title">{l.label}{l.detail && <span className={g.title.startsWith("Paiement") ? "price" : "li-note"}> · {l.detail}</span>}</span>
                  <span className="li-sub ellipsis">{l.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                </a>
                <CopyButton text={l.url} onCopied={() => toast("Lien copié")} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

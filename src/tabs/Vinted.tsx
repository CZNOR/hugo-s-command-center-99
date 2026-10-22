import { useState } from "react";
import { VINTED } from "@/content/vinted";
import CopyButton, { copyText } from "@/components/CopyButton";
import { IcCopy } from "@/components/Icons";

export default function Vinted({ toast }: { toast: (msg: string) => void }) {
  const [id, setId] = useState(VINTED[0].id);
  const item = VINTED.find((v) => v.id === id)!;

  return (
    <>
      <h1 className="h">Textes <em>Vinted</em></h1>
      <div className="seg">
        {VINTED.map((v) => (
          <button key={v.id} className={v.id === id ? "on" : ""} onClick={() => setId(v.id)}>{v.label}</button>
        ))}
      </div>
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="n">
            <div className="lbl">Description</div>
            <div className="txt">{item.text}</div>
          </div>
          <CopyButton text={item.text} onCopied={() => toast("Texte copié")} />
        </div>
      </div>
      <button className="btn" onClick={async () => { if (await copyText(item.text)) toast("Texte copié"); }}>
        <IcCopy />Copier le texte
      </button>
      <p className="sub" style={{ marginTop: 10, textAlign: "center" }}>Couleur et taille à remplir dans l'annonce.</p>
    </>
  );
}

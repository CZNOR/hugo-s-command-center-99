import { memo, useState } from "react";
import { VINTED } from "@/content/vinted";
import { copyText } from "@/components/CopyButton";

function Vinted({ toast }: { toast: (msg: string) => void }) {
  const [id, setId] = useState(VINTED[0].id);
  const item = VINTED.find((v) => v.id === id)!;

  return (
    <>
      <div className="segmented glisse top-gap" style={{ "--n": VINTED.length, "--i": VINTED.findIndex((v) => v.id === id) } as React.CSSProperties}>
        {VINTED.map((v) => (
          <button key={v.id} className={v.id === id ? "on" : ""} onClick={() => setId(v.id)}>{v.label}</button>
        ))}
      </div>
      <p className="vinted-text">{item.text}</p>
      <button className="btn copier-texte" onClick={async () => { if (await copyText(item.text)) toast("Texte copié"); }}>Copier le texte</button>
      <p className="explain">Couleur et taille à remplir dans l'annonce.</p>
    </>
  );
}

export default memo(Vinted);

import { useState } from "react";
import { IcCheck, IcCopy } from "./Icons";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Repli pour les vieux Safari : sélection d'un champ caché
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

// Petit carré « copier » qui passe en lavande avec une coche pendant 1,5 s
export default function CopyButton({ text, onCopied }: { text: string; onCopied?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={`copy${done ? " done" : ""}`}
      aria-label="Copier"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          onCopied?.();
          setTimeout(() => setDone(false), 1500);
        }
      }}
    >
      {done ? <IcCheck /> : <IcCopy />}
    </button>
  );
}

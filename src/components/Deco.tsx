import { useEffect, useRef, useState } from "react";

// Titre de section avec sa tuile d'icône colorée (comme les réglages de l'iPhone)
type Teinte = "lav" | "orange" | "vert" | "rouge" | "bleu" | "jaune" | "gris" | "rose";
export function Sec({ icone: Icone, teinte, droite, sonne, children }: {
  icone: () => JSX.Element; teinte: Teinte; droite?: React.ReactNode; sonne?: boolean; children: React.ReactNode;
}) {
  return (
    <h2 className="sec">
      <span className={`tuile ${teinte} ${sonne ? "sonne" : ""}`} aria-hidden="true"><Icone /></span>
      <span className="sec-titre">{children}</span>
      {droite !== undefined && <span className="sec-droite">{droite}</span>}
    </h2>
  );
}

// Nombre qui compte jusqu'à sa valeur (0,6 s)
export function Nombre({ n }: { n: number }) {
  const [v, setV] = useState(0);
  const depart = useRef(0);
  useEffect(() => {
    const de = depart.current, t0 = performance.now();
    let raf = 0;
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      const val = Math.round(de + (n - de) * (1 - Math.pow(1 - k, 3)));
      setV(val);
      if (k < 1) raf = requestAnimationFrame(pas); else depart.current = n;
    };
    raf = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(raf);
  }, [n]);
  return <>{v}</>;
}

// Anneau de compte à rebours : se remplit pendant la dernière heure avant l'appel
export function Anneau({ pct, children }: { pct: number; children?: React.ReactNode }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <span className="anneau">
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={r} className="anneau-fond" />
        <circle cx="32" cy="32" r={r} className="anneau-plein" style={{ strokeDasharray: c, strokeDashoffset: c * (1 - Math.max(0, Math.min(1, pct))) }} />
      </svg>
      <span className="anneau-centre">{children}</span>
    </span>
  );
}

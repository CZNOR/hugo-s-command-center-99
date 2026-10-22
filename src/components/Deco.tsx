import { useEffect, useRef, useState } from "react";

// Nombre qui compte jusqu'à sa valeur (0,6 s) : les gros chiffres du Point et des Appels
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

// Anneau d'avancement (comme le widget Suivi) : se remplit selon la part faite ; au centre, ce qui reste (pastille ambre)
export function Anneau({ part, calme, children }: { part: number; calme?: boolean; children?: React.ReactNode }) {
  const r = 19, c = 2 * Math.PI * r;
  return (
    <span className="anneau">
      <svg viewBox="0 0 46 46" aria-hidden="true">
        <circle cx="23" cy="23" r={r} className="anneau-fond" />
        <circle cx="23" cy="23" r={r} className="anneau-plein" style={{ strokeDasharray: c, strokeDashoffset: c * (1 - Math.max(0, Math.min(1, part))) }} />
      </svg>
      <span className={`anneau-centre ${calme ? "calme" : ""}`}>{children}</span>
    </span>
  );
}

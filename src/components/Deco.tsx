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

import { useEffect, useRef } from "react";
import { useBusiness } from "@/lib/businessContext";

interface Ripple {
  x: number;
  y: number;
  startTime: number;
  maxRadius: number;
  duration: number;
  r: number;
  g: number;
  b: number;
  maxAlpha: number;
}

export default function RippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const { activeBusiness } = useBusiness();
  const bizRef = useRef(activeBusiness.id);

  useEffect(() => {
    bizRef.current = activeBusiness.id;
  }, [activeBusiness.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const getColor = (strong: boolean): [number, number, number, number] => {
      const isCasino = bizRef.current === "casino";
      if (isCasino) return strong ? [0, 204, 68, 0.15] : [0, 204, 68, 0.08];
      return strong ? [139, 92, 246, 0.12] : [139, 92, 246, 0.04];
    };

    const addRipple = (x: number, y: number, strong: boolean) => {
      const [r, g, b, alpha] = getColor(strong);
      ripplesRef.current.push({
        x, y,
        startTime: performance.now(),
        maxRadius: strong ? 200 : 80,
        duration: strong ? 600 : 800,
        r, g, b,
        maxAlpha: alpha,
      });
      // Keep max 30 ripples to avoid perf issues
      if (ripplesRef.current.length > 30) ripplesRef.current.shift();
    };

    const onMouseMove = (e: MouseEvent) => addRipple(e.clientX, e.clientY, false);
    const onClick     = (e: MouseEvent) => addRipple(e.clientX, e.clientY, true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("click",     onClick,     { passive: true });

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripplesRef.current = ripplesRef.current.filter(rp => {
        const elapsed  = now - rp.startTime;
        const progress = elapsed / rp.duration;
        if (progress >= 1) return false;

        const eased  = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const radius = eased * rp.maxRadius;
        const alpha  = rp.maxAlpha * (1 - progress);

        ctx.beginPath();
        ctx.arc(rp.x, rp.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rp.r},${rp.g},${rp.b},${alpha})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click",     onClick);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
}

import { useEffect, useRef } from "react";
import { useBusiness } from "@/lib/businessContext";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
}

export default function HomeParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeBusiness } = useBusiness();
  const colorRef = useRef(activeBusiness.id);

  useEffect(() => { colorRef.current = activeBusiness.id; }, [activeBusiness.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let mouse = { x: W / 2, y: H / 2 };
    let rafId: number;

    const COUNT = 55;
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.5,
    }));

    const onResize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMove);

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);

      const isCasino = colorRef.current === "casino";
      const rgb = isCasino ? "0,204,68" : "139,92,246";

      for (const p of particles) {
        // Mouse attraction (gentle)
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          p.vx += dx / dist * 0.015;
          p.vy += dy / dist * 0.015;
        }

        // Speed limit
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 1.2) { p.vx *= 1.2 / spd; p.vy *= 1.2 / spd; }

        p.x += p.vx; p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},0.5)`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb},${0.15 * (1 - d / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        borderRadius: "inherit",
      }}
    />
  );
}

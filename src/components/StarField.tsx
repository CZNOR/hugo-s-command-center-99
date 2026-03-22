import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; size: number; opacity: number;
  speed: number; twinkleSpeed: number; twinkleOffset: number;
  driftX: number; driftY: number;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animFrame: number;
    let stars: Star[] = [];
    let time = 0;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const initStars = () => {
      stars = Array.from({ length: 150 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.3, opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.15 + 0.03, twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.08, driftY: (Math.random() - 0.5) * 0.04,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;
      stars.forEach((star) => {
        star.x += star.driftX; star.y += star.driftY;
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const op = star.opacity * (0.5 + 0.5 * twinkle);
        ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + op + ")"; ctx.fill();
        if (star.size > 1.2) {
          ctx.beginPath(); ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(168,85,247," + (op * 0.15) + ")"; ctx.fill();
        }
      });
      animFrame = requestAnimationFrame(draw);
    };
    resize(); initStars(); draw();
    const onResize = () => { resize(); initStars(); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(animFrame); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

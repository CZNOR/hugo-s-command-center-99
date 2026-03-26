import { useEffect, useRef } from "react";
import { useBusiness } from "@/lib/businessContext";

export default function RippleCanvas() {
  const glowRef  = useRef<HTMLDivElement>(null);
  const colorRef = useRef("#a855f7");
  const { activeBusiness } = useBusiness();

  // Update color when business switches
  useEffect(() => {
    colorRef.current = activeBusiness.id === "casino" ? "#00cc44" : "#a855f7";
    if (glowRef.current) {
      glowRef.current.style.background =
        `radial-gradient(circle, ${colorRef.current}20 0%, transparent 65%)`;
    }
  }, [activeBusiness.id]);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let mouseX = -800, mouseY = -800;
    let animX  = -800, animY  = -800;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onClick = (e: MouseEvent) => {
      const color = colorRef.current;

      // Ring 1 — fast, small
      spawnRipple(e.clientX, e.clientY, color, 180, "0.65s");
      // Ring 2 — slower, bigger
      setTimeout(() => spawnRipple(e.clientX, e.clientY, color, 300, "0.9s", 0.5), 60);
    };

    // Smooth lerp follow
    const loop = () => {
      animX += (mouseX - animX) * 0.1;
      animY += (mouseY - animY) * 0.1;
      glow.style.transform = `translate(${animX - 175}px, ${animY - 175}px)`;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes czn-ripple {
          from { width: 0; height: 0; opacity: 1; }
          to   { width: var(--r); height: var(--r); opacity: 0; }
        }
      `}</style>

      {/* Glow that follows cursor */}
      <div
        ref={glowRef}
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: 350, height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.13) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 9999,
          willChange: "transform",
        }}
      />
    </>
  );
}

function spawnRipple(
  x: number, y: number,
  color: string,
  size: number,
  duration: string,
  borderAlpha = 0.9,
) {
  const el = document.createElement("div");
  el.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 0; height: 0;
    border-radius: 50%;
    border: 2px solid ${hexAlpha(color, borderAlpha)};
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
    --r: ${size}px;
    animation: czn-ripple ${duration} ease-out forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), parseFloat(duration) * 1000 + 100);
}

function hexAlpha(hex: string, alpha: number) {
  // hex = "#rrggbb"
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

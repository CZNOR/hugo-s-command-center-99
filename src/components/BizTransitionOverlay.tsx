import { useEffect, useState, useRef } from "react";

interface Props {
  mode: "coaching" | "casino";
  onDone: () => void;
}

/**
 * Full-screen wipe that plays when switching business mode.
 * Phase 1 (0–400ms): colored overlay sweeps in from center
 * Phase 2 (400–700ms): holds
 * Phase 3 (700–1000ms): sweeps out, revealing new mode
 */
export default function BizTransitionOverlay({ mode, onDone }: Props) {
  const color    = mode === "casino" ? "#00cc44" : "#7c3aed";
  const colorDim = mode === "casino" ? "rgba(0,204,68,0.15)" : "rgba(124,58,237,0.15)";
  const label    = mode === "casino" ? "🎰 Casino Mode" : "🎓 Coaching Mode";

  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 350);
    const t2 = setTimeout(() => setPhase("out"),  650);
    const t3 = setTimeout(() => onDone(),         950);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Clip-path radial expand/contract
  const clip = phase === "in"
    ? "circle(0% at 50% 50%)"
    : phase === "hold"
    ? "circle(150% at 50% 50%)"
    : "circle(0% at 50% 50%)";

  const transition = phase === "out"
    ? "clip-path 0.35s cubic-bezier(0.4,0,1,1)"
    : "clip-path 0.35s cubic-bezier(0,0,0.2,1)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        pointerEvents: "none",
        clipPath: clip,
        transition,
        background: `radial-gradient(circle at 50% 50%, ${color}ee 0%, ${color}99 40%, ${color}44 70%, transparent 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Center label — only shows during "hold" */}
      <div
        style={{
          opacity: phase === "hold" ? 1 : 0,
          transform: phase === "hold" ? "scale(1)" : "scale(0.8)",
          transition: "opacity 0.15s ease, transform 0.15s ease",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${color}`,
          borderRadius: 20,
          padding: "16px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          boxShadow: `0 0 40px ${color}66`,
        }}
      >
        <span style={{ fontSize: 28 }}>{mode === "casino" ? "🎰" : "🎓"}</span>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, letterSpacing: "0.05em" }}>
          {label}
        </span>
        <div style={{
          width: 40, height: 2, borderRadius: 2,
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      </div>
    </div>
  );
}

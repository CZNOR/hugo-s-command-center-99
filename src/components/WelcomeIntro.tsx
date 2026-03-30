import { useEffect, useState } from "react";

interface Props { onDone: () => void }

type Phase = "init" | "show" | "converge" | "logo" | "exit";

export default function WelcomeIntro({ onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("init");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"),     60);
    const t2 = setTimeout(() => setPhase("converge"), 900);
    const t3 = setTimeout(() => setPhase("logo"),     1300);
    const t4 = setTimeout(() => setPhase("exit"),     2300);
    const t5 = setTimeout(() => onDone(),              2850);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []);

  const shown     = phase !== "init";
  const converged = phase === "logo" || phase === "exit";
  const logoVis   = phase === "logo" || phase === "exit";
  const exiting   = phase === "exit";

  return (
    <>
      <style>{`
        @keyframes globe-spin   { to { transform: rotateY(360deg); } }
        @keyframes chip-spin    { to { transform: rotateZ(360deg); } }
        @keyframes ring-pulse {
          0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
        }
        @keyframes aurora-drift {
          0%,100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg); }
          50%     { transform: translate(-50%,-50%) scale(1.12) rotate(6deg); }
        }
        @keyframes logo-glow {
          0%,100% { filter: drop-shadow(0 0 20px rgba(168,85,247,0.8)) drop-shadow(0 0 50px rgba(0,255,136,0.4)); }
          50%     { filter: drop-shadow(0 0 40px rgba(168,85,247,1))   drop-shadow(0 0 80px rgba(0,255,136,0.7)); }
        }
        @keyframes bar-in {
          from { width: 0; opacity: 0; }
          to   { width: 110px; opacity: 1; }
        }
        @keyframes scan-down {
          from { top: -2px; }
          to   { top: 100%; }
        }
        @keyframes notch-glow {
          0%,100% { box-shadow: 0 0 6px rgba(0,255,136,0.5); }
          50%     { box-shadow: 0 0 14px rgba(0,255,136,0.9); }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "#03010D",
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: exiting ? 0 : 1,
        transition: exiting ? "opacity 0.55s cubic-bezier(0.4,0,1,1)" : "opacity 0.15s ease",
        pointerEvents: exiting ? "none" : "auto",
        overflow: "hidden",
      }}>

        {/* Aurora */}
        <div style={{
          position: "absolute", width: "150vw", height: "150vw",
          maxWidth: 720, maxHeight: 720, borderRadius: "50%",
          background:
            "radial-gradient(ellipse 55% 55% at 30% 50%, rgba(0,255,136,0.1) 0%, transparent 60%)," +
            "radial-gradient(ellipse 55% 55% at 70% 50%, rgba(168,85,247,0.14) 0%, transparent 60%)",
          top: "50%", left: "50%",
          animation: "aurora-drift 4s ease-in-out infinite",
          pointerEvents: "none",
        }} />

        {/* Pulse rings */}
        {[0, 500, 1000].map((delay, i) => (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 260, height: 260, borderRadius: "50%",
            border: `1px solid ${i % 2 ? "rgba(0,255,136,0.35)" : "rgba(168,85,247,0.45)"}`,
            animation: `ring-pulse 2.6s ease-out ${delay}ms infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Scan line */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 1, pointerEvents: "none",
          background: "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.5) 30%, rgba(0,255,136,0.5) 70%, transparent 100%)",
          animation: "scan-down 2s linear infinite",
          opacity: 0.5,
        }} />

        {/* Corner brackets */}
        {[
          { top: 24, left: 24,   borderTop: "1.5px solid rgba(168,85,247,0.55)", borderLeft:  "1.5px solid rgba(168,85,247,0.55)", borderRadius: "6px 0 0 0" },
          { top: 24, right: 24,  borderTop: "1.5px solid rgba(168,85,247,0.55)", borderRight: "1.5px solid rgba(168,85,247,0.55)", borderRadius: "0 6px 0 0" },
          { bottom: 24, left: 24,  borderBottom: "1.5px solid rgba(0,255,136,0.45)", borderLeft:  "1.5px solid rgba(0,255,136,0.45)", borderRadius: "0 0 0 6px" },
          { bottom: 24, right: 24, borderBottom: "1.5px solid rgba(0,255,136,0.45)", borderRight: "1.5px solid rgba(0,255,136,0.45)", borderRadius: "0 0 6px 0" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 34, height: 34, pointerEvents: "none", ...s }} />
        ))}

        {/* ── Casino chip (left → center) ── */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: converged
            ? "translate(-50%, -50%) scale(0.45) translateX(-30px)"
            : shown
              ? "translate(calc(-50% - 140px), -50%) scale(1)"
              : "translate(calc(-50% - 200px), -50%) scale(0.5)",
          opacity: converged ? 0 : shown ? 1 : 0,
          transition: converged
            ? "transform 0.5s cubic-bezier(0.4,0,0.6,1), opacity 0.35s ease"
            : "transform 0.55s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s ease",
          zIndex: 2,
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", position: "relative",
            background: "conic-gradient(#00aa33 0deg 22.5deg, #1a6b35 22.5deg 45deg, #00aa33 45deg 67.5deg, #1a6b35 67.5deg 90deg, #00aa33 90deg 112.5deg, #1a6b35 112.5deg 135deg, #00aa33 135deg 157.5deg, #1a6b35 157.5deg 180deg, #00aa33 180deg 202.5deg, #1a6b35 202.5deg 225deg, #00aa33 225deg 247.5deg, #1a6b35 247.5deg 270deg, #00aa33 270deg 292.5deg, #1a6b35 292.5deg 315deg, #00aa33 315deg 337.5deg, #1a6b35 337.5deg 360deg)",
            border: "3px solid rgba(0,255,136,0.85)",
            boxShadow: "0 0 28px rgba(0,255,136,0.55), 0 0 60px rgba(0,255,136,0.2)",
            animation: shown ? "chip-spin 3.5s linear infinite" : "none",
          }}>
            {/* Inner disc */}
            <div style={{
              position: "absolute", inset: 14, borderRadius: "50%",
              background: "radial-gradient(circle, #00cc44 0%, #007722 100%)",
              border: "1.5px solid rgba(0,255,136,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 22, userSelect: "none" }}>🎰</span>
            </div>
            {/* Notches */}
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * 360;
              return (
                <div key={i} style={{
                  position: "absolute",
                  width: 6, height: 14,
                  background: "rgba(0,255,136,0.9)",
                  borderRadius: 3,
                  top: "50%", left: "50%",
                  transformOrigin: "50% 0",
                  transform: `translateX(-50%) rotate(${angle}deg) translateY(-42px)`,
                  animation: "notch-glow 1.8s ease-in-out infinite",
                  animationDelay: `${i * 0.22}s`,
                }} />
              );
            })}
          </div>
        </div>

        {/* ── Globe wireframe (right → center) ── */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: converged
            ? "translate(-50%, -50%) scale(0.45) translateX(30px)"
            : shown
              ? "translate(calc(-50% + 140px), -50%) scale(1)"
              : "translate(calc(-50% + 200px), -50%) scale(0.5)",
          opacity: converged ? 0 : shown ? 1 : 0,
          transition: converged
            ? "transform 0.5s cubic-bezier(0.4,0,0.6,1), opacity 0.35s ease"
            : "transform 0.55s cubic-bezier(0.34,1.4,0.64,1), opacity 0.4s ease",
          zIndex: 2,
        }}>
          <div style={{
            width: 96, height: 96, position: "relative",
            animation: shown ? "globe-spin 5s linear infinite" : "none",
            filter: "drop-shadow(0 0 20px rgba(168,85,247,0.7)) drop-shadow(0 0 40px rgba(168,85,247,0.3))",
          }}>
            <svg width="96" height="96" viewBox="-48 -48 96 96" style={{ overflow: "visible" }}>
              {/* Main sphere */}
              <circle r="44" fill="none" stroke="rgba(168,85,247,0.75)" strokeWidth="1.5" />
              {/* Equator */}
              <ellipse rx="44" ry="12" fill="none" stroke="rgba(168,85,247,0.55)" strokeWidth="1" />
              {/* Lat -30 */}
              <ellipse rx="38" ry="9" cy="-22" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="0.8" />
              {/* Lat +30 */}
              <ellipse rx="38" ry="9" cy="22" fill="none" stroke="rgba(168,85,247,0.35)" strokeWidth="0.8" />
              {/* Meridian 1 */}
              <ellipse ry="44" rx="12" fill="none" stroke="rgba(168,85,247,0.45)" strokeWidth="1" />
              {/* Meridian 2 */}
              <ellipse ry="44" rx="12" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="0.8" transform="rotate(60)" />
              {/* Meridian 3 */}
              <ellipse ry="44" rx="12" fill="none" stroke="rgba(168,85,247,0.25)" strokeWidth="0.8" transform="rotate(-60)" />
              {/* Glow dot top */}
              <circle cy="-44" r="3" fill="rgba(168,85,247,0.9)" />
              <circle cy="44"  r="3" fill="rgba(168,85,247,0.9)" />
            </svg>
          </div>
        </div>

        {/* ── Logo (appears on convergence) ── */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          position: "absolute", top: "50%", left: "50%",
          transform: logoVis
            ? "translate(-50%, -50%) scale(1)"
            : "translate(-50%, -50%) scale(0.75)",
          opacity: logoVis ? 1 : 0,
          transition: "opacity 0.45s cubic-bezier(0.34,1.56,0.64,1), transform 0.55s cubic-bezier(0.34,1.56,0.64,1)",
          zIndex: 3,
        }}>
          <img
            src="/czn-logo.png"
            alt="CZN"
            style={{
              height: 100, width: "auto", userSelect: "none", mixBlendMode: "screen",
              animation: logoVis ? "logo-glow 2.4s ease-in-out infinite" : "none",
            }}
          />
          <p style={{
            marginTop: 16,
            color: "rgba(255,255,255,0.5)", fontSize: 11,
            letterSpacing: "0.4em", textTransform: "uppercase",
            fontFamily: "Poppins, sans-serif",
          }}>
            COMMAND CENTER
          </p>
          <div style={{
            height: 2, borderRadius: 2, marginTop: 14,
            background: "linear-gradient(90deg, rgba(0,255,136,0.9), rgba(168,85,247,0.9))",
            boxShadow: "0 0 16px rgba(0,255,136,0.5), 0 0 16px rgba(168,85,247,0.5)",
            animation: logoVis ? "bar-in 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
            width: 0,
          }} />
        </div>

      </div>
    </>
  );
}

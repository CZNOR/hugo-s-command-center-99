import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Props {
  onDone: () => void;
}

// ── Timing ────────────────────────────────────────────────────
// 0ms    → fade in (300ms)
// 900ms  → objects start converging
// 1500ms → logo appears
// 2100ms → fade out starts
// 2600ms → done

export default function WelcomeIntro({ onDone }: Props) {
  const mountRef  = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [logo,    setLogo]    = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true),  30);
    const t1 = setTimeout(() => setLogo(true),     1500);
    const t2 = setTimeout(() => setExiting(true),  2100);
    const t3 = setTimeout(() => onDone(),           2600);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // ── Three.js scene ──────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const SIZE = 520;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const ptGreen = new THREE.PointLight(0x00ff88, 8, 20);
    ptGreen.position.set(-4, 3, 3);
    scene.add(ptGreen);
    const ptViolet = new THREE.PointLight(0xa855f7, 8, 20);
    ptViolet.position.set(4, 3, 3);
    scene.add(ptViolet);
    const ptFront = new THREE.PointLight(0xffffff, 2, 12);
    ptFront.position.set(0, -2, 5);
    scene.add(ptFront);

    // ── Casino chip (left) ─────────────────────────────────
    const chip = new THREE.Group();
    chip.position.set(-2.4, 0, 0);

    chip.add(new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.22, 64),
      new THREE.MeshStandardMaterial({
        color: 0x00aa33, emissive: 0x00cc44, emissiveIntensity: 0.4,
        metalness: 0.8, roughness: 0.2,
      }),
    ));

    const rimGeo = new THREE.TorusGeometry(1.0, 0.06, 10, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0x00ff88, emissiveIntensity: 0.7,
      metalness: 1, roughness: 0.1,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    chip.add(rim);

    for (let i = 0; i < 8; i++) {
      const notch = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.26, 0.14),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0x88ffaa, emissiveIntensity: 0.5, metalness: 0.9,
        }),
      );
      const angle = (i / 8) * Math.PI * 2;
      notch.position.set(Math.cos(angle) * 1.0, 0, Math.sin(angle) * 1.0);
      notch.rotation.y = -angle;
      chip.add(notch);
    }
    chip.rotation.x = 0.3;
    scene.add(chip);

    // ── Coaching globe (right) ─────────────────────────────
    const globeGeo = new THREE.SphereGeometry(1.0, 22, 16);
    const globeMat = new THREE.LineBasicMaterial({
      color: 0xa855f7, transparent: true, opacity: 0.9,
    });
    const globe = new THREE.LineSegments(
      new THREE.WireframeGeometry(globeGeo),
      globeMat,
    );
    globe.position.set(2.4, 0, 0);
    scene.add(globe);

    // ── Animation loop ─────────────────────────────────────
    const t0 = performance.now();
    let rafId: number;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;

      // Converge: starts at 0.9s over 0.65s
      const CONVERGE_START = 0.9;
      const CONVERGE_DUR   = 0.65;
      let chipX  = -2.4;
      let globeX =  2.4;

      if (t > CONVERGE_START) {
        const p = Math.min((t - CONVERGE_START) / CONVERGE_DUR, 1);
        // ease-out cubic
        const e = 1 - Math.pow(1 - p, 3);
        chipX  = -2.4 + 2.4 * e;
        globeX =  2.4 - 2.4 * e;
      }

      chip.position.x  = chipX;
      globe.position.x = globeX;

      // Rotate
      chip.rotation.y  = t * 9;
      chip.rotation.z  = Math.sin(t * 3.5) * 0.18;
      const cs = 0.85 + 0.15 * Math.sin(t * 4);
      chip.scale.setScalar(cs);

      globe.rotation.y = t * 1.8;
      globe.rotation.x = Math.sin(t * 1.3) * 0.4;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  const show = visible && !exiting;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "#02010A",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 0,
        opacity: exiting ? 0 : visible ? 1 : 0,
        transition: exiting
          ? "opacity 0.5s cubic-bezier(0.4,0,1,1)"
          : "opacity 0.3s cubic-bezier(0,0,0.2,1)",
        overflow: "hidden",
        pointerEvents: exiting ? "none" : "auto",
      }}
    >
      {/* Dual radial glow — green left, violet right */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse 45% 65% at 25% 50%, rgba(0,255,136,0.1) 0%, transparent 70%)," +
          "radial-gradient(ellipse 45% 65% at 75% 50%, rgba(168,85,247,0.1) 0%, transparent 70%)",
      }} />

      {/* Scan lines */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.12,
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 4px)",
      }} />

      {/* Corner accents — green bottom, violet top */}
      {[
        { top: 24,    left:  24,   bt: "2px solid rgba(168,85,247,0.5)", bl: "2px solid rgba(168,85,247,0.5)", bb: "none", br: "none", r: "8px 0 0 0" },
        { top: 24,    right: 24,   bt: "2px solid rgba(168,85,247,0.5)", br: "2px solid rgba(168,85,247,0.5)", bb: "none", bl: "none", r: "0 8px 0 0" },
        { bottom: 24, left:  24,   bb: "2px solid rgba(0,255,136,0.5)",  bl: "2px solid rgba(0,255,136,0.5)",  bt: "none", br: "none", r: "0 0 0 8px" },
        { bottom: 24, right: 24,   bb: "2px solid rgba(0,255,136,0.5)",  br: "2px solid rgba(0,255,136,0.5)",  bt: "none", bl: "none", r: "0 0 8px 0" },
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          top: (c as any).top, left: (c as any).left, right: (c as any).right, bottom: (c as any).bottom,
          width: 44, height: 44, pointerEvents: "none",
          borderTop: c.bt, borderBottom: c.bb, borderLeft: c.bl, borderRight: c.br,
          borderRadius: c.r,
        }} />
      ))}

      {/* Center divider line (fades out when converged) */}
      <div style={{
        position: "absolute",
        left: "50%", top: "20%", bottom: "20%",
        width: 1,
        background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.06) 70%, transparent)",
        transform: "translateX(-50%)",
        opacity: logo ? 0 : 0.6,
        transition: "opacity 0.4s ease",
      }} />

      {/* 3D canvas */}
      <div
        ref={mountRef}
        style={{
          width: 520, height: 520,
          filter:
            "drop-shadow(0 0 40px rgba(0,255,136,0.25)) " +
            "drop-shadow(0 0 40px rgba(168,85,247,0.25))",
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.75)",
          transition: "opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      {/* C2N logo — appears after convergence */}
      <div style={{
        textAlign: "center",
        marginTop: -64,
        opacity: logo && !exiting ? 1 : 0,
        transform: logo && !exiting ? "translateY(0) scale(1)" : "translateY(24px) scale(0.9)",
        transition: "opacity 0.4s ease 0.05s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.05s",
      }}>
        <p style={{
          fontSize: 68, fontWeight: 900,
          letterSpacing: "0.04em",
          color: "#fff",
          textShadow:
            "0 0 30px rgba(0,255,136,0.5), " +
            "0 0 60px rgba(168,85,247,0.4), " +
            "0 0 100px rgba(255,255,255,0.1)",
          fontFamily: "Poppins, sans-serif",
          lineHeight: 1,
        }}>
          C2N
        </p>
        <p style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 12,
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          marginTop: 10,
          fontFamily: "Poppins, sans-serif",
        }}>
          COMMAND CENTER
        </p>
        <div style={{
          height: 3, borderRadius: 2,
          background: "linear-gradient(90deg, #00ff88, rgba(168,85,247,0.8))",
          margin: "16px auto 0",
          width: 100,
          boxShadow: "0 0 20px rgba(0,255,136,0.4), 0 0 20px rgba(168,85,247,0.4)",
        }} />
      </div>
    </div>
  );
}

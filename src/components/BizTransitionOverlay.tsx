import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Props {
  mode: "coaching" | "casino";
  onDone: () => void;
}

// ── Timing ────────────────────────────────────────────────────
// 0ms   → fade in (300ms)
// 300ms → show 3D object spinning (800ms)
// 1100ms→ fade out (400ms)
// 1500ms→ done

export default function BizTransitionOverlay({ mode, onDone }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const isCasino = mode === "casino";
  const bg      = isCasino ? "#000d04" : "#060010";
  const accent  = isCasino ? "#00cc44" : "#7c3aed";
  const accentB = isCasino ? "#00ff88" : "#a855f7";
  const modeLabel = isCasino ? "CASINO" : "COACHING";
  const subLabel  = isCasino ? "Mode Affiliation" : "Mode High-Ticket";

  // Phase lifecycle
  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true),   30);
    const t1 = setTimeout(() => setExiting(true),   1100);
    const t2 = setTimeout(() => onDone(),            1500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Three.js 3D object
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const SIZE = 320;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 4.5);

    const color = isCasino ? 0x00cc44 : 0x7c3aed;
    const colorB = isCasino ? 0x00ff88 : 0xa855f7;

    // Ambient + point lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pt1 = new THREE.PointLight(colorB, 6, 20);
    pt1.position.set(3, 4, 3);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0xffffff, 2, 10);
    pt2.position.set(-3, -2, 4);
    scene.add(pt2);

    let obj: THREE.Object3D;

    if (isCasino) {
      // ── Casino chip ────────────────────────────────────────
      const g = new THREE.Group();

      // Main body
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(1.3, 1.3, 0.28, 64),
        new THREE.MeshStandardMaterial({
          color: 0x00aa33,
          emissive: 0x00cc44,
          emissiveIntensity: 0.35,
          metalness: 0.75,
          roughness: 0.25,
        }),
      );
      g.add(body);

      // Outer rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.07, 10, 64),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x00ff88, emissiveIntensity: 0.6, metalness: 1, roughness: 0.1 }),
      );
      rim.rotation.x = Math.PI / 2;
      g.add(rim);

      // Inner ring
      const inner = rim.clone();
      (inner as THREE.Mesh).geometry = new THREE.TorusGeometry(0.9, 0.045, 10, 64);
      g.add(inner);

      // Notches around edge (8 stripes)
      for (let i = 0; i < 8; i++) {
        const notch = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.32, 0.18),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x88ffaa, emissiveIntensity: 0.4, metalness: 0.9 }),
        );
        const angle = (i / 8) * Math.PI * 2;
        notch.position.set(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3);
        notch.rotation.y = -angle;
        g.add(notch);
      }

      // Tilt the chip so it looks like a coin
      g.rotation.x = 0.3;
      obj = g;

    } else {
      // ── Coaching: wireframe sphere ─────────────────────────
      const geo       = new THREE.SphereGeometry(1.3, 22, 16);
      const wireframe = new THREE.WireframeGeometry(geo);
      const mat       = new THREE.LineBasicMaterial({ color: colorB, transparent: true, opacity: 0.85 });
      obj             = new THREE.LineSegments(wireframe, mat);
    }

    scene.add(obj);

    // Dramatic flip animation
    const t0 = performance.now();
    let rafId: number;

    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const t = (performance.now() - t0) / 1000;

      if (isCasino) {
        // Fast Y-axis spin + slight wobble — looks like a coin flip
        obj.rotation.y = t * 8;
        obj.rotation.z = Math.sin(t * 3) * 0.15;
        const s = 0.85 + 0.15 * Math.sin(t * 4);
        obj.scale.setScalar(s);
      } else {
        obj.rotation.y = t * 1.6;
        obj.rotation.x = Math.sin(t * 1.2) * 0.4;
      }

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        opacity: exiting ? 0 : visible ? 1 : 0,
        transition: exiting
          ? "opacity 0.4s cubic-bezier(0.4,0,1,1)"
          : "opacity 0.3s cubic-bezier(0,0,0.2,1)",
        overflow: "hidden",
      }}
    >
      {/* ── Radial glow backdrop ─────────────────────────── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${accent}18 0%, transparent 70%)`,
      }} />

      {/* ── Scan-line texture for depth ──────────────────── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.18,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.4) 3px, rgba(0,0,0,0.4) 4px)",
      }} />

      {/* ── Corner accents ───────────────────────────────── */}
      {[
        { top: 24, left: 24 }, { top: 24, right: 24 },
        { bottom: 24, left: 24 }, { bottom: 24, right: 24 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos,
          width: 40, height: 40, pointerEvents: "none",
          borderTop: i < 2 ? `2px solid ${accent}66` : "none",
          borderBottom: i >= 2 ? `2px solid ${accent}66` : "none",
          borderLeft: i % 2 === 0 ? `2px solid ${accent}66` : "none",
          borderRight: i % 2 === 1 ? `2px solid ${accent}66` : "none",
          borderRadius: i === 0 ? "8px 0 0 0" : i === 1 ? "0 8px 0 0" : i === 2 ? "0 0 0 8px" : "0 0 8px 0",
        }} />
      ))}

      {/* ── 3D object ────────────────────────────────────── */}
      <div
        ref={mountRef}
        style={{
          width: 320, height: 320,
          filter: `drop-shadow(0 0 50px ${accent}aa) drop-shadow(0 0 100px ${accent}44)`,
          opacity: visible && !exiting ? 1 : 0,
          transform: visible && !exiting ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
          transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />

      {/* ── Mode label ───────────────────────────────────── */}
      <div style={{
        textAlign: "center", marginTop: -16,
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
      }}>
        <p style={{
          fontSize: 52, fontWeight: 800,
          letterSpacing: "0.06em",
          color: "#fff",
          textShadow: `0 0 24px ${accentB}, 0 0 60px ${accent}88`,
          fontFamily: "Poppins, sans-serif",
          lineHeight: 1.1,
        }}>
          {modeLabel}
        </p>
        <p style={{
          color: `${accentB}cc`,
          fontSize: 15,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginTop: 6,
          fontFamily: "Poppins, sans-serif",
        }}>
          {subLabel}
        </p>
        <div style={{
          width: 60, height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, transparent, ${accentB}, transparent)`,
          margin: "14px auto 0",
          boxShadow: `0 0 20px ${accentB}`,
        }} />
      </div>
    </div>
  );
}

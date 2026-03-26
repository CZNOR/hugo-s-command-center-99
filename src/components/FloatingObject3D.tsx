import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  mode: "coaching" | "casino";
}

export default function FloatingObject3D({ mode }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = 140, H = 140;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Scene + camera
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3.5);

    // Color
    const color = mode === "casino" ? 0x00cc44 : 0x7c3aed;

    let mesh: THREE.Mesh | THREE.LineSegments;

    if (mode === "coaching") {
      // Wireframe globe
      const geo = new THREE.SphereGeometry(1, 16, 12);
      const wireframe = new THREE.WireframeGeometry(geo);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
      mesh = new THREE.LineSegments(wireframe, mat);

      // Add a point light for glow feel
      const light = new THREE.PointLight(color, 2, 10);
      light.position.set(2, 2, 2);
      scene.add(light);
    } else {
      // Casino chip — flat cylinder with ridged edge
      const geo = new THREE.CylinderGeometry(1, 1, 0.28, 32);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.6,
        roughness: 0.3,
      });
      mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 6; // tilt to show it's a chip

      // Edge ring
      const ringGeo = new THREE.TorusGeometry(1, 0.06, 8, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.6 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);

      // Lights
      const amb = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(amb);
      const pt = new THREE.PointLight(color, 3, 10);
      pt.position.set(2, 3, 2);
      scene.add(pt);
    }

    scene.add(mesh);

    // Float animation
    let startTime = performance.now();
    let hovered = false;
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) / 1000;

      // Float up/down
      mesh.position.y = Math.sin(t * (2 * Math.PI / 3)) * 0.15;

      // Rotate
      const speed = hovered ? 3 : 1;
      mesh.rotation.y += 0.008 * speed;

      renderer.render(scene, camera);
    };
    animate();

    // Hover speed-up
    const onEnter = () => { hovered = true; setTimeout(() => { hovered = false; }, 1000); };
    mount.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(rafId);
      mount.removeEventListener("mouseenter", onEnter);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [mode]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 72,
        right: 16,
        width: 140,
        height: 140,
        zIndex: 50,
        pointerEvents: "auto",
        cursor: "pointer",
        filter: mode === "casino"
          ? "drop-shadow(0 0 18px rgba(0,204,68,0.5))"
          : "drop-shadow(0 0 18px rgba(124,58,237,0.5))",
      }}
    />
  );
}

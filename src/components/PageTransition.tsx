import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState<"enter" | "exit" | "idle">("idle");
  const prevPath = useRef(location.pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    // Start exit
    setPhase("exit");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Swap content + start enter → idle
      setDisplayChildren(children);
      setPhase("idle");
    }, 150);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname, children]);

  // Keep children in sync when not transitioning
  useEffect(() => {
    if (phase === "idle") setDisplayChildren(children);
  }, [children, phase]);

  return (
    <div
      style={{
        opacity:    phase === "exit" ? 0 : 1,
        transform:  phase === "exit" ? "translateY(6px)" : "translateY(0)",
        transition: phase === "exit"
          ? "opacity 0.15s ease, transform 0.15s ease"
          : "opacity 0.28s ease, transform 0.28s cubic-bezier(0.34,1.2,0.64,1)",
        willChange: "opacity, transform",
        minHeight:  "60vh",
      }}
    >
      {displayChildren}
    </div>
  );
}

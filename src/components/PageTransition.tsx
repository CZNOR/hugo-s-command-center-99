import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setKey(location.pathname);
      setVisible(true);
    }, 200);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      key={key}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      {children}
    </div>
  );
}

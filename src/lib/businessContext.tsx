import { createContext, useContext, useState, ReactNode } from "react";

export type BusinessId = "coaching" | "casino" | "ecom";

export interface Business {
  id: BusinessId;
  label: string;
  emoji: string;
  disabled?: boolean;
  accent: string;
  accentRgb: string;
  glow: string;
  gradient: string;
}

export const BUSINESSES: Business[] = [
  {
    id: "coaching",
    label: "Coaching Ecom",
    emoji: "🎓",
    accent: "#A855F7",
    accentRgb: "168,85,247",
    glow: "rgba(168,85,247,0.4)",
    gradient: "linear-gradient(135deg, #7C3AED, #6366F1)",
  },
  {
    id: "casino",
    label: "Casino Affiliation",
    emoji: "🎰",
    accent: "#F59E0B",
    accentRgb: "245,158,11",
    glow: "rgba(245,158,11,0.4)",
    gradient: "linear-gradient(135deg, #D97706, #10B981)",
  },
  {
    id: "ecom",
    label: "Ecom",
    emoji: "🛒",
    disabled: true,
    accent: "#06B6D4",
    accentRgb: "6,182,212",
    glow: "rgba(6,182,212,0.4)",
    gradient: "linear-gradient(135deg, #0891B2, #6366F1)",
  },
];

interface BusinessContextValue {
  activeBusiness: Business;
  setActiveBusiness: (id: BusinessId) => void;
}

const BusinessContext = createContext<BusinessContextValue>({
  activeBusiness: BUSINESSES[0],
  setActiveBusiness: () => {},
});

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<BusinessId>("coaching");
  const activeBusiness = BUSINESSES.find((b) => b.id === activeId)!;

  return (
    <BusinessContext.Provider value={{ activeBusiness, setActiveBusiness: setActiveId }}>
      <div
        style={{
          "--business-accent": activeBusiness.accent,
          "--business-accent-rgb": activeBusiness.accentRgb,
          "--business-glow": activeBusiness.glow,
          "--business-gradient": activeBusiness.gradient,
        } as React.CSSProperties}
        className="contents"
      >
        {children}
      </div>
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}

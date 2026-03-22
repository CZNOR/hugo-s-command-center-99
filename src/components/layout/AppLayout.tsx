import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Plus, Flame, Star, Zap } from "lucide-react";
import AppSidebar from "./AppSidebar";
import StarField from "../StarField";
import { gamificationProfile } from "@/lib/mock-data";
import {
  BusinessProvider,
  BUSINESSES,
  useBusiness,
  type BusinessId,
} from "@/lib/businessContext";

const pageTitles: Record<string, string> = {
  "/": "Command Center",
  "/agents": "Agents IA",
  "/business": "Business",
  "/content": "Contenu",
  "/ventes": "Ventes Coaching",
  "/finances": "Finances",
  "/tasks": "Tâches",
  "/agenda": "Agenda",
  "/team": "Équipe",
  "/goals": "Objectifs",
  "/gamification": "Progression",
};

function AppLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "HUGOOS";
  const g = gamificationProfile;
  const { activeBusiness, setActiveBusiness } = useBusiness();

  return (
    <div className="min-h-screen flex w-full" style={{ background: "#07040F" }}>
      {/* Animated star background */}
      <StarField />

      {/* Violet ambient glow overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(124,58,237,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 100%, rgba(168,85,247,0.06) 0%, transparent 70%)",
        }}
      />

      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col relative" style={{ zIndex: 1 }}>
        {/* Header — Dark Liquid Glass */}
        <header
          className="h-14 flex items-center justify-between px-4 lg:px-6 sticky top-0"
          style={{
            background: "rgba(7,4,15,0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            zIndex: 50,
          }}
        >
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-white/90">{title}</h1>
          </div>

          {/* Center: Business switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {BUSINESSES.map((biz) => {
              const isActive = activeBusiness.id === biz.id;
              return (
                <button
                  key={biz.id}
                  disabled={biz.disabled}
                  onClick={() =>
                    !biz.disabled && setActiveBusiness(biz.id as BusinessId)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300"
                  style={
                    isActive
                      ? {
                          background: activeBusiness.gradient,
                          color: "#fff",
                          boxShadow: `0 0 16px ${activeBusiness.glow}`,
                        }
                      : biz.disabled
                      ? { color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                      : { color: "rgba(255,255,255,0.55)", cursor: "pointer" }
                  }
                >
                  <span>{biz.emoji}</span>
                  <span className="hidden md:inline">
                    {biz.disabled ? `${biz.label} (bientôt)` : biz.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: XP + streak + quick add */}
          <div className="flex items-center gap-2">
            {/* XP */}
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Star className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-mono text-sm font-bold text-yellow-400">
                {g.xp_today}
              </span>
              <span className="text-white/40 text-xs">pts</span>
            </div>
            {/* Streak */}
            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-mono text-sm font-bold text-orange-400">
                {g.current_streak}
              </span>
            </div>
            {/* Quick add */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: activeBusiness.gradient,
                boxShadow: `0 4px 12px ${activeBusiness.glow}`,
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tâche</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <BusinessProvider>
      <AppLayoutInner />
    </BusinessProvider>
  );
}

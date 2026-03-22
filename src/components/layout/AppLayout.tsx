import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Plus, Flame, Star } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { gamificationProfile } from "@/lib/mock-data";

const pageTitles: Record<string, string> = {
  "/": "Command Center",
  "/agents": "Agents IA",
  "/business": "Business",
  "/content": "Contenu",
  "/tasks": "Tâches",
  "/agenda": "Agenda",
  "/team": "Équipe",
  "/goals": "Objectifs",
  "/gamification": "Progression",
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "HUGOOS";
  const g = gamificationProfile;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — Liquid Glass */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-border/50 flex-shrink-0 sticky top-0 z-30"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-xl hover:bg-black/[0.04] text-muted-foreground transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Score */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hugoos-orange/[0.08]">
              <Star className="w-3.5 h-3.5 text-hugoos-orange" />
              <span className="font-mono-data text-sm font-bold text-hugoos-orange">{g.score_today.toLocaleString()}</span>
              <span className="text-hugoos-orange/60 text-xs">pts</span>
            </div>

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-hugoos-orange/[0.08]">
              <Flame className="w-3.5 h-3.5 text-hugoos-orange" />
              <span className="font-mono-data text-sm font-bold text-hugoos-orange">{g.current_streak}</span>
            </div>

            {/* Quick add */}
            <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-[0.97] shadow-sm">
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

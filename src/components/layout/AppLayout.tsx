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
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 border-b border-white/[0.06] flex-shrink-0" style={{ background: "hsl(235 28% 7% / 0.8)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Score */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "hsl(43 96% 56% / 0.1)" }}>
              <Star className="w-3.5 h-3.5 text-hugoos-orange" />
              <span className="font-mono-data text-sm font-bold text-hugoos-orange">{g.score_today.toLocaleString()}</span>
              <span className="text-hugoos-orange/60 text-xs">pts</span>
            </div>

            {/* Streak */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(43 96% 56% / 0.1)" }}>
              <Flame className="w-3.5 h-3.5 text-hugoos-orange" />
              <span className="font-mono-data text-sm font-bold text-hugoos-orange">{g.current_streak}</span>
            </div>

            {/* Quick add */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors active:scale-[0.97]">
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

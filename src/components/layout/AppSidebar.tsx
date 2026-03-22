import { useLocation, Link } from "react-router-dom";
import { Zap, Bot, Briefcase, Smartphone, CheckSquare, Calendar, Users, Target, Trophy, Flame } from "lucide-react";
import { gamificationProfile } from "@/lib/mock-data";

const navItems = [
  { path: "/", label: "Command Center", icon: Zap },
  { path: "/agents", label: "Agents IA", icon: Bot },
  { path: "/business", label: "Business", icon: Briefcase },
  { path: "/content", label: "Contenu", icon: Smartphone },
  { path: "/tasks", label: "Tâches", icon: CheckSquare },
  { path: "/agenda", label: "Agenda", icon: Calendar },
  { path: "/team", label: "Équipe", icon: Users },
  { path: "/goals", label: "Objectifs", icon: Target },
  { path: "/gamification", label: "Progression", icon: Trophy },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const g = gamificationProfile;
  const xpPercent = (g.total_xp / g.xp_for_next_level) * 100;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col border-r border-border/50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">HUGOOS</span>
          <span className="chip-indigo text-[10px] ml-auto">v1.0</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/[0.03]"
                }`}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: XP + Streak */}
        <div className="px-4 py-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="chip-purple text-[10px] font-bold">Lv.{g.level}</span>
              <span className="text-muted-foreground">{g.level_title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-hugoos-orange" />
              <span className="font-mono-data text-hugoos-orange font-semibold text-xs">{g.current_streak}j</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-black/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${xpPercent}%`,
                background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 62%))",
              }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-mono-data">
            {g.total_xp.toLocaleString()} / {g.xp_for_next_level.toLocaleString()} XP
          </p>
        </div>
      </aside>
    </>
  );
}

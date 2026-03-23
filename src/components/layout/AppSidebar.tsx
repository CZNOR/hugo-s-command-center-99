import { useLocation, Link } from "react-router-dom";
import { Zap, Bot, Briefcase, Smartphone, CheckSquare, Calendar, Users, Target, Trophy, Flame, TrendingUp, DollarSign, LayoutDashboard, Instagram, Link2, Phone, PhoneCall, CreditCard, UserCheck, ChevronDown, ChevronRight } from "lucide-react";
import { gamificationProfile } from "@/lib/mock-data";
import { useState } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label?: string;
  items: NavItem[];
  collapsible?: boolean;
}

const navSections: NavSection[] = [
  {
    items: [
      { path: "/", label: "Command Center", icon: Zap },
      { path: "/agents", label: "Agents IA", icon: Bot },
      { path: "/business", label: "Business", icon: Briefcase },
      { path: "/content", label: "Contenu", icon: Smartphone },
      { path: "/ventes", label: "Ventes", icon: TrendingUp },
      { path: "/finances", label: "Finances", icon: DollarSign },
      { path: "/tasks", label: "Tâches", icon: CheckSquare },
      { path: "/agenda", label: "Agenda", icon: Calendar },
      { path: "/team", label: "Équipe", icon: Users },
      { path: "/goals", label: "Objectifs", icon: Target },
      { path: "/gamification", label: "Progression", icon: Trophy },
    ],
  },
  {
    label: "Coaching",
    collapsible: true,
    items: [
      { path: "/coaching", label: "Dashboard", icon: LayoutDashboard },
      { path: "/coaching/social", label: "Réseaux sociaux", icon: Instagram },
      { path: "/coaching/beacons", label: "Beacons", icon: Link2 },
      { path: "/coaching/leads", label: "Leads", icon: Phone },
      { path: "/coaching/appels", label: "Appels", icon: PhoneCall },
      { path: "/coaching/paiements", label: "Paiements", icon: CreditCard },
      { path: "/coaching/equipe", label: "Équipe", icon: UserCheck },
    ],
  },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const location = useLocation();
  const g = gamificationProfile;
  const xpPercent = (g.total_xp / g.xp_for_next_level) * 100;
  const [coachingOpen, setCoachingOpen] = useState(
    location.pathname.startsWith("/coaching")
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col border-r border-border/50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "rgba(10,5,25,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid rgba(139,92,246,0.15)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 16px rgba(139,92,246,0.5)" }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">HUGOOS</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold ml-auto" style={{ background: "rgba(139,92,246,0.2)", color: "#a855f7", border: "1px solid rgba(139,92,246,0.3)" }}>v1.0</span>
        </div>

        {/* Reflet violet */}
        <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto relative z-10 pb-4">
          {/* Main nav items */}
          {navSections[0].items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={active ? {
                  background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.15))",
                  color: "#c4b5fd",
                  boxShadow: "0 0 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                  border: "1px solid rgba(139,92,246,0.3)",
                } : {
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid transparent",
                }}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />}
              </Link>
            );
          })}

          {/* Coaching section */}
          <div className="pt-2">
            <button
              onClick={() => setCoachingOpen(!coachingOpen)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest flex-1">Coaching</span>
              {coachingOpen
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
            </button>

            {coachingOpen && (
              <div className="mt-0.5 space-y-0.5">
                {navSections[1].items.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ml-1"
                      style={active ? {
                        background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(168,85,247,0.15))",
                        color: "#c4b5fd",
                        boxShadow: "0 0 12px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                        border: "1px solid rgba(139,92,246,0.3)",
                      } : {
                        color: "rgba(255,255,255,0.4)",
                        border: "1px solid transparent",
                      }}
                    >
                      <item.icon className="w-[16px] h-[16px] flex-shrink-0" />
                      <span className="text-sm">{item.label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom: XP + Streak */}
        <div className="px-4 py-4 border-t space-y-3" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.2)", color: "#a855f7" }}>Lv.{g.level}</span>
              <span className="text-white/40">{g.level_title}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-mono text-orange-400 font-semibold text-xs">{g.current_streak}j</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpPercent}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)" }} />
          </div>
          <p className="text-[11px] text-white/25 font-mono">
            {g.total_xp.toLocaleString()} / {g.xp_for_next_level.toLocaleString()} XP
          </p>
        </div>
      </aside>
    </>
  );
}

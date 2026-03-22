import { useNavigate } from "react-router-dom";
import {
  Zap, Target, Calendar, Users, LayoutGrid,
  CheckSquare, Bot, BookOpen, Plus, ArrowRight
} from "lucide-react";
import { useBusiness, BUSINESSES } from "@/lib/businessContext";
import { gamificationProfile } from "@/lib/mock-data";

const NAV_SHORTCUTS = [
  { icon: <Calendar className="w-5 h-5" />, label: "Planning", path: "/agenda", desc: "Calendrier semaine" },
  { icon: <Target className="w-5 h-5" />, label: "Objectifs", path: "/goals", desc: "KPIs & targets" },
  { icon: <CheckSquare className="w-5 h-5" />, label: "Tâches", path: "/tasks", desc: "Todo & backlog" },
  { icon: <LayoutGrid className="w-5 h-5" />, label: "Business", path: "/business", desc: "Dashboard & deals" },
  { icon: <Bot className="w-5 h-5" />, label: "Agents IA", path: "/agents", desc: "Automatisations" },
  { icon: <Users className="w-5 h-5" />, label: "Équipe", path: "/team", desc: "Membres & rôles" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Contenu", path: "/content", desc: "Pipeline créatif" },
  { icon: <Zap className="w-5 h-5" />, label: "Progression", path: "/gamification", desc: "XP & badges" },
];

function GreetingBanner({ name, accent, gradient, glow }: { name: string; accent: string; gradient: string; glow: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const g = gamificationProfile;

  return (
    <div
      className="rounded-2xl p-5 flex items-center justify-between overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
        border: `1px solid ${accent}25`,
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -right-10 -top-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: glow, filter: "blur(40px)", opacity: 0.3 }}
      />
      <div className="relative">
        <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{greeting}</p>
        <h2 className="text-2xl font-bold text-white/90 mt-0.5">{name} 👋</h2>
        <p className="text-sm text-white/40 mt-1">Prêt à tout déchirer aujourd'hui ?</p>
      </div>
      <div className="relative flex flex-col items-end gap-2">
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: gradient, boxShadow: `0 4px 12px ${glow}` }}
        >
          Niv. {g.level} · {g.level_title}
        </div>
        {g.current_streak > 0 && (
          <p className="text-xs text-white/30">🔥 {g.current_streak} jour{g.current_streak > 1 ? "s" : ""} de streak</p>
        )}
      </div>
    </div>
  );
}

function QuickActionGrid({ accent, gradient, glow }: { accent: string; gradient: string; glow: string }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {NAV_SHORTCUTS.map(item => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className="flex flex-col items-start gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] group"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
            style={{ background: `${accent}18`, color: accent }}
          >
            {item.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">{item.label}</p>
            <p className="text-[11px] text-white/35 mt-0.5">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function BusinessOverview({ accent, gradient, glow }: { accent: string; gradient: string; glow: string }) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/70">Mes business</h3>
        <button
          onClick={() => navigate('/business')}
          className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BUSINESSES.map(b => (
          <div
            key={b.id}
            className={`rounded-2xl p-4 flex items-center gap-3 transition-all ${b.disabled ? "opacity-40" : "hover:scale-[1.01] cursor-pointer"}`}
            style={{
              background: `${b.accent}10`,
              border: `1px solid ${b.accent}20`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: b.gradient, boxShadow: b.disabled ? "none" : `0 4px 12px ${b.glow}` }}
            >
              {b.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: b.disabled ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.85)" }}>
                {b.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: b.accent, opacity: b.disabled ? 0.4 : 0.7 }}>
                {b.disabled ? "Bientôt disponible" : "Actif"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const { activeBusiness } = useBusiness();

  return (
    <div className="space-y-6 max-w-5xl">
      <GreetingBanner
        name="Hugo"
        accent={activeBusiness.accent}
        gradient={activeBusiness.gradient}
        glow={activeBusiness.glow}
      />

      <div>
        <h3 className="text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">Navigation rapide</h3>
        <QuickActionGrid
          accent={activeBusiness.accent}
          gradient={activeBusiness.gradient}
          glow={activeBusiness.glow}
        />
      </div>

      <BusinessOverview
        accent={activeBusiness.accent}
        gradient={activeBusiness.gradient}
        glow={activeBusiness.glow}
      />
    </div>
  );
}

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Plus, Flame, Zap } from "lucide-react";
import AppSidebar from "./AppSidebar";
import StarField from "../StarField";
import { gamificationProfile } from "@/lib/mock-data";
import { BusinessProvider, useBusiness } from "@/lib/businessContext";

// KPIs synthèse affichés dans le header
const HEADER_CASINO   = { ca: "8 960 €",  depots: 31,   color: "#00ff88", glow: "rgba(0,255,136,0.25)" };
const HEADER_COACHING = { ca: "16 000 €", closing: "38%", color: "#a855f7", glow: "rgba(168,85,247,0.25)" };

// ─── Liquid Glass Business Chip ───────────────────────────────
function BizChip({
  emoji, label, kpi1Label, kpi1, kpi2Label, kpi2, color, glow,
}: {
  emoji: string; label: string;
  kpi1Label: string; kpi1: string;
  kpi2Label: string; kpi2: string;
  color: string; glow: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}0f 0%, rgba(0,0,0,0.4) 100%)`,
        border: `1px solid ${color}30`,
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
        boxShadow: `0 0 24px ${color}18, inset 0 1px 0 ${color}18`,
      }}
    >
      {/* Glow blob */}
      <div
        className="absolute -top-3 -left-3 w-12 h-12 rounded-full pointer-events-none"
        style={{ background: color, filter: "blur(16px)", opacity: 0.15 }}
      />
      {/* Emoji */}
      <span className="text-base relative z-10">{emoji}</span>
      {/* Data */}
      <div className="relative z-10 hidden md:block">
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${color}99` }}>{label}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <span style={{ color, fontWeight: 700 }}>{kpi1}</span>
            <span className="ml-1" style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{kpi1Label}</span>
          </span>
          <div className="w-px h-3" style={{ background: `${color}30` }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            <span style={{ color, fontWeight: 700 }}>{kpi2}</span>
            <span className="ml-1" style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{kpi2Label}</span>
          </span>
        </div>
      </div>
      {/* Mobile: just emoji */}
      <span className="md:hidden text-xs font-bold" style={{ color, position: "relative", zIndex: 10 }}>{kpi1}</span>
    </div>
  );
}

function AppLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const g = gamificationProfile;
  const { activeBusiness } = useBusiness();

  return (
    <div className="min-h-screen flex w-full" style={{ background: "#07040F" }}>
      <StarField />

      {/* Dual ambient glow — vert gauche, violet droite */}
      <div
        style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background:
            "radial-gradient(ellipse 50% 35% at 0% 0%, rgba(0,255,136,0.05) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 35% at 100% 0%, rgba(168,85,247,0.07) 0%, transparent 60%)," +
            "radial-gradient(ellipse 40% 30% at 80% 100%, rgba(124,58,237,0.05) 0%, transparent 70%)",
        }}
      />

      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col relative" style={{ zIndex: 1 }}>

        {/* ── HEADER FUSION LIQUID GLASS ─────────────────────── */}
        <header
          className="sticky top-0 flex items-center gap-3 px-4 lg:px-5"
          style={{
            height: 60,
            background: "rgba(7,4,15,0.75)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            zIndex: 50,
            /* Dual color border at bottom */
            boxShadow:
              "inset 0 -1px 0 0 rgba(0,255,136,0.12), inset 0 -1px 0 0 rgba(168,85,247,0.12)",
          }}
        >
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 0 12px rgba(139,92,246,0.5)" }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">HUGOOS</span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />

          {/* CENTER: Fusion business chips */}
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            {/* Coaching chip */}
            <BizChip
              emoji="🎓"
              label="Coaching"
              kpi1={HEADER_COACHING.ca}
              kpi1Label="CA mois"
              kpi2={HEADER_COACHING.closing}
              kpi2Label="closing"
              color={HEADER_COACHING.color}
              glow={HEADER_COACHING.glow}
            />

            {/* Fusion divider — gradient bridge */}
            <div className="hidden lg:flex items-center flex-shrink-0">
              <div className="w-8 h-px" style={{ background: "linear-gradient(to right, rgba(168,85,247,0.4), rgba(0,255,136,0.4))" }} />
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(0,255,136,0.2))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 700,
                }}
              >
                ×
              </div>
              <div className="w-8 h-px" style={{ background: "linear-gradient(to right, rgba(0,255,136,0.4), rgba(168,85,247,0.4))" }} />
            </div>

            {/* Casino chip */}
            <BizChip
              emoji="🎰"
              label="Casino"
              kpi1={HEADER_CASINO.ca}
              kpi1Label="CA mois"
              kpi2={String(HEADER_CASINO.depots)}
              kpi2Label="dépôts"
              color={HEADER_CASINO.color}
              glow={HEADER_CASINO.glow}
            />
          </div>

          {/* Right: streak + XP + action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
              style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)" }}
            >
              <Flame className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
              <span className="font-mono text-xs font-bold" style={{ color: "#f97316" }}>{g.current_streak}j</span>
            </div>

            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                boxShadow: "0 0 16px rgba(139,92,246,0.4)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
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

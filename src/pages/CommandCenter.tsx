import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, TrendingUp, Users,
  Phone, DollarSign, MessageCircle, Target, Zap, RefreshCw,
} from "lucide-react";
import { gamificationProfile } from "@/lib/mock-data";
import TaskBoard from "@/components/TaskBoard";
import AffiliateCopyButton from "@/components/AffiliateCopyButton";
import HomeParticles from "@/components/HomeParticles";
import { useBusiness } from "@/lib/businessContext";

// ─── Supabase helper ─────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
async function sbFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── Real coaching data ───────────────────────────────────────
// 9 clients · 25 483 € CA total encaissé (août–déc 2025)
// 165 bookings Cal.com · taux closing 5,5%
const COACHING = {
  dmSemaine: 47,
  dmDelta: "+11 vs S-1",
  bookings: 165,
  bookingsDelta: "total Cal.com",
  tauxClosing: 5.5,
  closingDelta: "9 / 165 appels",
  caTotal: 25_483,
  caDelta: "9 clients signés",
};

// ─── Colors ──────────────────────────────────────────────────
const CASINO_COLOR  = "#00ff88";
const CASINO_DIM    = "#00d97b";
const CASINO_GLOW   = "rgba(0,255,136,0.12)";
const VIOLET_COLOR  = "#a855f7";
const VIOLET_DIM    = "#7c3aed";
const VIOLET_GLOW   = "rgba(168,85,247,0.12)";

// ─── KPI card ─────────────────────────────────────────────────
function KPICard({ label, value, delta, up, accent, icon: Icon }: {
  label: string; value: string; delta?: string; up?: boolean;
  accent: string; icon?: React.ElementType;
}) {
  return (
    <div
      className="kpi-hover p-4 rounded-2xl flex flex-col gap-2"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
          </div>
        )}
        {delta && (
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-auto"
            style={{ background: up ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: up ? "#4ade80" : "#f87171" }}
          >
            {up ? "↑" : ""} {delta}
          </span>
        )}
      </div>
      <p className="text-xl font-bold leading-none" style={{ color: "rgba(255,255,255,0.95)" }}>{value}</p>
      <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}

// ─── Casino panel (live Supabase) ─────────────────────────────
interface CasinoStats {
  commission: number; registrations: number; ctr: number;
  qftd: number; impressions: number; depots: number; revshare: number;
}
const CASINO_DEFAULTS: CasinoStats = {
  commission: 0, registrations: 0, ctr: 0,
  qftd: 0, impressions: 0, depots: 0, revshare: 0,
};

function CasinoPanel() {
  const [stats, setStats] = useState<CasinoStats>(CASINO_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = await sbFetch<any[]>(
        "casino_stats?brand=eq.corgibet&order=updated_at.desc&limit=1"
      );
      if (rows?.[0]) setStats(rows[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = stats;
  const cpa = s.depots * 80;
  const caTotal = s.commission + cpa + s.revshare;
  const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €";

  return (
    <div className="panel-inner p-5 flex flex-col gap-4 relative" style={{ background: "rgba(0,5,2,0.95)" }}>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${CASINO_COLOR}18`, boxShadow: `0 0 16px ${CASINO_GLOW}` }}>🎰</div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Casino Affiliation</p>
            <p className="text-[11px]" style={{ color: CASINO_DIM }}>Coolaff · CPA + RevShare</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: CASINO_DIM }} />}
          <AffiliateCopyButton />
          <Link to="/casino" className="flex items-center gap-1 text-xs" style={{ color: `${CASINO_DIM}99` }}>
            Voir tout <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${CASINO_COLOR}30, transparent)` }} />
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="Commission ce mois"     value={fmt(s.commission)}     accent={CASINO_COLOR} icon={DollarSign} />
        <KPICard label="Inscriptions générées"  value={String(s.registrations)} accent={CASINO_COLOR} icon={Users} />
        <KPICard label="Dépôts validés (CPA)"   value={String(s.depots)}      accent={CASINO_COLOR} icon={Target} />
        <KPICard label="CPA encaissé"           value={fmt(cpa)}              accent={CASINO_COLOR} icon={DollarSign} />
        <KPICard label="RevShare estimé"        value={fmt(s.revshare)}       accent={CASINO_COLOR} icon={TrendingUp} />
        <KPICard label="CA affiliation total"   value={fmt(caTotal)}          accent={CASINO_COLOR} icon={Zap} />
      </div>
      <p className="text-[10px] text-center relative z-10" style={{ color: "rgba(255,255,255,0.2)" }}>
        CPA calculé à 80 € / dépôt · données Supabase live
      </p>
    </div>
  );
}

// ─── Coaching panel ───────────────────────────────────────────
function CoachingPanel() {
  const c = COACHING;
  return (
    <div className="panel-inner p-5 flex flex-col gap-4 relative" style={{ background: "rgba(3,0,10,0.95)" }}>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${VIOLET_COLOR}18`, boxShadow: `0 0 16px ${VIOLET_GLOW}` }}>🎓</div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Coaching High-Ticket</p>
            <p className="text-[11px]" style={{ color: VIOLET_DIM + "bb" }}>9 clients · 25 483 € encaissés</p>
          </div>
        </div>
        <Link to="/coaching" className="flex items-center gap-1 text-xs" style={{ color: `${VIOLET_COLOR}99` }}>
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${VIOLET_COLOR}30, transparent)` }} />
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="DMs reçus cette semaine" value={String(c.dmSemaine)}                              delta={c.dmDelta}       up accent={VIOLET_COLOR} icon={MessageCircle} />
        <KPICard label="Bookings Cal.com"         value={String(c.bookings)}                              delta={c.bookingsDelta} up accent={VIOLET_COLOR} icon={Phone} />
        <KPICard label="Taux de closing"          value={`${c.tauxClosing}%`}                             delta={c.closingDelta}  up accent={VIOLET_COLOR} icon={Target} />
        <KPICard label="CA total encaissé"        value={c.caTotal.toLocaleString("fr-FR") + " €"}       delta={c.caDelta}       up accent={VIOLET_COLOR} icon={DollarSign} />
      </div>
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: "Leads",     path: "/coaching/leads",     emoji: "📞" },
          { label: "Appels",    path: "/coaching/appels",    emoji: "🎯" },
          { label: "Paiements", path: "/coaching/paiements", emoji: "💳" },
        ].map(l => (
          <Link key={l.path} to={l.path} className="flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium justify-center"
            style={{ background: `${VIOLET_COLOR}10`, border: `1px solid ${VIOLET_COLOR}20`, color: "rgba(255,255,255,0.55)" }}>
            <span>{l.emoji}</span> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────
function Greeting() {
  const hour    = new Date().getHours();
  const salut   = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const now     = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const g       = gamificationProfile;
  const { activeBusiness } = useBusiness();
  const accent  = activeBusiness.id === "casino" ? "#00cc44" : "#a855f7";
  const accentBg = activeBusiness.id === "casino" ? "rgba(0,204,68,0.1)" : "rgba(168,85,247,0.1)";
  const accentBorder = activeBusiness.id === "casino" ? "rgba(0,204,68,0.2)" : "rgba(168,85,247,0.2)";

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0s" }}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest animate-fade-up" style={{ color: "rgba(255,255,255,0.3)", animationDelay: "0.05s" }}>
          {salut} · <span style={{ color: "rgba(255,255,255,0.45)" }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</span>
        </p>
        <h1 className="text-3xl font-bold mt-1 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <span className="czn-title">Command Center</span>{" "}
          <span style={{ fontSize: "1.5rem" }}>⚡</span>
        </h1>
      </div>
      <div className="flex items-center gap-3 animate-fade-up" style={{ animationDelay: "0.18s" }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm czn-badge" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
          <span>🔥</span>
          <span style={{ color: "#f97316", fontWeight: 700 }}>{g.current_streak}j</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>streak</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm czn-badge" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${accent}25`, color: accent }}>Lv.{g.level}</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{g.level_title}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function CommandCenter() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <Greeting />

      {/* Task board — planning + today + week */}
      <div className="animate-fade-up" style={{ animationDelay: "0.22s" }}>
        <TaskBoard />
      </div>

      {/* Business panels */}
      <div className="animate-fade-up" style={{ animationDelay: "0.32s" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
          Mes business
        </p>
        {/* Particle canvas behind panels */}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: "-20px", zIndex: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 24 }}>
            <HomeParticles />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ position: "relative", zIndex: 1 }}>
            <div className="panel-coaching-wrap"><CoachingPanel /></div>
            <div className="panel-casino-wrap"><CasinoPanel /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

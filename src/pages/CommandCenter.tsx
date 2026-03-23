import { Link } from "react-router-dom";
import {
  ArrowRight, TrendingUp, Users,
  Phone, DollarSign, MessageCircle, Target, Zap,
} from "lucide-react";
import { gamificationProfile } from "@/lib/mock-data";
import TaskBoard from "@/components/TaskBoard";

// ─── Mock data ────────────────────────────────────────────────
const CASINO_MOCK = {
  clicsAffiliation: 3_840,
  clicsDelta: "+12%",
  inscriptions: 94,
  inscriptionsDelta: "+7",
  depots: 31,
  depotsDelta: "+4",
  cpaMois: 31 * 80,
  cpaDelta: "+320€",
  revshare: 1_240,
  caTotal: 8_960,
};

const COACHING_MOCK = {
  dmSemaine: 47,
  dmDelta: "+11 vs S-1",
  appelsReserves: 8,
  appelsDelta: "+2 vs S-1",
  tauxClosing: 38,
  closingDelta: "+5% vs M-1",
  caMois: 16_000,
  caDelta: "+4 000€ vs M-1",
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
            {up ? "↑" : "↓"} {delta}
          </span>
        )}
      </div>
      <p className="text-xl font-bold leading-none" style={{ color: "rgba(255,255,255,0.95)" }}>{value}</p>
      <p className="text-[11px] leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
    </div>
  );
}

// ─── Casino panel ─────────────────────────────────────────────
function CasinoPanel() {
  const c = CASINO_MOCK;
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
        <Link to="/casino" className="flex items-center gap-1 text-xs" style={{ color: `${CASINO_DIM}99` }}>
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${CASINO_COLOR}30, transparent)` }} />
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="Clics affiliation / semaine" value={c.clicsAffiliation.toLocaleString("fr-FR")} delta={c.clicsDelta} up accent={CASINO_COLOR} icon={Zap} />
        <KPICard label="Inscriptions générées"       value={String(c.inscriptions)}                      delta={c.inscriptionsDelta} up accent={CASINO_COLOR} icon={Users} />
        <KPICard label="Dépôts validés (CPA)"        value={String(c.depots)}                            delta={c.depotsDelta} up accent={CASINO_COLOR} icon={Target} />
        <KPICard label="CPA encaissé ce mois"        value={`${c.cpaMois.toLocaleString("fr-FR")} €`}   delta={c.cpaDelta} up accent={CASINO_COLOR} icon={DollarSign} />
        <KPICard label="RevShare estimé ce mois"     value={`${c.revshare.toLocaleString("fr-FR")} €`}  accent={CASINO_COLOR} icon={TrendingUp} />
        <KPICard label="CA affiliation total"        value={`${c.caTotal.toLocaleString("fr-FR")} €`}   accent={CASINO_COLOR} icon={DollarSign} />
      </div>
      <p className="text-[10px] text-center relative z-10" style={{ color: "rgba(255,255,255,0.2)" }}>
        CPA calculé à 80 € / dépôt · {c.depots} dépôts validés
      </p>
    </div>
  );
}

// ─── Coaching panel ───────────────────────────────────────────
function CoachingPanel() {
  const c = COACHING_MOCK;
  return (
    <div className="panel-inner p-5 flex flex-col gap-4 relative" style={{ background: "rgba(3,0,10,0.95)" }}>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${VIOLET_COLOR}18`, boxShadow: `0 0 16px ${VIOLET_GLOW}` }}>🎓</div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Coaching High-Ticket</p>
            <p className="text-[11px]" style={{ color: VIOLET_DIM + "bb" }}>Programme 4 000 € · saisie manuelle</p>
          </div>
        </div>
        <Link to="/coaching" className="flex items-center gap-1 text-xs" style={{ color: `${VIOLET_COLOR}99` }}>
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${VIOLET_COLOR}30, transparent)` }} />
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard label="DMs reçus cette semaine" value={String(c.dmSemaine)}                       delta={c.dmDelta}      up accent={VIOLET_COLOR} icon={MessageCircle} />
        <KPICard label="Appels réservés"          value={String(c.appelsReserves)}                 delta={c.appelsDelta}  up accent={VIOLET_COLOR} icon={Phone} />
        <KPICard label="Taux de closing"          value={`${c.tauxClosing}%`}                      delta={c.closingDelta} up accent={VIOLET_COLOR} icon={Target} />
        <KPICard label="CA encaissé ce mois"      value={`${c.caMois.toLocaleString("fr-FR")} €`} delta={c.caDelta}      up accent={VIOLET_COLOR} icon={DollarSign} />
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

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          {salut} · <span style={{ color: "rgba(255,255,255,0.45)" }}>{dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}</span>
        </p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: "rgba(255,255,255,0.95)" }}>
          Command Center <span style={{ fontSize: "1.5rem" }}>⚡</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <span>🔥</span>
          <span style={{ color: "#f97316", fontWeight: 700 }}>{g.current_streak}j</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>streak</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(168,85,247,0.25)", color: "#a855f7" }}>Lv.{g.level}</span>
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
      <TaskBoard />

      {/* Business panels */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
          Mes business
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="panel-coaching-wrap"><CoachingPanel /></div>
          <div className="panel-casino-wrap"><CasinoPanel /></div>
        </div>
      </div>
    </div>
  );
}

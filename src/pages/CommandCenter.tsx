import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckSquare, Circle, Plus, ArrowRight, TrendingUp, Users,
  Phone, DollarSign, MessageCircle, Target, Zap, Calendar,
} from "lucide-react";
import { gamificationProfile } from "@/lib/mock-data";

// ─── Types ───────────────────────────────────────────────────
interface Task {
  id: string;
  label: string;
  done: boolean;
  tag: "casino" | "coaching" | "content" | "perso";
  priority: "high" | "normal";
}

// ─── Mock data ────────────────────────────────────────────────
const INITIAL_TASKS: Task[] = [
  { id: "1", label: "Publier reel TikTok — storytelling client",    done: false, tag: "coaching", priority: "high"   },
  { id: "2", label: "Contacter support Coolaff — rapport hebdo",   done: false, tag: "casino",   priority: "high"   },
  { id: "3", label: "Relancer leads chauds de la semaine",         done: false, tag: "coaching", priority: "normal" },
  { id: "4", label: "Enregistrer script vidéo YouTube",             done: false, tag: "content",  priority: "normal" },
  { id: "5", label: "Saisir les clics Beacons de la semaine",       done: true,  tag: "coaching", priority: "normal" },
  { id: "6", label: "Vérifier les dépôts Coolaff validés",         done: false, tag: "casino",   priority: "normal" },
];

const CASINO_MOCK = {
  clicsAffiliation: 3_840,
  clicsDelta: "+12%",
  inscriptions: 94,
  inscriptionsDelta: "+7",
  depots: 31,
  depotsDelta: "+4",
  cpaMois: 31 * 80,        // 80€/dépôt
  cpaDelta: "+320€",
  revshare: 1_240,
  revshareLabel: "estimé",
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

// ─── Styles ──────────────────────────────────────────────────
const CASINO_COLOR  = "#00ff88";
const CASINO_DIM    = "#00d97b";
const CASINO_GLOW   = "rgba(0,255,136,0.12)";
const VIOLET_COLOR  = "#a855f7";
const VIOLET_DIM    = "#7c3aed";
const VIOLET_GLOW   = "rgba(168,85,247,0.12)";

const TAG_STYLES: Record<Task["tag"], { color: string; bg: string }> = {
  casino:   { color: CASINO_DIM,  bg: "rgba(0,217,123,0.12)"  },
  coaching: { color: VIOLET_COLOR, bg: "rgba(168,85,247,0.12)" },
  content:  { color: "#f59e0b",   bg: "rgba(245,158,11,0.12)" },
  perso:    { color: "#60a5fa",   bg: "rgba(96,165,250,0.12)" },
};

// ─── Week strip ───────────────────────────────────────────────
function WeekStrip() {
  const now  = new Date();
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const todayIdx = (now.getDay() + 6) % 7; // 0 = Lun

  return (
    <div className="flex gap-1.5">
      {days.map((d, i) => {
        const date = new Date(now);
        date.setDate(now.getDate() - todayIdx + i);
        const isToday = i === todayIdx;
        return (
          <div
            key={d}
            className="flex-1 flex flex-col items-center py-2 rounded-xl"
            style={{
              background: isToday ? "rgba(168,85,247,0.18)" : "rgba(255,255,255,0.03)",
              border: isToday ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span className="text-[10px] font-semibold" style={{ color: isToday ? "#c084fc" : "rgba(255,255,255,0.3)" }}>
              {d}
            </span>
            <span className="text-sm font-bold mt-0.5" style={{ color: isToday ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.45)" }}>
              {date.getDate()}
            </span>
            {isToday && (
              <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: "#a855f7", boxShadow: "0 0 6px #a855f7" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Today tasks ─────────────────────────────────────────────
function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) =>
    setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = () => {
    if (!newLabel.trim()) return;
    setTasks(p => [...p, { id: Date.now().toString(), label: newLabel.trim(), done: false, tag: "perso", priority: "normal" }]);
    setNewLabel("");
    setAdding(false);
  };

  const pending = tasks.filter(t => !t.done);
  const done    = tasks.filter(t =>  t.done);

  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.15)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4" style={{ color: "#a855f7" }} />
          <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>Tâches du jour</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(168,85,247,0.15)", color: "#c084fc" }}
          >
            {pending.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs transition-all"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </button>
      </div>

      <div className="space-y-1.5">
        {pending.map(t => (
          <TaskRow key={t.id} task={t} onToggle={toggle} />
        ))}

        {adding && (
          <div className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTask(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Nouvelle tâche..."
              className="flex-1 text-sm px-3 py-1.5 rounded-xl outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.25)", color: "rgba(255,255,255,0.85)" }}
            />
            <button onClick={addTask} className="text-xs px-3 py-1.5 rounded-xl font-medium" style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
              OK
            </button>
          </div>
        )}

        {done.length > 0 && (
          <div className="pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {done.map(t => <TaskRow key={t.id} task={t} onToggle={toggle} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const tag = TAG_STYLES[task.tag];
  return (
    <div
      className="flex items-center gap-3 py-1.5 px-2 rounded-xl transition-all group"
      style={{ background: task.done ? "transparent" : "rgba(255,255,255,0.02)" }}
    >
      <button onClick={() => onToggle(task.id)} className="flex-shrink-0 transition-transform group-hover:scale-110">
        {task.done
          ? <CheckSquare className="w-4 h-4" style={{ color: "#22c55e" }} />
          : <Circle className="w-4 h-4" style={{ color: task.priority === "high" ? "#f59e0b" : "rgba(255,255,255,0.25)" }} />
        }
      </button>
      <span
        className="flex-1 text-sm"
        style={{ color: task.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)", textDecoration: task.done ? "line-through" : "none" }}
      >
        {task.label}
      </span>
      <span
        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{ background: tag.bg, color: tag.color }}
      >
        {task.tag}
      </span>
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────
function KPICard({ label, value, delta, up, accent, icon: Icon }: {
  label: string; value: string; delta?: string; up?: boolean;
  accent: string; icon?: React.ElementType;
}) {
  return (
    <div
      className="p-4 rounded-2xl flex flex-col gap-2"
      style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${accent}18` }}
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
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: "rgba(0,8,4,0.7)",
        border: `1px solid ${CASINO_COLOR}28`,
        boxShadow: `0 0 60px ${CASINO_GLOW}, inset 0 1px 0 ${CASINO_COLOR}10`,
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: CASINO_COLOR, filter: "blur(80px)", opacity: 0.08 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: `${CASINO_COLOR}18`, boxShadow: `0 0 16px ${CASINO_GLOW}` }}
          >
            🎰
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Casino Affiliation</p>
            <p className="text-[11px]" style={{ color: CASINO_DIM }}>Coolaff · CPA + RevShare</p>
          </div>
        </div>
        <Link
          to="/casino"
          className="flex items-center gap-1 text-xs transition-all"
          style={{ color: `${CASINO_DIM}99` }}
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${CASINO_COLOR}30, transparent)` }} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard
          label="Clics affiliation / semaine"
          value={c.clicsAffiliation.toLocaleString("fr-FR")}
          delta={c.clicsDelta}
          up
          accent={CASINO_COLOR}
          icon={Zap}
        />
        <KPICard
          label="Inscriptions générées"
          value={String(c.inscriptions)}
          delta={c.inscriptionsDelta}
          up
          accent={CASINO_COLOR}
          icon={Users}
        />
        <KPICard
          label="Dépôts validés (CPA)"
          value={String(c.depots)}
          delta={c.depotsDelta}
          up
          accent={CASINO_COLOR}
          icon={Target}
        />
        <KPICard
          label={`CPA encaissé ce mois`}
          value={`${c.cpaMois.toLocaleString("fr-FR")} €`}
          delta={c.cpaDelta}
          up
          accent={CASINO_COLOR}
          icon={DollarSign}
        />
        <KPICard
          label="RevShare estimé ce mois"
          value={`${c.revshare.toLocaleString("fr-FR")} €`}
          accent={CASINO_COLOR}
          icon={TrendingUp}
        />
        <KPICard
          label="CA affiliation total"
          value={`${c.caTotal.toLocaleString("fr-FR")} €`}
          accent={CASINO_COLOR}
          icon={DollarSign}
        />
      </div>

      {/* Footer note */}
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
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: "rgba(4,0,12,0.7)",
        border: `1px solid ${VIOLET_COLOR}28`,
        boxShadow: `0 0 60px ${VIOLET_GLOW}, inset 0 1px 0 ${VIOLET_COLOR}10`,
      }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: VIOLET_COLOR, filter: "blur(80px)", opacity: 0.12 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: `${VIOLET_COLOR}18`, boxShadow: `0 0 16px ${VIOLET_GLOW}` }}
          >
            🎓
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Coaching High-Ticket</p>
            <p className="text-[11px]" style={{ color: VIOLET_DIM + "bb" }}>Programme 4 000 € · saisie manuelle</p>
          </div>
        </div>
        <Link
          to="/coaching"
          className="flex items-center gap-1 text-xs transition-all"
          style={{ color: `${VIOLET_COLOR}99` }}
        >
          Voir tout <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Divider */}
      <div className="h-px relative z-10" style={{ background: `linear-gradient(to right, ${VIOLET_COLOR}30, transparent)` }} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 relative z-10">
        <KPICard
          label="DMs reçus cette semaine"
          value={String(c.dmSemaine)}
          delta={c.dmDelta}
          up
          accent={VIOLET_COLOR}
          icon={MessageCircle}
        />
        <KPICard
          label="Appels réservés"
          value={String(c.appelsReserves)}
          delta={c.appelsDelta}
          up
          accent={VIOLET_COLOR}
          icon={Phone}
        />
        <KPICard
          label="Taux de closing"
          value={`${c.tauxClosing}%`}
          delta={c.closingDelta}
          up
          accent={VIOLET_COLOR}
          icon={Target}
        />
        <KPICard
          label="CA encaissé ce mois"
          value={`${c.caMois.toLocaleString("fr-FR")} €`}
          delta={c.caDelta}
          up
          accent={VIOLET_COLOR}
          icon={DollarSign}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: "Leads", path: "/coaching/leads", emoji: "📞" },
          { label: "Appels", path: "/coaching/appels", emoji: "🎯" },
          { label: "Paiements", path: "/coaching/paiements", emoji: "💳" },
        ].map(l => (
          <Link
            key={l.path}
            to={l.path}
            className="flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-medium justify-center transition-all"
            style={{ background: `${VIOLET_COLOR}10`, border: `1px solid ${VIOLET_COLOR}20`, color: "rgba(255,255,255,0.55)" }}
          >
            <span>{l.emoji}</span> {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────
function Greeting() {
  const hour = new Date().getHours();
  const salut = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const g = gamificationProfile;

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
          {salut} ·{" "}
          <span style={{ color: "rgba(255,255,255,0.45)" }}>
            {dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}
          </span>
        </p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: "rgba(255,255,255,0.95)" }}>
          Command Center <span style={{ fontSize: "1.5rem" }}>⚡</span>
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <span>🔥</span>
          <span style={{ color: "#f97316", fontWeight: 700 }}>{g.current_streak}j</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>streak</span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
          style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}
        >
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: "rgba(168,85,247,0.25)", color: "#a855f7" }}>
            Lv.{g.level}
          </span>
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

      {/* Greeting */}
      <Greeting />

      {/* Week + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {/* Week strip */}
          <div
            className="p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: "#a855f7" }} />
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                Semaine en cours
              </span>
            </div>
            <WeekStrip />
          </div>
        </div>

        <div className="lg:col-span-3">
          <TodayTasks />
        </div>
      </div>

      {/* Two business panels */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
          Mes business
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CasinoPanel />
          <CoachingPanel />
        </div>
      </div>

    </div>
  );
}

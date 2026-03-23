import { useState, ElementType } from "react";
import { TrendingUp, Users, Calendar, DollarSign, Plus, Phone, Mail, CheckCircle, Clock, X, ChevronRight, Target } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

// ─── Types ───────────────────────────────────────────────
type Stage = "Prospect" | "RDV" | "Offre" | "Client" | "Perdu";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: Stage;
  value: number;
  notes: string;
  date: string;
  nextAction?: string;
}

interface Session {
  id: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  type: "Discovery" | "Coaching" | "Suivi" | "Stratégie";
  status: "planned" | "done" | "cancelled";
  notes?: string;
}

// ─── Mock Data ────────────────────────────────────────────
const INITIAL_LEADS: Lead[] = [
  { id: "1", name: "Marie Dupont", email: "marie@example.com", phone: "06 12 34 56 78", stage: "Prospect", value: 2500, notes: "Intéressée par coaching business 3 mois", date: "2026-03-20", nextAction: "Envoyer brochure" },
  { id: "2", name: "Thomas Laurent", email: "thomas@startup.io", phone: "07 98 76 54 32", stage: "RDV", value: 4800, notes: "CEO startup, veut scaler son équipe", date: "2026-03-18", nextAction: "RDV Zoom Mardi 14h" },
  { id: "3", name: "Sophie Martin", email: "sophie@corp.fr", stage: "Offre", value: 6000, notes: "Offre 6 mois envoyée", date: "2026-03-15", nextAction: "Relance vendredi" },
  { id: "4", name: "Lucas Bernard", email: "lucas@agence.com", stage: "Client", value: 3200, notes: "Client actif - session hebdo", date: "2026-02-01" },
  { id: "5", name: "Emma Rousseau", email: "emma@freelance.fr", stage: "Client", value: 1800, notes: "Coaching mensuel", date: "2026-01-15" },
  { id: "6", name: "Paul Moreau", email: "paul@saas.io", stage: "Perdu", value: 5000, notes: "Budget insuffisant", date: "2026-03-10" },
];

const INITIAL_SESSIONS: Session[] = [
  { id: "1", clientName: "Lucas Bernard", date: "2026-03-24", time: "10:00", duration: 60, type: "Coaching", status: "planned" },
  { id: "2", clientName: "Emma Rousseau", date: "2026-03-24", time: "14:00", duration: 45, type: "Suivi", status: "planned" },
  { id: "3", clientName: "Thomas Laurent", date: "2026-03-25", time: "11:00", duration: 30, type: "Discovery", status: "planned" },
  { id: "4", clientName: "Lucas Bernard", date: "2026-03-17", time: "10:00", duration: 60, type: "Coaching", status: "done" },
  { id: "5", clientName: "Emma Rousseau", date: "2026-03-17", time: "14:00", duration: 45, type: "Suivi", status: "done" },
];

const STAGES: Stage[] = ["Prospect", "RDV", "Offre", "Client", "Perdu"];

const STAGE_COLORS: Record<Stage, { bg: string; border: string; text: string; dot: string }> = {
  Prospect: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#818cf8", dot: "#6366f1" },
  RDV: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24", dot: "#f59e0b" },
  Offre: { bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.3)", text: "#a78bfa", dot: "#7c3aed" },
  Client: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399", dot: "#10b981" },
  Perdu: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#f87171", dot: "#ef4444" },
};

const SESSION_TYPE_COLORS: Record<Session["type"], string> = {
  Discovery: "#6366f1",
  Coaching: "#a855f7",
  Suivi: "#10b981",
  Stratégie: "#f59e0b",
};

// ─── Sub-components ───────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: ElementType; color: string;
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function PipelineColumn({ stage, leads, onMove }: { stage: Stage; leads: Lead[]; onMove: (id: string, to: Stage) => void }) {
  const sc = STAGE_COLORS[stage];
  const stageIdx = STAGES.indexOf(stage);
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
        <span className="text-sm font-semibold text-foreground">{stage}</span>
        <span className="text-xs text-muted-foreground ml-auto">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map(lead => (
          <div key={lead.id} className="glass-card p-3 space-y-2 group">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-foreground">{lead.name}</p>
              <span className="text-xs font-bold" style={{ color: sc.text }}>{lead.value.toLocaleString()} €</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{lead.notes}</p>
            {lead.nextAction && (
              <p className="text-xs text-primary flex items-center gap-1"><ChevronRight size={10} />{lead.nextAction}</p>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {stageIdx > 0 && stage !== "Perdu" && (
                <button onClick={() => onMove(lead.id, STAGES[stageIdx - 1])} className="text-[10px] px-2 py-0.5 rounded-md bg-white/40 text-muted-foreground hover:text-foreground transition-colors">← {STAGES[stageIdx - 1]}</button>
              )}
              {stageIdx < STAGES.length - 2 && stage !== "Perdu" && (
                <button onClick={() => onMove(lead.id, STAGES[stageIdx + 1])} className="text-[10px] px-2 py-0.5 rounded-md bg-white/40 text-muted-foreground hover:text-foreground transition-colors">{STAGES[stageIdx + 1]} →</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function VentesPage() {
  const { activeBusiness } = useBusiness();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [sessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [showForm, setShowForm] = useState(false);

  const moveLead = (id: string, to: Stage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: to } : l));
  };

  const totalPipeline = leads.filter(l => l.stage !== "Perdu" && l.stage !== "Client").reduce((s, l) => s + l.value, 0);
  const activeClients = leads.filter(l => l.stage === "Client").length;
  const upcomingSessions = sessions.filter(s => s.status === "planned").length;
  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === "Client").length / leads.length) * 100) : 0;

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newLead: Lead = {
      id: Date.now().toString(),
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || undefined,
      stage: "Prospect",
      value: Number(fd.get("value")),
      notes: fd.get("notes") as string || "",
      date: new Date().toISOString().slice(0, 10),
    };
    if (newLead.name && newLead.email) {
      setLeads(prev => [newLead, ...prev]);
      setShowForm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventes & Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des prospects, clients et sessions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Fermer" : "Nouveau lead"}
        </button>
      </div>

      {/* Add lead form */}
      {showForm && (
        <form onSubmit={handleAddLead} className="glass-card p-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          <input name="name" placeholder="Nom" required className="px-3 py-2 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input name="email" type="email" placeholder="Email" required className="px-3 py-2 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input name="phone" placeholder="Téléphone" className="px-3 py-2 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input name="value" type="number" min="0" placeholder="Valeur €" className="px-3 py-2 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Ajouter</button>
        </form>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Pipeline" value={`${totalPipeline.toLocaleString()} €`} icon={TrendingUp} color="#6366f1" sub="Valeur totale en cours" />
        <KpiCard label="Clients actifs" value={`${activeClients}`} icon={Users} color="#10b981" sub={`${conversionRate}% conversion`} />
        <KpiCard label="Sessions à venir" value={`${upcomingSessions}`} icon={Calendar} color="#f59e0b" sub="Cette semaine" />
        <KpiCard label="Revenue clients" value={`${leads.filter(l => l.stage === "Client").reduce((s, l) => s + l.value, 0).toLocaleString()} €`} icon={DollarSign} color="#a855f7" sub="Clients actifs" />
      </div>

      {/* Pipeline */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline de ventes</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STAGES.map(stage => (
            <PipelineColumn key={stage} stage={stage} leads={leads.filter(l => l.stage === stage)} onMove={moveLead} />
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Sessions à venir</h3>
        <div className="space-y-2">
          {sessions.filter(s => s.status === "planned").map(s => (
            <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/30 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${SESSION_TYPE_COLORS[s.type]}18` }}>
                <Calendar size={14} style={{ color: SESSION_TYPE_COLORS[s.type] }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.clientName}</p>
                <p className="text-xs text-muted-foreground">{s.type} · {s.duration}min</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{s.date}</p>
                <p className="text-xs text-muted-foreground">{s.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

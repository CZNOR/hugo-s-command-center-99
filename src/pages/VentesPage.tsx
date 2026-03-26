import { useState, ElementType } from "react";
import { TrendingUp, Users, Calendar, DollarSign, Plus, Phone, Mail, ChevronRight, Target, X, Trash2, Clock } from "lucide-react";
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

const SESSION_TYPES: Session["type"][] = ["Discovery", "Coaching", "Suivi", "Stratégie"];

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

function PipelineColumn({ stage, leads, onMove, onDelete }: {
  stage: Stage; leads: Lead[]; onMove: (id: string, to: Stage) => void; onDelete: (id: string) => void;
}) {
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
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold" style={{ color: sc.text }}>{lead.value.toLocaleString()} €</span>
                <button
                  onClick={() => onDelete(lead.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
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

// ─── Modals ──────────────────────────────────────────────

function LeadModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", value: "", notes: "", stage: "Prospect" as Stage });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    onConfirm({
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      stage: form.stage,
      value: Number(form.value) || 0,
      notes: form.notes,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nouveau lead</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/30 transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom complet" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" placeholder="email@exemple.fr" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Téléphone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="06 12 34 56 78" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Valeur (€)</label>
              <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} type="number" min="0" placeholder="0" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
              <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as Stage }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Contexte, besoins..." rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-white/40 border border-border hover:bg-white/60 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={!form.name.trim() || !form.email.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

function SessionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (session: Session) => void }) {
  const [form, setForm] = useState({ clientName: "", date: new Date().toISOString().slice(0, 10), time: "10:00", duration: "60", type: "Coaching" as Session["type"], notes: "" });

  const handleSubmit = () => {
    if (!form.clientName.trim()) return;
    onConfirm({
      id: Date.now().toString(),
      clientName: form.clientName,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      type: form.type,
      status: "planned",
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nouvelle session</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/30 transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nom du client *</label>
            <input value={form.clientName} onChange={e => setForm(p => ({ ...p, clientName: e.target.value }))} placeholder="Nom du client" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} type="date" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Heure</label>
              <input value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} type="time" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Durée (min)</label>
              <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} type="number" min="15" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type de session</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Session["type"] }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes sur la session..." rows={2} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-white/40 border border-border hover:bg-white/60 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={!form.clientName.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

export default function VentesPage() {
  const { activeBusiness } = useBusiness();
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"pipeline" | "planning">("pipeline");

  const moveLead = (id: string, to: Stage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: to } : l));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const addLead = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
    setShowLeadModal(false);
  };

  const addSession = (session: Session) => {
    setSessions(prev => [session, ...prev]);
    setShowSessionModal(false);
  };

  const totalPipeline = leads.filter(l => l.stage !== "Perdu" && l.stage !== "Client").reduce((s, l) => s + l.value, 0);
  const activeClients = leads.filter(l => l.stage === "Client").length;
  const upcomingSessions = sessions.filter(s => s.status === "planned").length;
  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.stage === "Client").length / leads.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ventes & Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestion des prospects, clients et sessions</p>
        </div>
        <button
          onClick={() => activeTab === "pipeline" ? setShowLeadModal(true) : setShowSessionModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{activeTab === "pipeline" ? "Nouveau lead" : "Nouvelle session"}</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Pipeline" value={`${totalPipeline.toLocaleString()} €`} icon={TrendingUp} color="#6366f1" sub="Valeur totale en cours" />
        <KpiCard label="Clients actifs" value={`${activeClients}`} icon={Users} color="#10b981" sub={`${conversionRate}% conversion`} />
        <KpiCard label="Sessions à venir" value={`${upcomingSessions}`} icon={Calendar} color="#f59e0b" sub="Cette semaine" />
        <KpiCard label="Revenus clients" value={`${leads.filter(l => l.stage === "Client").reduce((s, l) => s + l.value, 0).toLocaleString()} €`} icon={DollarSign} color="#a855f7" sub="Clients actifs" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/30 w-fit">
        <button onClick={() => setActiveTab("pipeline")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "pipeline" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Pipeline</button>
        <button onClick={() => setActiveTab("planning")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "planning" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Planning</button>
      </div>

      {activeTab === "pipeline" && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Pipeline de ventes</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {STAGES.map(stage => (
              <PipelineColumn key={stage} stage={stage} leads={leads.filter(l => l.stage === stage)} onMove={moveLead} onDelete={deleteLead} />
            ))}
          </div>
        </div>
      )}

      {activeTab === "planning" && (
        <div className="space-y-4">
          {/* Upcoming */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Sessions à venir</h3>
              <button onClick={() => setShowSessionModal(true)} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                <Plus size={12} className="inline mr-1" />Nouvelle session
              </button>
            </div>
            <div className="space-y-2">
              {sessions.filter(s => s.status === "planned").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune session planifiée</p>
              )}
              {sessions.filter(s => s.status === "planned").map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${SESSION_TYPE_COLORS[s.type]}18` }}>
                    <Calendar size={14} style={{ color: SESSION_TYPE_COLORS[s.type] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.clientName}</p>
                    <p className="text-xs text-muted-foreground">{s.type} · {s.duration} min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
                    <p className="text-xs text-muted-foreground">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past sessions */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Sessions passées</h3>
            <div className="space-y-2">
              {sessions.filter(s => s.status === "done").map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl opacity-60">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/30">
                    <Clock size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.clientName}</p>
                    <p className="text-xs text-muted-foreground">{s.type} · {s.duration} min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showLeadModal && <LeadModal onClose={() => setShowLeadModal(false)} onConfirm={addLead} />}
      {showSessionModal && <SessionModal onClose={() => setShowSessionModal(false)} onConfirm={addSession} />}
    </div>
  );
}

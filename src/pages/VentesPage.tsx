import { useState } from "react";
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
  duration: number; // minutes
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
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="violet-card p-5 animate-scale-in" style={{ borderRadius: 16 }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      {sub && <div className="text-xs text-white/40">{sub}</div>}
    </div>
  );
}

function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, stage: Stage) => void }) {
  const colors = STAGE_COLORS[lead.stage];
  return (
    <div
      className="p-3 rounded-xl mb-2 cursor-pointer group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(168,85,247,0.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-white">{lead.name}</span>
        <span className="text-xs font-mono font-bold" style={{ color: "#a855f7" }}>
          {lead.value.toLocaleString("fr-FR")}€
        </span>
      </div>
      <div className="text-xs text-white/40 mb-2 truncate">{lead.email}</div>
      {lead.nextAction && (
        <div className="flex items-center gap-1 text-xs" style={{ color: "#fbbf24" }}>
          <Clock className="w-3 h-3" />
          <span>{lead.nextAction}</span>
        </div>
      )}
      <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {STAGES.filter(s => s !== lead.stage && s !== "Perdu").map(s => (
          <button
            key={s}
            onClick={() => onMove(lead.id, s)}
            className="text-xs px-2 py-0.5 rounded-md transition-colors"
            style={{ background: STAGE_COLORS[s].bg, color: STAGE_COLORS[s].text, border: `1px solid ${STAGE_COLORS[s].border}` }}
          >
            → {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", value: "", notes: "", stage: "Prospect" as Stage });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-scale-in" style={{ background: "rgba(15,8,30,0.95)", border: "1px solid rgba(124,58,237,0.4)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Nouveau Lead</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {[
            { key: "name", label: "Nom complet", placeholder: "Marie Dupont" },
            { key: "email", label: "Email", placeholder: "marie@example.com" },
            { key: "phone", label: "Téléphone", placeholder: "06 12 34 56 78" },
          ].map(f => (
            <div key={f.key}>
              <label className="text-xs text-white/50 mb-1 block">{f.label}</label>
              <input
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-white/50 mb-1 block">Valeur estimée (€)</label>
            <input
              type="number"
              value={form.value}
              onChange={e => setForm(prev => ({ ...prev, value: e.target.value }))}
              placeholder="3000"
              className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Étape</label>
            <select
              value={form.stage}
              onChange={e => setForm(prev => ({ ...prev, stage: e.target.value as Stage }))}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {STAGES.filter(s => s !== "Perdu").map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Contexte, besoins..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-white/60" style={{ background: "rgba(255,255,255,0.06)" }}>Annuler</button>
          <button
            onClick={() => {
              if (!form.name || !form.email) return;
              onAdd({ id: Date.now().toString(), name: form.name, email: form.email, phone: form.phone, stage: form.stage, value: Number(form.value) || 0, notes: form.notes, date: new Date().toISOString().slice(0, 10) });
              onClose();
            }}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function VentesPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [activeTab, setActiveTab] = useState<"pipeline" | "planning">("pipeline");
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSession, setNewSession] = useState({ clientName: "", date: "", time: "", duration: "60", type: "Coaching" as Session["type"] });
  const { activeBusiness } = useBusiness();

  const moveLead = (id: string, stage: Stage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
  };

  const addLead = (lead: Lead) => setLeads(prev => [...prev, lead]);

  const addSession = () => {
    if (!newSession.clientName || !newSession.date || !newSession.time) return;
    setSessions(prev => [...prev, {
      id: Date.now().toString(),
      clientName: newSession.clientName,
      date: newSession.date,
      time: newSession.time,
      duration: Number(newSession.duration),
      type: newSession.type,
      status: "planned",
    }]);
    setShowAddSession(false);
    setNewSession({ clientName: "", date: "", time: "", duration: "60", type: "Coaching" });
  };

  // KPIs
  const totalPipeline = leads.filter(l => l.stage !== "Perdu").reduce((s, l) => s + l.value, 0);
  const activeClients = leads.filter(l => l.stage === "Client").length;
  const rdvThisWeek = sessions.filter(s => s.status === "planned" && s.date >= "2026-03-23" && s.date <= "2026-03-29").length;
  const caClients = leads.filter(l => l.stage === "Client").reduce((s, l) => s + l.value, 0);

  // Sort sessions by date
  const upcomingSessions = sessions.filter(s => s.status === "planned").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const pastSessions = sessions.filter(s => s.status === "done").sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="page-enter space-y-6">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KpiCard label="Pipeline total" value={`${totalPipeline.toLocaleString("fr-FR")}€`} sub="Hors perdus" icon={TrendingUp} color="#a855f7" />
        <KpiCard label="Clients actifs" value={String(activeClients)} sub={`${caClients.toLocaleString("fr-FR")}€ CA`} icon={Users} color="#10b981" />
        <KpiCard label="RDV cette semaine" value={String(rdvThisWeek)} sub="Sessions planifiées" icon={Calendar} color="#f59e0b" />
        <KpiCard label="Prospects chauds" value={String(leads.filter(l => l.stage === "RDV" || l.stage === "Offre").length)} sub="En cours de closing" icon={Target} color="#6366f1" />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {(["pipeline", "planning"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={activeTab === tab
              ? { background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 4px 12px rgba(124,58,237,0.4)" }
              : { color: "rgba(255,255,255,0.5)" }
            }
          >
            {tab === "pipeline" ? "🎯 Pipeline" : "📅 Planning"}
          </button>
        ))}
      </div>

      {/* ── Pipeline View ── */}
      {activeTab === "pipeline" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Pipeline Coaching</h2>
            <button
              onClick={() => setShowAddLead(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
            >
              <Plus className="w-4 h-4" /> Nouveau lead
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage);
              const colors = STAGE_COLORS[stage];
              const total = stageLeads.reduce((s, l) => s + l.value, 0);
              return (
                <div key={stage} className="rounded-2xl p-3 min-h-32" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors.dot }} />
                      <span className="text-xs font-semibold" style={{ color: colors.text }}>{stage}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: colors.text }}>{stageLeads.length}</span>
                  </div>
                  {total > 0 && (
                    <div className="text-xs text-white/30 mb-3 font-mono">{total.toLocaleString("fr-FR")}€</div>
                  )}
                  {stageLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onMove={moveLead} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Planning View ── */}
      {activeTab === "planning" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Planning Sessions</h2>
            <button
              onClick={() => setShowAddSession(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}
            >
              <Plus className="w-4 h-4" /> Planifier session
            </button>
          </div>

          {/* Add session form */}
          {showAddSession && (
            <div className="violet-card p-5 mb-4 animate-scale-in">
              <h3 className="text-sm font-semibold text-white mb-4">Nouvelle session</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Client</label>
                  <input
                    value={newSession.clientName}
                    onChange={e => setNewSession(p => ({ ...p, clientName: e.target.value }))}
                    placeholder="Nom du client"
                    className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Date</label>
                  <input type="date" value={newSession.date} onChange={e => setNewSession(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Heure</label>
                  <input type="time" value={newSession.time} onChange={e => setNewSession(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Durée (min)</label>
                  <input type="number" value={newSession.duration} onChange={e => setNewSession(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Type</label>
                  <select value={newSession.type} onChange={e => setNewSession(p => ({ ...p, type: e.target.value as Session["type"] }))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {["Discovery", "Coaching", "Suivi", "Stratégie"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={addSession} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    Ajouter
                  </button>
                  <button onClick={() => setShowAddSession(false)} className="px-3 py-2 rounded-xl text-sm text-white/50"
                    style={{ background: "rgba(255,255,255,0.06)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Upcoming */}
            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> À venir ({upcomingSessions.length})
              </h3>
              <div className="space-y-2 stagger-children">
                {upcomingSessions.length === 0 && (
                  <div className="text-sm text-white/30 text-center py-8">Aucune session planifiée</div>
                )}
                {upcomingSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: SESSION_TYPE_COLORS[s.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{s.clientName}</div>
                      <div className="text-xs text-white/40">{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} à {s.time} · {s.duration}min</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: SESSION_TYPE_COLORS[s.type] + "22", color: SESSION_TYPE_COLORS[s.type] }}>
                      {s.type}
                    </span>
                    <button onClick={() => setSessions(prev => prev.map(sess => sess.id === s.id ? { ...sess, status: "done" } : sess))}
                      className="p-1.5 rounded-lg text-white/30 hover:text-green-400 transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Past */}
            <div>
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Effectuées ({pastSessions.length})
              </h3>
              <div className="space-y-2">
                {pastSessions.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl opacity-60" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-1 h-10 rounded-full flex-shrink-0 opacity-50" style={{ background: SESSION_TYPE_COLORS[s.type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/70">{s.clientName}</div>
                      <div className="text-xs text-white/30">{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {s.duration}min</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399" }}>✓ Fait</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showAddLead && <AddLeadModal onClose={() => setShowAddLead(false)} onAdd={addLead} />}
    </div>
  );
}

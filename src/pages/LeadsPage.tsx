import { useState, useEffect } from "react";
import { Phone, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, User, RefreshCw } from "lucide-react";
import { fetchAllBookings, type CalBooking } from "@/lib/calcom";

// ─── Types ───────────────────────────────────────────────────
type LeadStatus = "confirmé" | "présent" | "annulé" | "en attente";

interface Lead {
  id: string;
  nom: string;
  email: string;
  phone?: string;
  dateISO: string;
  closer: string;
  statut: LeadStatus;
  budget?: string;
  niveau?: string;
  formation?: string;
}

// ─── Cal.com status → Lead status ────────────────────────────
function toLeadStatus(b: CalBooking): LeadStatus {
  const past = new Date(b.startTime) < new Date();
  if (b.status === "CANCELLED" || b.status === "REJECTED") return "annulé";
  if (b.status === "PENDING") return "en attente";
  return past ? "présent" : "confirmé";
}

function toLead(b: CalBooking): Lead {
  return {
    id: String(b.id),
    nom: b.attendee.name,
    email: b.attendee.email,
    phone: b.attendee.phone,
    dateISO: b.startTime,
    closer: b.closer,
    statut: toLeadStatus(b),
    budget: b.budget,
    niveau: b.niveau,
    formation: b.formation,
  };
}

// ─── Status config ────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmé:     { label: "Confirmé",   color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock },
  présent:      { label: "Présent ✓",  color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: CheckCircle },
  annulé:       { label: "Annulé",     color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: XCircle },
  "en attente": { label: "En attente", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: AlertCircle },
};

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(139,92,246,0.15)",
  borderRadius: "16px",
};
const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 40px rgba(139,92,246,0.10)",
};

// ─── Lead row ─────────────────────────────────────────────────
function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const status     = STATUS_CONFIG[lead.statut];
  const StatusIcon = status.icon;
  const dt         = new Date(lead.dateISO);
  const dateLabel  = dt.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const timeLabel  = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const hasDetails = !!(lead.budget || lead.niveau || lead.formation || lead.phone || lead.email);

  return (
    <div style={{ border: "1px solid rgba(139,92,246,0.12)", borderRadius: "12px", overflow: "hidden" }}>
      <button
        className="w-full flex items-center gap-3 p-4 transition-all text-left"
        style={{ background: open ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)" }}
        onClick={() => hasDetails && setOpen(!open)}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}>
          <User className="w-4 h-4" style={{ color: "#a855f7" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{lead.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {dateLabel} · {timeLabel}
          </p>
        </div>

        <span className="text-[11px] px-2 py-0.5 rounded-full hidden lg:inline-flex items-center gap-1 flex-shrink-0"
          style={{ background: "rgba(168,85,247,0.08)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(168,85,247,0.12)" }}>
          {lead.closer.split(" ")[0]}
        </span>

        {lead.budget && (
          <span className="text-[11px] px-2 py-0.5 rounded-full hidden md:inline-flex items-center flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.12)" }}>
            {lead.budget}
          </span>
        )}

        <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: status.bg, color: status.color }}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>

        {hasDetails && (open
          ? <ChevronUp  className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {lead.email && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Email</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.email}</p>
              </div>
            )}
            {lead.phone && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Téléphone</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.phone}</p>
              </div>
            )}
            {lead.budget && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Budget</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.budget}</p>
              </div>
            )}
            {lead.niveau && (
              <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Niveau</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.niveau}</p>
              </div>
            )}
            {lead.formation && (
              <div className="p-3 rounded-xl sm:col-span-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Formation / Objectif</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.formation}</p>
              </div>
            )}
            <div className="p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>Closer</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{lead.closer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<LeadStatus | "tous">("tous");
  const [search,  setSearch]  = useState("");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchAllBookings();
      setLeads(
        raw
          .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
          .map(toLead)
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmed = leads.filter(l => l.statut === "confirmé").length;
  const presents  = leads.filter(l => l.statut === "présent").length;
  const cancelled = leads.filter(l => l.statut === "annulé").length;
  const pending   = leads.filter(l => l.statut === "en attente").length;
  const total     = leads.length;
  const txConfirm = total > 0 ? Math.round(((presents + confirmed) / total) * 100) : 0;

  const filtered = leads
    .filter(l => filter === "tous" || l.statut === filter)
    .filter(l => !search || l.nom.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Leads & Réservations
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Appels réservés via cal.com · {loading ? "chargement…" : `${total} bookings`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", color: "#a855f7", opacity: loading ? 0.5 : 1, cursor: loading ? "wait" : "pointer" }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <p className="text-sm font-medium">Erreur Cal.com</p>
          <p className="text-xs mt-1 opacity-70">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total bookings", value: total,         color: "#a855f7", icon: "📋" },
          { label: "Présents",       value: presents,      color: "#22c55e", icon: "✅" },
          { label: "Confirmés",      value: confirmed,     color: "#60a5fa", icon: "📅" },
          { label: "Taux présence",  value: `${txConfirm}%`, color: "#f59e0b", icon: "📊" },
        ].map(s => (
          <div key={s.label} className="p-4" style={cardGlow}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold mt-2" style={{ color: s.color }}>
              {loading ? "—" : s.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "rgba(255,255,255,0.8)", outline: "none",
          }} />
        <div className="flex flex-wrap gap-2">
          {([
            ["tous",      `Tous (${total})`],
            ["présent",   `Présents (${presents})`],
            ["confirmé",  `Confirmés (${confirmed})`],
            ["annulé",    `Annulés (${cancelled})`],
            ["en attente",`En attente (${pending})`],
          ] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap"
              style={filter === val ? {
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
                border: "1px solid rgba(139,92,246,0.4)", color: "rgba(255,255,255,0.9)",
              } : {
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(139,92,246,0.12)", color: "rgba(255,255,255,0.45)",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "rgba(168,85,247,0.5)" }} />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(lead => <LeadRow key={lead.id} lead={lead} />)}
          {filtered.length === 0 && (
            <div className="p-10 text-center" style={card}>
              <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                {search ? "Aucun résultat pour cette recherche" : "Aucun lead dans cette catégorie"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

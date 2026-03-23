import { useState } from "react";
import { Phone, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp, User } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type LeadStatus = "confirmé" | "présent" | "absent" | "annulé" | "en attente";
type QualScore = 1 | 2 | 3 | 4 | 5;

interface Lead {
  id: string;
  nom: string;
  date: string;
  heure: string;
  source: string;
  statut: LeadStatus;
  score: QualScore;
  reponses: {
    objectif: string;
    chiffre: string;
    budget: string;
    urgence: string;
    experience: string;
  };
}

// ─── Mock data ───────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    nom: "Thomas Durand",
    date: "2024-01-22",
    heure: "14:00",
    source: "Instagram",
    statut: "présent",
    score: 5,
    reponses: {
      objectif: "Atteindre 5k€/mois en coaching sportif d'ici 3 mois",
      chiffre: "J'ai déjà 2-3 clients à 200€/mois",
      budget: "Je peux investir jusqu'à 4000€",
      urgence: "Je veux commencer maintenant, j'en ai marre de mon job",
      experience: "3 ans coach salle, diplômé BPJEPS",
    },
  },
  {
    id: "2",
    nom: "Sarah Martin",
    date: "2024-01-23",
    heure: "10:30",
    source: "TikTok",
    statut: "présent",
    score: 4,
    reponses: {
      objectif: "Lancer mon activité de coaching nutrition",
      chiffre: "Pas encore de clients, je débute",
      budget: "Je peux investir entre 2000 et 4000€",
      urgence: "Je cherche à démarrer dans les 2 mois",
      experience: "Diététicienne salariée depuis 4 ans",
    },
  },
  {
    id: "3",
    nom: "Lucas Petit",
    date: "2024-01-24",
    heure: "16:00",
    source: "Instagram",
    statut: "absent",
    score: 3,
    reponses: {
      objectif: "Développer mon coaching bien-être",
      chiffre: "Quelques clients ponctuels à 80€/séance",
      budget: "Je verrai selon l'offre",
      urgence: "Pas de rush particulier",
      experience: "Formé en naturopathie",
    },
  },
  {
    id: "4",
    nom: "Marie Lefevre",
    date: "2024-01-25",
    heure: "11:00",
    source: "YouTube",
    statut: "confirmé",
    score: 5,
    reponses: {
      objectif: "Créer un programme de coaching business 100% online",
      chiffre: "3 clients à 500€/mois actuellement",
      budget: "Budget de 4000€ disponible dès maintenant",
      urgence: "Mon CDI se termine dans 2 mois, c'est maintenant ou jamais",
      experience: "Consultante indépendante depuis 2 ans",
    },
  },
  {
    id: "5",
    nom: "Antoine Bernard",
    date: "2024-01-26",
    heure: "09:00",
    source: "Instagram",
    statut: "annulé",
    score: 2,
    reponses: {
      objectif: "Essayer le coaching un peu",
      chiffre: "Aucun client pour l'instant",
      budget: "Pas sûr d'avoir le budget",
      urgence: "Aucune urgence",
      experience: "Aucune formation",
    },
  },
  {
    id: "6",
    nom: "Camille Rousseau",
    date: "2024-01-28",
    heure: "15:30",
    source: "TikTok",
    statut: "en attente",
    score: 4,
    reponses: {
      objectif: "Passer à 8k€/mois en coaching mindset",
      chiffre: "4 clients à 300€/mois",
      budget: "Prête à investir 4000€ si la valeur est là",
      urgence: "Je veux structurer mon offre avant l'été",
      experience: "Coach certifiée PNL",
    },
  },
];

// ─── Helpers ─────────────────────────────────────────────────
const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  confirmé: { label: "Confirmé", color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock },
  présent: { label: "Présent ✓", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle },
  absent: { label: "No-show", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: AlertCircle },
  annulé: { label: "Annulé", color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
  "en attente": { label: "En attente", color: "#6b7280", bg: "rgba(107,114,128,0.12)", icon: Clock },
};

function ScoreDots({ score }: { score: QualScore }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            background: i <= score
              ? score >= 4 ? "#22c55e" : score === 3 ? "#f59e0b" : "#ef4444"
              : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

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

// ─── Lead row with expandable questionnaire ───────────────────
function LeadRow({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const status = STATUS_CONFIG[lead.statut];
  const StatusIcon = status.icon;

  return (
    <div style={{ border: "1px solid rgba(139,92,246,0.12)", borderRadius: "12px", overflow: "hidden" }}>
      <button
        className="w-full flex items-center gap-4 p-4 transition-all text-left"
        style={{ background: open ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)" }}
        onClick={() => setOpen(!open)}
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}
        >
          <User className="w-4 h-4" style={{ color: "#a855f7" }} />
        </div>

        {/* Name + date */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{lead.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {new Date(lead.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {lead.heure}
          </p>
        </div>

        {/* Source */}
        <span
          className="text-[11px] px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1 flex-shrink-0"
          style={{ background: "rgba(139,92,246,0.1)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(139,92,246,0.15)" }}
        >
          {lead.source}
        </span>

        {/* Score */}
        <div className="hidden md:block flex-shrink-0">
          <ScoreDots score={lead.score} />
        </div>

        {/* Status */}
        <span
          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ background: status.bg, color: status.color }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>

        {/* Chevron */}
        {open ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        )}
      </button>

      {/* Questionnaire */}
      {open && (
        <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              { label: "Objectif", value: lead.reponses.objectif },
              { label: "Situation actuelle", value: lead.reponses.chiffre },
              { label: "Budget disponible", value: lead.reponses.budget },
              { label: "Urgence", value: lead.reponses.urgence },
              { label: "Expérience", value: lead.reponses.experience },
            ].map((q) => (
              <div
                key={q.label}
                className="p-3 rounded-xl"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.08)" }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#a855f7" }}>
                  {q.label}
                </p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{q.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function LeadsPage() {
  const [filter, setFilter] = useState<LeadStatus | "tous">("tous");

  const total = MOCK_LEADS.length;
  const presents = MOCK_LEADS.filter((l) => l.statut === "présent").length;
  const absents = MOCK_LEADS.filter((l) => l.statut === "absent").length;
  const txPresence = total > 0 ? Math.round((presents / total) * 100) : 0;

  const filtered = filter === "tous" ? MOCK_LEADS : MOCK_LEADS.filter((l) => l.statut === filter);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Leads & Réservations
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Appels réservés via cal.com · données mockées
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total leads", value: total, color: "#a855f7", icon: "👤" },
          { label: "Présents", value: presents, color: "#22c55e", icon: "✅" },
          { label: "No-show", value: absents, color: "#f59e0b", icon: "⚠️" },
          { label: "Taux présence", value: `${txPresence}%`, color: "#60a5fa", icon: "📊" },
        ].map((s) => (
          <div key={s.label} className="p-4" style={cardGlow}>
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold mt-2" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["tous", "confirmé", "présent", "absent", "annulé", "en attente"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize"
            style={filter === f ? {
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))",
              border: "1px solid rgba(139,92,246,0.4)",
              color: "rgba(255,255,255,0.9)",
            } : {
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,92,246,0.12)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {f === "tous" ? `Tous (${total})` : f === "présent" ? `Présents (${presents})` : f}
          </button>
        ))}
      </div>

      {/* Leads list */}
      <div className="space-y-2">
        {filtered.map((lead) => (
          <LeadRow key={lead.id} lead={lead} />
        ))}
        {filtered.length === 0 && (
          <div className="p-10 text-center" style={card}>
            <Phone className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Aucun lead dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
}

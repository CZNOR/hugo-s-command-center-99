import { useState } from "react";
import { Edit2, Check, X, Users, Settings, Percent } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type Role = "Fondateur" | "Closer" | "VA" | "Community Manager" | "Coach associé";

interface TeamMember {
  id: string;
  nom: string;
  role: Role;
  emoji: string;
  taches: string[];
  commission?: number; // % pour les closers
  statut: "actif" | "inactif";
  contact?: string;
}

interface BusinessSettings {
  prixProgramme: number;
  objectifLeads: number;
  objectifClosing: number;
  objectifCA: number;
  nomProgramme: string;
}

// ─── Mock data ───────────────────────────────────────────────
const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: "1",
    nom: "Hugo",
    role: "Fondateur",
    emoji: "🚀",
    statut: "actif",
    taches: ["Création contenu", "Stratégie", "Closing principal", "Suivi clients"],
    contact: "@hugo",
  },
  {
    id: "2",
    nom: "Alex Dupont",
    role: "Closer",
    emoji: "📞",
    statut: "actif",
    commission: 15,
    taches: ["Appels de vente", "Suivi leads chauds", "Relances", "Rapport hebdomadaire"],
    contact: "@alex",
  },
  {
    id: "3",
    nom: "Clara Martin",
    role: "VA",
    emoji: "⚡",
    statut: "actif",
    taches: ["Gestion agenda", "Réponses DM", "Publication stories", "Admin Notion"],
    contact: "@clara",
  },
  {
    id: "4",
    nom: "Léa Bernard",
    role: "Community Manager",
    emoji: "🎯",
    statut: "actif",
    taches: ["Montage vidéos TikTok", "Sous-titres", "Publication contenu", "Analytics semaine"],
    contact: "@lea",
  },
];

const INITIAL_SETTINGS: BusinessSettings = {
  prixProgramme: 4000,
  objectifLeads: 30,
  objectifClosing: 40,
  objectifCA: 40000,
  nomProgramme: "Coaching Business High-Ticket",
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

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(139,92,246,0.2)",
  borderRadius: "10px",
  color: "rgba(255,255,255,0.9)",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
};

const ROLE_COLORS: Record<Role, { color: string; bg: string }> = {
  Fondateur: { color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  Closer: { color: "#22c55e", bg: "rgba(34,197,94,0.12)" },
  VA: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  "Community Manager": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Coach associé": { color: "#ec4899", bg: "rgba(236,72,153,0.12)" },
};

// ─── Commission editor ────────────────────────────────────────
interface CommissionEditorProps {
  value: number;
  onChange: (val: number) => void;
}

function CommissionEditor({ value, onChange }: CommissionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const confirm = () => {
    const v = parseFloat(draft);
    if (!isNaN(v) && v >= 0 && v <= 100) onChange(v);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min={0}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") setEditing(false); }}
          style={{ ...inputStyle, width: 60, padding: "4px 8px", fontSize: 13 }}
        />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>%</span>
        <button onClick={confirm} className="p-1 rounded-lg" style={{ color: "#22c55e" }}>
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 rounded-lg" style={{ color: "rgba(255,255,255,0.3)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all"
      style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}
    >
      <Percent className="w-3 h-3" />
      <span className="text-xs font-bold">{value}%</span>
      <Edit2 className="w-3 h-3 opacity-60" />
    </button>
  );
}

// ─── Member card ─────────────────────────────────────────────
interface MemberCardProps {
  member: TeamMember;
  onCommissionChange: (id: string, val: number) => void;
}

function MemberCard({ member, onCommissionChange }: MemberCardProps) {
  const roleStyle = ROLE_COLORS[member.role] || { color: "#6b7280", bg: "rgba(107,114,128,0.12)" };

  return (
    <div className="p-5" style={cardGlow}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: roleStyle.bg }}
        >
          {member.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{member.nom}</p>
            {member.statut === "actif" && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}
              >
                ACTIF
              </span>
            )}
          </div>
          <span
            className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
            style={{ background: roleStyle.bg, color: roleStyle.color }}
          >
            {member.role}
          </span>
          {member.contact && (
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{member.contact}</p>
          )}
        </div>

        {/* Commission for closers */}
        {member.role === "Closer" && member.commission !== undefined && (
          <div className="flex-shrink-0">
            <p className="text-[10px] mb-1 text-right" style={{ color: "rgba(255,255,255,0.4)" }}>Commission</p>
            <CommissionEditor
              value={member.commission}
              onChange={(val) => onCommissionChange(member.id, val)}
            />
          </div>
        )}
      </div>

      {/* Tâches */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
          Responsabilités
        </p>
        <div className="space-y-1.5">
          {member.taches.map((tache, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: roleStyle.color, opacity: 0.7 }} />
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{tache}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Settings section ─────────────────────────────────────────
interface SettingsEditorProps {
  settings: BusinessSettings;
  onChange: (key: keyof BusinessSettings, val: string | number) => void;
}

function SettingsEditor({ settings, onChange }: SettingsEditorProps) {
  const fields: { key: keyof BusinessSettings; label: string; unit?: string; type?: string }[] = [
    { key: "nomProgramme", label: "Nom du programme", type: "text" },
    { key: "prixProgramme", label: "Prix programme", unit: "€" },
    { key: "objectifLeads", label: "Objectif leads/mois", unit: "leads" },
    { key: "objectifClosing", label: "Objectif taux closing", unit: "%" },
    { key: "objectifCA", label: "Objectif CA mensuel", unit: "€" },
  ];

  return (
    <div className="p-5" style={cardGlow}>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4" style={{ color: "#a855f7" }} />
        <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
          Paramètres business
        </h2>
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <label className="text-xs font-medium flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
              {f.label}
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type={f.type || "number"}
                value={String(settings[f.key])}
                onChange={(e) => onChange(f.key, f.type === "text" ? e.target.value : parseFloat(e.target.value) || 0)}
                style={{ ...inputStyle, width: f.type === "text" ? 180 : 100, textAlign: f.type === "text" ? "left" : "right" }}
              />
              {f.unit && <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{f.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function EquipePage() {
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [settings, setSettings] = useState<BusinessSettings>(INITIAL_SETTINGS);

  const handleCommissionChange = (id: string, val: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, commission: val } : m))
    );
  };

  const handleSettingChange = (key: keyof BusinessSettings, val: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const closers = members.filter((m) => m.role === "Closer");
  const avgCommission = closers.length
    ? Math.round(closers.reduce((sum, c) => sum + (c.commission || 0), 0) / closers.length)
    : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Équipe</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Membres, rôles & paramètres business
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Membres actifs", value: members.filter((m) => m.statut === "actif").length, icon: <Users className="w-4 h-4" />, color: "#a855f7" },
          { label: "Closers", value: closers.length, icon: "📞", color: "#22c55e" },
          { label: "Commission moy.", value: `${avgCommission}%`, icon: <Percent className="w-4 h-4" />, color: "#f59e0b" },
          { label: "Prix programme", value: `${settings.prixProgramme.toLocaleString("fr-FR")} €`, icon: "💰", color: "#60a5fa" },
        ].map((s, i) => (
          <div key={i} className="p-4" style={cardGlow}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}18`, color: s.color }}>
              {typeof s.icon === "string" ? <span>{s.icon}</span> : s.icon}
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Team cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
          Membres de l'équipe
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onCommissionChange={handleCommissionChange}
            />
          ))}
        </div>
      </div>

      {/* Business settings */}
      <SettingsEditor settings={settings} onChange={handleSettingChange} />

      {/* Closer commission summary */}
      {closers.length > 0 && (
        <div className="p-5" style={card}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
            Commissions closers · simulation
          </h2>
          <div className="space-y-3">
            {closers.map((c) => {
              const commissionParVente = Math.round((settings.prixProgramme * (c.commission || 0)) / 100);
              return (
                <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <span className="text-xl">{c.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{c.nom}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {c.commission}% · {commissionParVente.toLocaleString("fr-FR")} €/vente
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Si 5 closes</p>
                    <p className="text-sm font-bold" style={{ color: "#4ade80" }}>
                      {(commissionParVente * 5).toLocaleString("fr-FR")} €
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Plus, X, DollarSign, CheckCircle, Clock, AlertCircle } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type EcheanceStatut = "payé" | "en attente" | "en retard";
type NbEcheances = 1 | 3 | 4;

interface Echeance {
  numero: number;
  montant: number;
  statut: EcheanceStatut;
  date: string;
}

interface Client {
  id: string;
  nom: string;
  programme: string;
  montantTotal: number;
  nbEcheances: NbEcheances;
  echeances: Echeance[];
  dateDebut: string;
}

// ─── Mock data ───────────────────────────────────────────────
function buildEcheances(total: number, nb: NbEcheances, startDate: string): Echeance[] {
  const montant = Math.round(total / nb);
  return Array.from({ length: nb }, (_, i) => {
    const d = new Date(startDate + "T12:00:00");
    d.setMonth(d.getMonth() + i);
    const statut: EcheanceStatut =
      i === 0 ? "payé" : i === 1 ? (Math.random() > 0.3 ? "payé" : "en attente") : "en attente";
    return { numero: i + 1, montant, statut, date: d.toISOString().split("T")[0] };
  });
}

const INITIAL_CLIENTS: Client[] = [
  {
    id: "1",
    nom: "Thomas Durand",
    programme: "Coaching Business High-Ticket",
    montantTotal: 4000,
    nbEcheances: 3,
    dateDebut: "2024-01-22",
    echeances: [
      { numero: 1, montant: 1334, statut: "payé", date: "2024-01-22" },
      { numero: 2, montant: 1333, statut: "payé", date: "2024-02-22" },
      { numero: 3, montant: 1333, statut: "en attente", date: "2024-03-22" },
    ],
  },
  {
    id: "2",
    nom: "Sarah Martin",
    programme: "Coaching Business High-Ticket",
    montantTotal: 4000,
    nbEcheances: 4,
    dateDebut: "2024-01-23",
    echeances: [
      { numero: 1, montant: 1000, statut: "payé", date: "2024-01-23" },
      { numero: 2, montant: 1000, statut: "payé", date: "2024-02-23" },
      { numero: 3, montant: 1000, statut: "en retard", date: "2024-03-23" },
      { numero: 4, montant: 1000, statut: "en attente", date: "2024-04-23" },
    ],
  },
  {
    id: "3",
    nom: "Marie Lefevre",
    programme: "Coaching Business High-Ticket",
    montantTotal: 4000,
    nbEcheances: 1,
    dateDebut: "2024-01-25",
    echeances: [
      { numero: 1, montant: 4000, statut: "payé", date: "2024-01-25" },
    ],
  },
  {
    id: "4",
    nom: "Julie Moreau",
    programme: "Coaching Business High-Ticket",
    montantTotal: 4000,
    nbEcheances: 3,
    dateDebut: "2024-01-18",
    echeances: [
      { numero: 1, montant: 1334, statut: "payé", date: "2024-01-18" },
      { numero: 2, montant: 1333, statut: "en attente", date: "2024-02-18" },
      { numero: 3, montant: 1333, statut: "en attente", date: "2024-03-18" },
    ],
  },
  {
    id: "5",
    nom: "Emma Lebrun",
    programme: "Coaching Business High-Ticket",
    montantTotal: 4000,
    nbEcheances: 4,
    dateDebut: "2024-01-08",
    echeances: [
      { numero: 1, montant: 1000, statut: "payé", date: "2024-01-08" },
      { numero: 2, montant: 1000, statut: "payé", date: "2024-02-08" },
      { numero: 3, montant: 1000, statut: "payé", date: "2024-03-08" },
      { numero: 4, montant: 1000, statut: "en attente", date: "2024-04-08" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────
const STATUT_CONFIG: Record<EcheanceStatut, { color: string; bg: string; icon: React.ElementType }> = {
  payé: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: CheckCircle },
  "en attente": { color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock },
  "en retard": { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: AlertCircle },
};

const STATUTS: EcheanceStatut[] = ["payé", "en attente", "en retard"];

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
  width: "100%",
  outline: "none",
};

// ─── Add client modal ─────────────────────────────────────────
interface AddClientModalProps {
  onClose: () => void;
  onAdd: (client: Client) => void;
}

function AddClientModal({ onClose, onAdd }: AddClientModalProps) {
  const [form, setForm] = useState({
    nom: "",
    programme: "Coaching Business High-Ticket",
    montantTotal: "4000",
    nbEcheances: "3" as "1" | "3" | "4",
    dateDebut: new Date().toISOString().split("T")[0],
  });

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    const nb = parseInt(form.nbEcheances) as NbEcheances;
    const client: Client = {
      id: Date.now().toString(),
      nom: form.nom,
      programme: form.programme,
      montantTotal: parseInt(form.montantTotal) || 4000,
      nbEcheances: nb,
      dateDebut: form.dateDebut,
      echeances: buildEcheances(parseInt(form.montantTotal) || 4000, nb, form.dateDebut),
    };
    onAdd(client);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md p-6 space-y-4" style={cardGlow}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Nouveau client</h3>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Nom *</label>
            <input style={inputStyle} value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Prénom Nom" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Programme</label>
            <input style={inputStyle} value={form.programme} onChange={e => setForm(p => ({ ...p, programme: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Montant total (€)</label>
              <input type="number" style={inputStyle} value={form.montantTotal} onChange={e => setForm(p => ({ ...p, montantTotal: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Échéances</label>
              <select
                style={{ ...inputStyle }}
                value={form.nbEcheances}
                onChange={e => setForm(p => ({ ...p, nbEcheances: e.target.value as "1" | "3" | "4" }))}
              >
                <option value="1">1x (comptant)</option>
                <option value="3">3x</option>
                <option value="4">4x</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Date de début</label>
            <input type="date" style={inputStyle} value={form.dateDebut} onChange={e => setForm(p => ({ ...p, dateDebut: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(139,92,246,0.15)" }}
          >
            Annuler
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.nom.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client card ─────────────────────────────────────────────
interface ClientCardProps {
  client: Client;
  onEcheanceChange: (clientId: string, echeanceIdx: number, statut: EcheanceStatut) => void;
  onRemove: (clientId: string) => void;
}

function ClientCard({ client, onEcheanceChange, onRemove }: ClientCardProps) {
  const totalPaye = client.echeances.filter((e) => e.statut === "payé").reduce((sum, e) => sum + e.montant, 0);
  const pct = Math.round((totalPaye / client.montantTotal) * 100);
  const hasRetard = client.echeances.some((e) => e.statut === "en retard");

  return (
    <div className="p-5" style={{ ...cardGlow, borderColor: hasRetard ? "rgba(239,68,68,0.25)" : "rgba(139,92,246,0.15)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{client.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{client.programme}</p>
          {hasRetard && (
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
              <AlertCircle className="w-3 h-3" /> Retard de paiement
            </span>
          )}
        </div>
        <button
          onClick={() => onRemove(client.id)}
          style={{ color: "rgba(255,255,255,0.2)" }}
          className="hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span style={{ color: "rgba(255,255,255,0.45)" }}>
            {totalPaye.toLocaleString("fr-FR")} € / {client.montantTotal.toLocaleString("fr-FR")} €
          </span>
          <span style={{ color: "#a855f7", fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? "#22c55e" : "linear-gradient(90deg, #7c3aed, #a855f7)",
            }}
          />
        </div>
      </div>

      {/* Échéances */}
      <div className="space-y-2">
        {client.echeances.map((ech, idx) => {
          const cfg = STATUT_CONFIG[ech.statut];
          const EchIcon = cfg.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${cfg.color}18` }}
            >
              <EchIcon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Échéance {ech.numero} · {new Date(ech.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {ech.montant.toLocaleString("fr-FR")} €
                </p>
              </div>
              <select
                value={ech.statut}
                onChange={(e) => onEcheanceChange(client.id, idx, e.target.value as EcheanceStatut)}
                className="text-[11px] font-medium px-2 py-1 rounded-lg appearance-none cursor-pointer"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, outline: "none" }}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s} style={{ background: "#0a0519", color: "white" }}>{s}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function PaiementsPage() {
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [showModal, setShowModal] = useState(false);

  const totalCA = clients.reduce((sum, c) => sum + c.montantTotal, 0);
  const totalPaye = clients.reduce((sum, c) => sum + c.echeances.filter((e) => e.statut === "payé").reduce((s, e) => s + e.montant, 0), 0);
  const totalRetard = clients.filter((c) => c.echeances.some((e) => e.statut === "en retard")).length;

  const handleEcheanceChange = (clientId: string, idx: number, statut: EcheanceStatut) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, echeances: c.echeances.map((e, i) => (i === idx ? { ...e, statut } : e)) }
          : c
      )
    );
  };

  const handleAdd = (client: Client) => {
    setClients((prev) => [client, ...prev]);
  };

  const handleRemove = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Paiements</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            Suivi clients & échéances · saisie manuelle
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Clients actifs", value: clients.length, color: "#a855f7", icon: "👤" },
          { label: "CA total signé", value: `${totalCA.toLocaleString("fr-FR")} €`, color: "#f59e0b", icon: "💰" },
          { label: "Encaissé", value: `${totalPaye.toLocaleString("fr-FR")} €`, color: "#22c55e", icon: "✅" },
          { label: "En retard", value: totalRetard, color: totalRetard > 0 ? "#ef4444" : "#22c55e", icon: totalRetard > 0 ? "⚠️" : "✓" },
        ].map((k) => (
          <div key={k.label} className="p-4" style={cardGlow}>
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-bold mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Global progress */}
      <div className="p-4" style={card}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Encaissé total</span>
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {totalCA > 0 ? Math.round((totalPaye / totalCA) * 100) : 0}%
          </span>
        </div>
        <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${totalCA > 0 ? (totalPaye / totalCA) * 100 : 0}%`,
              background: "linear-gradient(90deg, #7c3aed, #a855f7)",
              boxShadow: "0 0 10px rgba(139,92,246,0.4)",
            }}
          />
        </div>
        <p className="text-xs mt-2 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
          {totalPaye.toLocaleString("fr-FR")} € / {totalCA.toLocaleString("fr-FR")} €
        </p>
      </div>

      {/* Client cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onEcheanceChange={handleEcheanceChange}
            onRemove={handleRemove}
          />
        ))}
        {clients.length === 0 && (
          <div className="col-span-2 p-12 text-center" style={card}>
            <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              Aucun client · clique sur "Nouveau client" pour commencer
            </p>
          </div>
        )}
      </div>

      {showModal && <AddClientModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </div>
  );
}

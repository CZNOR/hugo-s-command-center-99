import { useState } from "react";
import { Plus, X, DollarSign, CheckCircle, Clock, AlertCircle, BarChart2, Users } from "lucide-react";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────
type EcheanceStatut = "payé" | "en attente" | "en retard";
type NbEcheances = 1 | 2 | 3 | 4;

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

// ─── Real data ───────────────────────────────────────────────
const INITIAL_CLIENTS: Client[] = [
  { id: "1",  nom: "Ayoub",      programme: "Accompagnement", montantTotal: 2490, nbEcheances: 1, dateDebut: "2025-08-04",
    echeances: [{ numero: 1, montant: 2490, statut: "payé", date: "2025-08-04" }] },
  { id: "4",  nom: "Amèle",      programme: "Accompagnement", montantTotal: 2397, nbEcheances: 1, dateDebut: "2025-08-17",
    echeances: [{ numero: 1, montant: 2397, statut: "payé", date: "2025-08-17" }] },
  { id: "9",  nom: "Yassine",    programme: "Accompagnement", montantTotal: 2397, nbEcheances: 1, dateDebut: "2025-08-27",
    echeances: [{ numero: 1, montant: 2397, statut: "payé", date: "2025-08-27" }] },
  { id: "10", nom: "Shirlie",    programme: "Accompagnement", montantTotal: 2200, nbEcheances: 1, dateDebut: "2025-09-09",
    echeances: [{ numero: 1, montant: 2200, statut: "payé", date: "2025-09-09" }] },
  { id: "11", nom: "Aristote C", programme: "Accompagnement", montantTotal: 3000, nbEcheances: 1, dateDebut: "2025-09-11",
    echeances: [{ numero: 1, montant: 3000, statut: "payé", date: "2025-09-11" }] },
  { id: "12", nom: "Thomas",     programme: "Accompagnement", montantTotal: 3000, nbEcheances: 1, dateDebut: "2025-09-22",
    echeances: [{ numero: 1, montant: 3000, statut: "payé", date: "2025-09-22" }] },
  { id: "14", nom: "Kryz Emile", programme: "Accompagnement", montantTotal: 2999, nbEcheances: 1, dateDebut: "2025-10-10",
    echeances: [{ numero: 1, montant: 2999, statut: "payé", date: "2025-10-10" }] },
  { id: "15", nom: "Flavio",     programme: "Accompagnement", montantTotal: 3500, nbEcheances: 1, dateDebut: "2025-11-25",
    echeances: [{ numero: 1, montant: 3500, statut: "payé", date: "2025-11-25" }] },
  { id: "16", nom: "Lenny",      programme: "Accompagnement", montantTotal: 3500, nbEcheances: 1, dateDebut: "2025-12-16",
    echeances: [{ numero: 1, montant: 3500, statut: "payé", date: "2025-12-16" }] },
];

// ─── Helpers ─────────────────────────────────────────────────
const STATUT_CONFIG: Record<EcheanceStatut, { color: string; bg: string; icon: React.ElementType }> = {
  "payé":       { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   icon: CheckCircle },
  "en attente": { color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock        },
  "en retard":  { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: AlertCircle  },
};
const STATUTS: EcheanceStatut[] = ["payé", "en attente", "en retard"];

function buildEcheances(total: number, nb: NbEcheances, startDate: string): Echeance[] {
  const montant = Math.round(total / nb);
  return Array.from({ length: nb }, (_, i) => {
    const d = new Date(startDate + "T12:00:00");
    d.setMonth(d.getMonth() + i);
    return { numero: i + 1, montant, statut: "en attente" as EcheanceStatut, date: d.toISOString().split("T")[0] };
  });
}

const MONTH_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

function getMonthKey(date: string) {
  const d = new Date(date + "T12:00:00");
  return `${MONTH_FR[d.getMonth()]} ${d.getFullYear()}`;
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

// ─── Monthly view ─────────────────────────────────────────────
function MonthlyView({ clients }: { clients: Client[] }) {
  const byMonth: Record<string, { ca: number; encaisse: number; clients: string[] }> = {};

  for (const c of clients) {
    for (const e of c.echeances) {
      const key = getMonthKey(e.date);
      if (!byMonth[key]) byMonth[key] = { ca: 0, encaisse: 0, clients: [] };
      byMonth[key].ca += e.montant;
      if (e.statut === "payé") byMonth[key].encaisse += e.montant;
      if (!byMonth[key].clients.includes(c.nom)) byMonth[key].clients.push(c.nom);
    }
  }

  // Sort chronologically
  const sorted = Object.entries(byMonth).sort((a, b) => {
    const [ma, ya] = a[0].split(" ");
    const [mb, yb] = b[0].split(" ");
    const da = new Date(`${ya}-${(MONTH_FR.indexOf(ma)+1).toString().padStart(2,"0")}-01`);
    const db = new Date(`${yb}-${(MONTH_FR.indexOf(mb)+1).toString().padStart(2,"0")}-01`);
    return da.getTime() - db.getTime();
  });

  const chartData = sorted.map(([month, d]) => ({
    month,
    encaissé: d.encaisse,
    attendu: d.ca - d.encaisse,
  }));

  const totalCA    = sorted.reduce((s, [, d]) => s + d.ca, 0);
  const totalEnc   = sorted.reduce((s, [, d]) => s + d.encaisse, 0);
  const bestMonth  = sorted.reduce((best, cur) => cur[1].ca > (best?.[1]?.ca ?? 0) ? cur : best, sorted[0]);

  return (
    <div className="space-y-5">
      {/* Monthly summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "CA total signé", value: `${totalCA.toLocaleString("fr-FR")} €`, color: "#f59e0b" },
          { label: "Total encaissé", value: `${totalEnc.toLocaleString("fr-FR")} €`, color: "#22c55e" },
          { label: "Meilleur mois",  value: bestMonth ? `${bestMonth[1].ca.toLocaleString("fr-FR")} €` : "—", color: "#a855f7" },
        ].map(k => (
          <div key={k.label} className="p-4" style={cardGlow}>
            <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="p-5" style={cardGlow}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          CA par mois
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "rgba(10,5,25,0.95)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "10px", color: "rgba(255,255,255,0.9)", fontSize: 12 }}
              cursor={{ fill: "rgba(139,92,246,0.06)" }}
              formatter={(val: number, name: string) => [`${val.toLocaleString("fr-FR")} €`, name]}
            />
            <Bar dataKey="encaissé" stackId="a" fill="#22c55e" fillOpacity={0.8} radius={[0,0,0,0]} />
            <Bar dataKey="attendu"  stackId="a" fill="#a855f7" fillOpacity={0.4} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-end">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#22c55e" }} /> Encaissé
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#a855f7", opacity: 0.5 }} /> Attendu
          </span>
        </div>
      </div>

      {/* Month table */}
      <div className="p-5" style={cardGlow}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Détail par mois</h3>
        <div className="space-y-2">
          {sorted.map(([month, d]) => (
            <div key={month} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(139,92,246,0.08)" }}>
              <div className="w-20 flex-shrink-0">
                <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>{month}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{d.clients.length} client{d.clients.length > 1 ? "s" : ""}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{d.clients.join(", ")}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold" style={{ color: "#22c55e" }}>{d.encaisse.toLocaleString("fr-FR")} €</p>
                {d.ca !== d.encaisse && (
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>/ {d.ca.toLocaleString("fr-FR")} €</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Add client modal ─────────────────────────────────────────
function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Client) => void }) {
  const [form, setForm] = useState({
    nom: "", programme: "Accompagnement", montantTotal: "3000",
    nbEcheances: "1" as "1"|"2"|"3"|"4", dateDebut: new Date().toISOString().split("T")[0],
  });

  const handleAdd = () => {
    if (!form.nom.trim()) return;
    const nb = parseInt(form.nbEcheances) as NbEcheances;
    const client: Client = {
      id: Date.now().toString(), nom: form.nom, programme: form.programme,
      montantTotal: parseInt(form.montantTotal) || 3000, nbEcheances: nb,
      dateDebut: form.dateDebut,
      echeances: buildEcheances(parseInt(form.montantTotal) || 3000, nb, form.dateDebut),
    };
    onAdd(client); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md p-6 space-y-4" style={cardGlow}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Nouveau client</h3>
          <button onClick={onClose} style={{ color: "rgba(255,255,255,0.4)" }}><X className="w-5 h-5" /></button>
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
              <select style={inputStyle} value={form.nbEcheances} onChange={e => setForm(p => ({ ...p, nbEcheances: e.target.value as "1"|"2"|"3"|"4" }))}>
                <option value="1">1x (comptant)</option>
                <option value="2">2x</option>
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
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(139,92,246,0.15)" }}>
            Annuler
          </button>
          <button onClick={handleAdd} disabled={!form.nom.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.4)" }}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Client card ─────────────────────────────────────────────
function ClientCard({ client, onEcheanceChange, onRemove }: {
  client: Client;
  onEcheanceChange: (id: string, idx: number, statut: EcheanceStatut) => void;
  onRemove: (id: string) => void;
}) {
  const totalPaye = client.echeances.filter(e => e.statut === "payé").reduce((s, e) => s + e.montant, 0);
  const pct = Math.round((totalPaye / client.montantTotal) * 100);
  const hasRetard = client.echeances.some(e => e.statut === "en retard");

  return (
    <div className="p-5" style={{ ...cardGlow, borderColor: hasRetard ? "rgba(239,68,68,0.25)" : "rgba(139,92,246,0.15)" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{client.nom}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {client.programme} · {new Date(client.dateDebut + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          {hasRetard && (
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
              <AlertCircle className="w-3 h-3" /> Retard de paiement
            </span>
          )}
        </div>
        <button onClick={() => onRemove(client.id)} style={{ color: "rgba(255,255,255,0.2)" }} className="hover:text-red-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span style={{ color: "rgba(255,255,255,0.45)" }}>{totalPaye.toLocaleString("fr-FR")} € / {client.montantTotal.toLocaleString("fr-FR")} €</span>
          <span style={{ color: pct === 100 ? "#22c55e" : "#a855f7", fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : "linear-gradient(90deg, #7c3aed, #a855f7)" }} />
        </div>
      </div>

      <div className="space-y-2">
        {client.echeances.map((ech, idx) => {
          const cfg = STATUT_CONFIG[ech.statut];
          const EchIcon = cfg.icon;
          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${cfg.color}18` }}>
              <EchIcon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Échéance {ech.numero} · {new Date(ech.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>{ech.montant.toLocaleString("fr-FR")} €</p>
              </div>
              <select value={ech.statut} onChange={e => onEcheanceChange(client.id, idx, e.target.value as EcheanceStatut)}
                className="text-[11px] font-medium px-2 py-1 rounded-lg appearance-none cursor-pointer"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, outline: "none" }}>
                {STATUTS.map(s => <option key={s} value={s} style={{ background: "#0a0519", color: "white" }}>{s}</option>)}
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
  const [view, setView] = useState<"clients" | "monthly">("clients");

  const totalCA    = clients.reduce((s, c) => s + c.montantTotal, 0);
  const totalPaye  = clients.reduce((s, c) => s + c.echeances.filter(e => e.statut === "payé").reduce((a, e) => a + e.montant, 0), 0);
  const totalRetard = clients.filter(c => c.echeances.some(e => e.statut === "en retard")).length;

  const handleEcheanceChange = (clientId: string, idx: number, statut: EcheanceStatut) =>
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, echeances: c.echeances.map((e, i) => i === idx ? { ...e, statut } : e) } : c));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Paiements</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {clients.length} clients · {totalCA.toLocaleString("fr-FR")} € CA total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
            <button onClick={() => setView("clients")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={{ background: view === "clients" ? "rgba(139,92,246,0.25)" : "transparent", color: view === "clients" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}>
              <Users className="w-3.5 h-3.5" /> Clients
            </button>
            <button onClick={() => setView("monthly")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
              style={{ background: view === "monthly" ? "rgba(139,92,246,0.25)" : "transparent", color: view === "monthly" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }}>
              <BarChart2 className="w-3.5 h-3.5" /> Monthly
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "white", boxShadow: "0 0 20px rgba(139,92,246,0.35)" }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau client</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Clients",     value: clients.length,                            color: "#a855f7", icon: "👤" },
          { label: "CA signé",    value: `${totalCA.toLocaleString("fr-FR")} €`,    color: "#f59e0b", icon: "💰" },
          { label: "Encaissé",    value: `${totalPaye.toLocaleString("fr-FR")} €`,  color: "#22c55e", icon: "✅" },
          { label: "En retard",   value: totalRetard,                               color: totalRetard > 0 ? "#ef4444" : "#22c55e", icon: totalRetard > 0 ? "⚠️" : "✓" },
        ].map(k => (
          <div key={k.label} className="p-4" style={cardGlow}>
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-bold mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      <div className="p-4" style={card}>
        <div className="flex items-center justify-between text-xs mb-2">
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Encaissé global</span>
          <span style={{ color: "#a855f7", fontWeight: 600 }}>
            {totalCA > 0 ? Math.round((totalPaye / totalCA) * 100) : 0}%
          </span>
        </div>
        <div className="h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${totalCA > 0 ? (totalPaye / totalCA) * 100 : 0}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)", boxShadow: "0 0 10px rgba(139,92,246,0.4)" }} />
        </div>
        <p className="text-xs mt-2 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
          {totalPaye.toLocaleString("fr-FR")} € / {totalCA.toLocaleString("fr-FR")} €
        </p>
      </div>

      {/* View content */}
      {view === "monthly" ? (
        <MonthlyView clients={clients} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clients.map(client => (
            <ClientCard key={client.id} client={client}
              onEcheanceChange={handleEcheanceChange}
              onRemove={id => setClients(prev => prev.filter(c => c.id !== id))} />
          ))}
          {clients.length === 0 && (
            <div className="col-span-2 p-12 text-center" style={card}>
              <DollarSign className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.15)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Aucun client · clique sur "Nouveau client" pour commencer</p>
            </div>
          )}
        </div>
      )}

      {showModal && <AddClientModal onClose={() => setShowModal(false)} onAdd={c => setClients(prev => [c, ...prev])} />}
    </div>
  );
}

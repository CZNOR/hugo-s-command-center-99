import { useState, ElementType } from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, X, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

// ─── Types ─────────────────────────────────────────────────
type TxCategory = "Revenus coaching" | "Revenus contenu" | "Revenus agence" | "Logiciels" | "Marketing" | "Équipement" | "Charges fixes" | "Autre";

interface Transaction {
  id: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  category: TxCategory;
  date: string;
}

// ─── Mock Data ─────────────────────────────────────────────
const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: "1", label: "Coaching Lucas Bernard - Mars", amount: 800, type: "income", category: "Revenus coaching", date: "2026-03-01" },
  { id: "2", label: "Coaching Emma Rousseau - Mars", amount: 450, type: "income", category: "Revenus coaching", date: "2026-03-01" },
  { id: "3", label: "Coaching Thomas Laurent - Onboarding", amount: 1200, type: "income", category: "Revenus coaching", date: "2026-03-15" },
  { id: "4", label: "Contenu sponsorisé Instagram", amount: 600, type: "income", category: "Revenus contenu", date: "2026-03-10" },
  { id: "5", label: "Prestation Made Solution - Client A", amount: 3200, type: "income", category: "Revenus agence", date: "2026-03-05" },
  { id: "6", label: "Prestation Made Solution - Client B", amount: 1800, type: "income", category: "Revenus agence", date: "2026-03-20" },
  { id: "7", label: "Adobe Creative Cloud", amount: 62, type: "expense", category: "Logiciels", date: "2026-03-01" },
  { id: "8", label: "Notion + Supabase", amount: 28, type: "expense", category: "Logiciels", date: "2026-03-01" },
  { id: "9", label: "Publicité Meta Ads", amount: 350, type: "expense", category: "Marketing", date: "2026-03-12" },
  { id: "10", label: "Microphone Shure SM7B", amount: 399, type: "expense", category: "Équipement", date: "2026-03-08" },
  { id: "11", label: "Loyer bureau partagé", amount: 280, type: "expense", category: "Charges fixes", date: "2026-03-01" },
  { id: "12", label: "Assurance pro", amount: 85, type: "expense", category: "Charges fixes", date: "2026-03-01" },
  { id: "13", label: "Coaching - Février", amount: 2100, type: "income", category: "Revenus coaching", date: "2026-02-28" },
  { id: "14", label: "Agence - Février", amount: 4200, type: "income", category: "Revenus agence", date: "2026-02-28" },
  { id: "15", label: "Charges fixes - Février", amount: 720, type: "expense", category: "Charges fixes", date: "2026-02-28" },
  { id: "16", label: "Logiciels - Février", amount: 180, type: "expense", category: "Logiciels", date: "2026-02-28" },
  { id: "17", label: "Coaching - Janvier", amount: 1600, type: "income", category: "Revenus coaching", date: "2026-01-31" },
  { id: "18", label: "Agence - Janvier", amount: 3800, type: "income", category: "Revenus agence", date: "2026-01-31" },
  { id: "19", label: "Charges fixes - Janvier", amount: 720, type: "expense", category: "Charges fixes", date: "2026-01-31" },
];

const CATEGORY_COLORS: Record<TxCategory, string> = {
  "Revenus coaching": "#a855f7",
  "Revenus contenu": "#6366f1",
  "Revenus agence": "#10b981",
  "Logiciels": "#f59e0b",
  "Marketing": "#ef4444",
  "Équipement": "#ec4899",
  "Charges fixes": "#64748b",
  "Autre": "#94a3b8",
};

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const CATEGORIES: TxCategory[] = ["Revenus coaching", "Revenus contenu", "Revenus agence", "Logiciels", "Marketing", "Équipement", "Charges fixes", "Autre"];

// ─── Mini bar chart ─────────────────────────────────────────
function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-32 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 100 }}>
            <div className="flex-1 rounded-t-sm transition-all duration-500" style={{ height: `${(d.income / maxVal) * 100}%`, background: "linear-gradient(180deg, #a855f7, #7c3aed)", minHeight: d.income > 0 ? 4 : 0 }} />
            <div className="flex-1 rounded-t-sm transition-all duration-500" style={{ height: `${(d.expense / maxVal) * 100}%`, background: "linear-gradient(180deg, #f87171, #ef4444)", minHeight: d.expense > 0 ? 4 : 0 }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: ElementType; color: string; trend?: "up" | "down";
}) {
  return (
    <div className="glass-card p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {trend && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend === "up" ? "text-green-500" : "text-red-400"}`}>
            {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

// ─── Transaction Modal ──────────────────────────────────────
function TransactionModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (tx: Transaction) => void }) {
  const [form, setForm] = useState({ label: "", amount: "", type: "income" as "income" | "expense", category: "Revenus coaching" as TxCategory, date: new Date().toISOString().slice(0, 10) });

  const handleSubmit = () => {
    if (!form.label.trim() || !form.amount || Number(form.amount) <= 0) return;
    onConfirm({
      id: Date.now().toString(),
      label: form.label,
      amount: Number(form.amount),
      type: form.type,
      category: form.category,
      date: form.date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-card w-full max-w-lg p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Nouvelle transaction</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/30 transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Libellé *</label>
            <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Description de la transaction" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Montant (€) *</label>
              <input value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} type="number" min="1" placeholder="0" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as "income" | "expense" }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="income">Revenu</option>
                <option value="expense">Dépense</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Catégorie</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as TxCategory }))} className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} type="date" className="w-full px-3 py-2.5 rounded-xl bg-white/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground bg-white/40 border border-border hover:bg-white/60 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={!form.label.trim() || !form.amount || Number(form.amount) <= 0} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">Confirmer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function FinancesPage() {
  const { activeBusiness } = useBusiness();
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const marchTx = transactions.filter(t => t.date.startsWith("2026-03"));
  const totalIncome = marchTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = marchTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const margin = totalIncome - totalExpense;
  const marginPct = totalIncome > 0 ? Math.round((margin / totalIncome) * 100) : 0;

  const chartData = [1, 2, 3].map(m => {
    const month = `2026-0${m}`;
    const inc = transactions.filter(t => t.date.startsWith(month) && t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter(t => t.date.startsWith(month) && t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { label: MONTHS[m - 1], income: inc, expense: exp };
  });

  const categoryBreakdown = Object.entries(
    marchTx.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const filteredTx = marchTx.filter(t => filter === "all" || t.type === filter);

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finances</h1>
          <p className="text-sm text-muted-foreground mt-1">Suivi des revenus et dépenses — Mars 2026</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Plus size={16} />
          Nouvelle transaction
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Revenus" value={`${totalIncome.toLocaleString()} €`} icon={TrendingUp} color="#10b981" trend="up" sub="Mars 2026" />
        <KpiCard label="Dépenses" value={`${totalExpense.toLocaleString()} €`} icon={TrendingDown} color="#ef4444" trend="down" sub="Mars 2026" />
        <KpiCard label="Marge nette" value={`${margin.toLocaleString()} €`} icon={Wallet} color="#a855f7" sub={`${marginPct}% de marge`} />
        <KpiCard label="Transactions" value={`${marchTx.length}`} icon={CreditCard} color="#6366f1" sub="ce mois" />
      </div>

      {/* Chart + Categories */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Évolution trimestrielle</h3>
          <BarChart data={chartData} />
          <div className="flex items-center justify-center gap-6 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#a855f7" }} /> Revenus</span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "#ef4444" }} /> Dépenses</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Répartition par catégorie</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(([cat, amount]) => {
              const pct = Math.round((amount / marchTx.reduce((s, t) => s + t.amount, 0)) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat as TxCategory] || "#94a3b8" }} />
                  <span className="text-sm text-foreground flex-1 truncate">{cat}</span>
                  <span className="text-sm font-semibold text-foreground">{amount.toLocaleString()} €</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Transactions — Mars 2026</h3>
          <div className="flex gap-1">
            {(["all", "income", "expense"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "Tout" : f === "income" ? "Revenus" : "Dépenses"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          {filteredTx.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune transaction</p>
          )}
          {filteredTx.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/30 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${CATEGORY_COLORS[tx.category]}18` }}>
                {tx.type === "income" ? <ArrowUpRight size={14} style={{ color: CATEGORY_COLORS[tx.category] }} /> : <ArrowDownRight size={14} style={{ color: CATEGORY_COLORS[tx.category] }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.label}</p>
                <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600" : "text-red-400"}`}>
                {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString()} €
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && <TransactionModal onClose={() => setShowModal(false)} onConfirm={addTransaction} />}
    </div>
  );
}

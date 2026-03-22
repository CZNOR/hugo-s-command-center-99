import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, PieChart, Plus, X, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
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
  // Février
  { id: "13", label: "Coaching - Février", amount: 2100, type: "income", category: "Revenus coaching", date: "2026-02-28" },
  { id: "14", label: "Agence - Février", amount: 4200, type: "income", category: "Revenus agence", date: "2026-02-28" },
  { id: "15", label: "Charges fixes - Février", amount: 720, type: "expense", category: "Charges fixes", date: "2026-02-28" },
  { id: "16", label: "Logiciels - Février", amount: 180, type: "expense", category: "Logiciels", date: "2026-02-28" },
  // Janvier
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

// ─── Mini bar chart ─────────────────────────────────────────
function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]));
  return (
    <div className="flex items-end justify-between gap-2 h-32 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 100 }}>
            <div
              className="flex-1 rounded-t-sm transition-all duration-500"
              style={{
                height: `${(d.income / maxVal) * 100}%`,
                background: "linear-gradient(180deg, #a855f7, #7c3aed)",
                minHeight: d.income > 0 ? 4 : 0,
              }}
            />
            <div
              className="flex-1 rounded-t-sm transition-all duration-500"
              style={{
                height: `${(d.expense / maxVal) * 100}%`,
                background: "linear-gradient(180deg, #ef4444, #b91c1c)",
                opacity: 0.7,
                minHeight: d.expense > 0 ? 4 : 0,
              }}
            />
          </div>
          <span className="text-xs text-white/30">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart (pure CSS/SVG) ─────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap = circ - dash;
          const seg_offset = offset;
          offset += dash;
          return (
            <circle
              key={i}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-seg_offset + circ / 4}
              style={{ transition: "all 0.5s ease" }}
            />
          );
        })}
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
          {segments.length}
        </text>
        <text x="50" y="58" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7">
          catégories
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.slice(0, 5).map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-white/60 flex-1">{seg.label}</span>
            <span className="text-xs font-mono font-bold" style={{ color: seg.color }}>
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down";
}) {
  return (
    <div className="violet-card p-5 animate-scale-in">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-xs mb-1 ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          </div>
        )}
      </div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Add Transaction Modal ──────────────────────────────────
function AddTxModal({ onClose, onAdd }: { onClose: () => void; onAdd: (tx: Transaction) => void }) {
  const [form, setForm] = useState({ label: "", amount: "", type: "income" as "income" | "expense", category: "Revenus coaching" as TxCategory, date: new Date().toISOString().slice(0, 10) });

  const INCOME_CATS: TxCategory[] = ["Revenus coaching", "Revenus contenu", "Revenus agence"];
  const EXPENSE_CATS: TxCategory[] = ["Logiciels", "Marketing", "Équipement", "Charges fixes", "Autre"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 animate-scale-in" style={{ background: "rgba(15,8,30,0.95)", border: "1px solid rgba(124,58,237,0.4)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Nouvelle transaction</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Income / Expense toggle */}
        <div className="flex gap-2 mb-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          {(["income", "expense"] as const).map(t => (
            <button key={t} onClick={() => setForm(p => ({ ...p, type: t, category: t === "income" ? "Revenus coaching" : "Logiciels" }))}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={form.type === t
                ? { background: t === "income" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "linear-gradient(135deg, #b91c1c, #ef4444)", color: "#fff" }
                : { color: "rgba(255,255,255,0.4)" }
              }>
              {t === "income" ? "💰 Revenu" : "💸 Dépense"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Description</label>
            <input value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Coaching Mars..."
              className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Montant (€)</label>
              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="500"
                className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", colorScheme: "dark" }} />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Catégorie</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as TxCategory }))}
              className="w-full px-3 py-2 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl text-sm text-white/60" style={{ background: "rgba(255,255,255,0.06)" }}>Annuler</button>
          <button onClick={() => {
            if (!form.label || !form.amount) return;
            onAdd({ id: Date.now().toString(), label: form.label, amount: Number(form.amount), type: form.type, category: form.category, date: form.date });
            onClose();
          }} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: form.type === "income" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "linear-gradient(135deg, #b91c1c, #ef4444)" }}>
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [showAddTx, setShowAddTx] = useState(false);
  const [activeMonth, setActiveMonth] = useState("Mar");
  const { activeBusiness } = useBusiness();

  const addTx = (tx: Transaction) => setTransactions(prev => [...prev, tx]);

  // Mars transactions
  const marsTx = transactions.filter(t => t.date.startsWith("2026-03"));
  const marsRevenu = marsTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const marsDepenses = marsTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const marsProfit = marsRevenu - marsDepenses;

  // Yearly totals
  const allIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Monthly chart data (last 3 months)
  const chartData = [
    {
      label: "Jan",
      income: transactions.filter(t => t.date.startsWith("2026-01") && t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date.startsWith("2026-01") && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    },
    {
      label: "Fév",
      income: transactions.filter(t => t.date.startsWith("2026-02") && t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: transactions.filter(t => t.date.startsWith("2026-02") && t.type === "expense").reduce((s, t) => s + t.amount, 0),
    },
    {
      label: "Mar",
      income: marsRevenu,
      expense: marsDepenses,
    },
  ];

  // Expense breakdown for donut
  const expenseByCategory = Object.entries(
    marsTx.filter(t => t.type === "expense").reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label as TxCategory] || "#94a3b8" }))
   .sort((a, b) => b.value - a.value);

  // Income breakdown for donut
  const incomeByCategory = Object.entries(
    marsTx.filter(t => t.type === "income").reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([label, value]) => ({ label, value, color: CATEGORY_COLORS[label as TxCategory] || "#a855f7" }))
   .sort((a, b) => b.value - a.value);

  // Recent transactions (sorted by date desc)
  const recentTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

  return (
    <div className="page-enter space-y-6">
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <KpiCard label="Revenus Mars" value={`${marsRevenu.toLocaleString("fr-FR")}€`} sub="Ce mois-ci" icon={TrendingUp} color="#a855f7" trend="up" />
        <KpiCard label="Dépenses Mars" value={`${marsDepenses.toLocaleString("fr-FR")}€`} sub="Charges + investissements" icon={TrendingDown} color="#ef4444" trend="down" />
        <KpiCard label="Profit net Mars" value={`${marsProfit.toLocaleString("fr-FR")}€`} sub={`Marge ${((marsProfit / marsRevenu) * 100).toFixed(0)}%`} icon={DollarSign} color={marsProfit > 0 ? "#10b981" : "#ef4444"} trend={marsProfit > 0 ? "up" : "down"} />
        <KpiCard label="Total 2026" value={`${(allIncome - allExpenses).toLocaleString("fr-FR")}€`} sub={`${allIncome.toLocaleString("fr-FR")}€ revenus`} icon={Wallet} color="#f59e0b" trend="up" />
      </div>

      {/* ── Charts row ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="violet-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Évolution mensuelle</h3>
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#a855f7" }} /> Revenus</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#ef4444", opacity: 0.7 }} /> Dépenses</span>
            </div>
          </div>
          <BarChart data={chartData} />
        </div>

        {/* Expense breakdown */}
        <div className="violet-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Répartition dépenses — Mars</h3>
          {expenseByCategory.length > 0
            ? <DonutChart segments={expenseByCategory} />
            : <div className="text-sm text-white/30 text-center py-8">Aucune dépense ce mois</div>
          }
        </div>
      </div>

      {/* ── Income sources ── */}
      <div className="violet-card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Sources de revenus — Mars</h3>
        <div className="space-y-2">
          {incomeByCategory.map((cat, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <span className="text-sm text-white/70 flex-1">{cat.label}</span>
              <div className="flex-1 max-w-32 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(cat.value / marsRevenu) * 100}%`, background: cat.color }} />
              </div>
              <span className="text-sm font-mono font-bold text-white w-20 text-right">{cat.value.toLocaleString("fr-FR")}€</span>
              <span className="text-xs text-white/30 w-10 text-right">{((cat.value / marsRevenu) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Transactions ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Transactions récentes</h2>
          <button onClick={() => setShowAddTx(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        <div className="space-y-1.5 stagger-children">
          {recentTx.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
            >
              {/* Type icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: tx.type === "income" ? "rgba(168,85,247,0.15)" : "rgba(239,68,68,0.12)" }}>
                {tx.type === "income"
                  ? <ArrowUpRight className="w-4 h-4" style={{ color: "#a855f7" }} />
                  : <ArrowDownRight className="w-4 h-4" style={{ color: "#f87171" }} />
                }
              </div>

              {/* Label + category */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{tx.label}</div>
                <div className="text-xs" style={{ color: CATEGORY_COLORS[tx.category] || "#94a3b8" }}>{tx.category}</div>
              </div>

              {/* Date */}
              <span className="text-xs text-white/30 hidden sm:block">
                {new Date(tx.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </span>

              {/* Amount */}
              <span className={`text-sm font-mono font-bold ${tx.type === "income" ? "text-purple-400" : "text-red-400"}`}>
                {tx.type === "income" ? "+" : "-"}{tx.amount.toLocaleString("fr-FR")}€
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showAddTx && <AddTxModal onClose={() => setShowAddTx(false)} onAdd={addTx} />}
    </div>
  );
}

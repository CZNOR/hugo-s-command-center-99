import { useState, ElementType } from "react";
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

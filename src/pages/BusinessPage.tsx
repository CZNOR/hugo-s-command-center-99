import { TrendingUp, DollarSign, Handshake, BarChart3, Plus, ArrowUpRight, Layers } from "lucide-react";
import { useBusiness, BUSINESSES } from "@/lib/businessContext";
import type { Deal } from "@/lib/mock-data";

// Données vides — à connecter Supabase
const deals: Deal[] = [];

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  gradient: string;
  glow: string;
  featured?: boolean;
}

function MetricCard({ icon, label, value, sub, accent, gradient, glow, featured }: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]"
      style={{
        background: featured ? gradient : "rgba(255,255,255,0.04)",
        border: `1px solid ${featured ? "transparent" : "rgba(255,255,255,0.07)"}`,
        boxShadow: featured ? `0 8px 32px ${glow}` : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: featured ? "rgba(255,255,255,0.2)" : `${accent}20` }}
        >
          <div style={{ color: featured ? "#fff" : accent }}>{icon}</div>
        </div>
        <ArrowUpRight className="w-4 h-4 opacity-30" style={{ color: featured ? "#fff" : accent }} />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: featured ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)" }}>
          {label}
        </p>
        <p className="text-2xl font-bold mt-0.5" style={{ color: featured ? "#fff" : "rgba(255,255,255,0.9)" }}>
          {value}
        </p>
        {sub && (
          <p className="text-xs mt-0.5" style={{ color: featured ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)" }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function DealPipelineEmpty({ accent, gradient, glow }: { accent: string; gradient: string; glow: string }) {
  return (
    <div
      className="rounded-2xl p-8 flex flex-col items-center gap-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
    >
      <Handshake className="w-8 h-8 text-white/15" />
      <p className="text-white/35 text-sm">Aucun deal en cours</p>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: gradient, boxShadow: `0 4px 12px ${glow}` }}
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter un deal
      </button>
    </div>
  );
}

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "rgba(255,255,255,0.25)" },
  { id: "qualified", label: "Qualifié", color: "#06B6D4" },
  { id: "proposal", label: "Proposition", color: "#8B5CF6" },
  { id: "negotiation", label: "Négo", color: "#F59E0B" },
  { id: "won", label: "Gagné", color: "#10B981" },
];

export default function BusinessPage() {
  const { activeBusiness } = useBusiness();
  const businessDeals = deals.filter(d => d.business_id === activeBusiness.id);

  const totalPipeline = businessDeals.reduce((acc, d) => acc + d.value, 0);
  const wonDeals = businessDeals.filter(d => d.stage === "won");
  const wonValue = wonDeals.reduce((acc, d) => acc + d.value, 0);

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k€` : `${n}€`;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Business header */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${activeBusiness.accent}15, transparent)`,
          border: `1px solid ${activeBusiness.accent}30`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: activeBusiness.gradient, boxShadow: `0 4px 16px ${activeBusiness.glow}` }}
          >
            {activeBusiness.emoji}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white/90">{activeBusiness.label}</h1>
            <p className="text-sm text-white/40 mt-0.5">Vue d'ensemble · Mars 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Business switcher compact */}
          {BUSINESSES.filter(b => !b.disabled).map(b => (
            <div
              key={b.id}
              className="text-lg p-2 rounded-xl transition-all"
              style={{
                background: b.id === activeBusiness.id ? `${b.accent}25` : "rgba(255,255,255,0.04)",
                opacity: b.id === activeBusiness.id ? 1 : 0.5,
              }}
            >
              {b.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<DollarSign className="w-4 h-4" />}
          label="CA du mois"
          value="—"
          sub="Aucune donnée"
          accent={activeBusiness.accent}
          gradient={activeBusiness.gradient}
          glow={activeBusiness.glow}
          featured
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="MRR"
          value="—"
          sub="Récurrent mensuel"
          accent={activeBusiness.accent}
          gradient={activeBusiness.gradient}
          glow={activeBusiness.glow}
        />
        <MetricCard
          icon={<Handshake className="w-4 h-4" />}
          label="Deals actifs"
          value={businessDeals.filter(d => d.stage !== "won" && d.stage !== "lost").length.toString() || "0"}
          sub="En cours"
          accent={activeBusiness.accent}
          gradient={activeBusiness.gradient}
          glow={activeBusiness.glow}
        />
        <MetricCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Pipeline"
          value={totalPipeline > 0 ? fmt(totalPipeline) : "—"}
          sub="Valeur totale"
          accent={activeBusiness.accent}
          gradient={activeBusiness.gradient}
          glow={activeBusiness.glow}
        />
      </div>

      {/* Pipeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" style={{ color: activeBusiness.accent }} />
            <h2 className="text-sm font-semibold text-white/80">Pipeline deals</h2>
          </div>
          <button
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Deal
          </button>
        </div>

        {businessDeals.length === 0 ? (
          <DealPipelineEmpty
            accent={activeBusiness.accent}
            gradient={activeBusiness.gradient}
            glow={activeBusiness.glow}
          />
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {PIPELINE_STAGES.map(stage => {
              const stageDeal = businessDeals.filter(d => d.stage === stage.id);
              return (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: stage.color }}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-white/30">{stageDeal.length}</span>
                  </div>
                  <div className="space-y-1.5 min-h-[80px]">
                    {stageDeal.map(deal => (
                      <div
                        key={deal.id}
                        className="rounded-xl p-2.5 cursor-pointer hover:scale-[1.02] transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <p className="text-xs font-medium text-white/80 leading-tight truncate">{deal.title}</p>
                        <p className="text-[10px] text-white/35 mt-0.5">{deal.client}</p>
                        <p className="text-xs font-bold mt-1.5" style={{ color: stage.color }}>
                          {fmt(deal.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

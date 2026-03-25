import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";

const ACCENT = "#00cc44";

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, ...style }}>
      {children}
    </div>
  );
}

const stats = [
  { label: "Total dépôts", value: "14 800 €", delta: "+3 200 €", icon: DollarSign, color: "#00cc44" },
  { label: "CPA validés", value: "9", delta: "+2 ce mois", icon: CheckCircle, color: "#22c55e" },
  { label: "CPA en attente", value: "3", delta: "en cours", icon: Clock, color: "#f59e0b" },
  { label: "CPA refusés", value: "1", delta: "ce mois", icon: XCircle, color: "#ef4444" },
];

const transactions = [
  { id: "TXN-0041", player: "Joueur #41", amount: "500 €", cpa: "120 €", status: "validé", date: "2026-03-20" },
  { id: "TXN-0039", player: "Joueur #39", amount: "1 200 €", cpa: "120 €", status: "validé", date: "2026-03-18" },
  { id: "TXN-0037", player: "Joueur #37", amount: "200 €", cpa: "0 €", status: "en attente", date: "2026-03-17" },
  { id: "TXN-0035", player: "Joueur #35", amount: "800 €", cpa: "120 €", status: "validé", date: "2026-03-14" },
  { id: "TXN-0033", player: "Joueur #33", amount: "150 €", cpa: "0 €", status: "refusé", date: "2026-03-10" },
  { id: "TXN-0031", player: "Joueur #31", amount: "2 500 €", cpa: "120 €", status: "validé", date: "2026-03-08" },
];

const statusStyle: Record<string, { color: string; bg: string }> = {
  "validé":      { color: "#00cc44", bg: "rgba(0,204,68,0.12)" },
  "en attente":  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "refusé":      { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export default function CasinoDepotsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ACCENT }}>Dépôts & CPA</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Suivi des dépôts joueurs et commissions CPA</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
              <s.icon style={{ width: 15, height: 15, color: s.color }} />
            </div>
            <div className="text-xl font-bold" style={{ color: "#fff" }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: s.color }}>{s.delta}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>Transactions récentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["ID", "Joueur", "Dépôt", "CPA", "Statut", "Date"].map(h => (
                  <th key={h} className="text-left pb-3 pr-4 text-xs font-medium" style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="py-3 pr-4 font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.id}</td>
                  <td className="py-3 pr-4" style={{ color: "rgba(255,255,255,0.7)" }}>{t.player}</td>
                  <td className="py-3 pr-4 font-semibold" style={{ color: "#fff" }}>{t.amount}</td>
                  <td className="py-3 pr-4 font-semibold" style={{ color: ACCENT }}>{t.cpa}</td>
                  <td className="py-3 pr-4">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ color: statusStyle[t.status].color, background: statusStyle[t.status].bg }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 text-xs font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { usePrivacy } from "@/lib/privacyContext";

// ─── Types ───────────────────────────────────────────────────
interface Vente {
  id: string;
  date: string;
  prestation: string;
  client: string;
  montant: number;
  paiement: string;
  livraison: string;
}

type ViewMode = "chrono" | "client";

// ─── Data (CSV Notion — Hugo + CM non-assignés + retainer 2026) ─
// Total: 29 436€ — 40 ventes
const VENTES: Vente[] = [
  { id: "MADE-388", date: "2025-12-04", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "En cours" },
  { id: "MADE-377", date: "2025-11-30", prestation: "Créa x1", client: "Sofiane", montant: 40, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-387", date: "2025-11-30", prestation: "Crea novembre", client: "Alexandre Senek", montant: 145, paiement: "En attente", livraison: "Terminé" },
  { id: "MADE-385", date: "2025-11-23", prestation: "PDF keynote x7", client: "sabri bk", montant: 380, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-384", date: "2025-11-20", prestation: "Créatives x6", client: "sabri bk", montant: 240, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-383", date: "2025-11-12", prestation: "Vente de société", client: "Angello", montant: 1500, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-380", date: "2025-11-08", prestation: "Logo", client: "Alexandre Senek", montant: 220, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-378", date: "2025-11-07", prestation: "2 créa", client: "sabri bk", montant: 76, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-379", date: "2025-11-07", prestation: "Site testing", client: "Dimitry santiago", montant: 390, paiement: "Acompte Payé", livraison: "Terminé" },
  { id: "MADE-375", date: "2025-10-22", prestation: "Bannière", client: "sabri bk", montant: 110, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-376", date: "2025-10-21", prestation: "Pack logo", client: "Alexandre Senek", montant: 220, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-374", date: "2025-10-19", prestation: "4 Packaging", client: "ines", montant: 590, paiement: "Payer", livraison: "En attente" },
  { id: "MADE-373", date: "2025-10-18", prestation: "10 créatives statics", client: "sabri bk", montant: 390, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-371", date: "2025-10-15", prestation: "Flyer", client: "Alexandre Senek", montant: 120, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-372", date: "2025-10-13", prestation: "Pack logo", client: "Alexandre Senek", montant: 220, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-360", date: "2025-08-24", prestation: "Refonte Logo", client: "Alexandre Senek", montant: 50, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-361", date: "2025-08-22", prestation: "GIF x14", client: "Alexandre Senek", montant: 75, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-359", date: "2025-08-21", prestation: "PDF x2", client: "Alexandre Senek", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-353", date: "2025-08-17", prestation: "Miniature Youtube", client: "Alexandre Senek", montant: 50, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-354", date: "2025-08-17", prestation: "Batch story avis client x14/sem", client: "Alexandre Senek", montant: 100, paiement: "Payer", livraison: "En cours" },
  { id: "MADE-352", date: "2025-08-15", prestation: "Bannière académie trading", client: "Alexandre Senek", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-351", date: "2025-08-01", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-233", date: "2025-07-15", prestation: "Recherche produit + brandé", client: "Geneviève", montant: 390, paiement: "Acompte Payé", livraison: "Terminé" },
  { id: "MADE-239", date: "2025-07-01", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-240", date: "2025-07-01", prestation: "Site Premium + Brand", client: "Aymane", montant: 2190, paiement: "Acompte Payé", livraison: "En cours" },
  { id: "MADE-247", date: "2025-06-04", prestation: "Site webflow", client: "Guilan", montant: 2000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-248", date: "2025-06-02", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-253", date: "2025-06-02", prestation: "Accompagnement", client: "Lilo", montant: 1490, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-255", date: "2025-06-02", prestation: "6 créatives", client: "Alexandre Senek", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-259", date: "2025-05-13", prestation: "Logo x2 DA", client: "Bryan Ecom", montant: 350, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-260", date: "2025-05-06", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-292", date: "2025-03-01", prestation: "CM Tradamax IT/FR", client: "Alexandre Senek", montant: 1200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-311", date: "2025-02-07", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-318", date: "2025-01-13", prestation: "CM Tradamax IT", client: "Alexandre Senek", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-320", date: "2025-01-13", prestation: "CM Tradamax FR", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-321", date: "2025-01-01", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  // ── Retainer fixe 2026 — Alexandre Senek (1 700 €/mois) ──
  { id: "RET-2026-01", date: "2026-01-01", prestation: "Retainer mensuel", client: "Alexandre Senek", montant: 1700, paiement: "Payer", livraison: "Terminé" },
  { id: "RET-2026-02", date: "2026-02-01", prestation: "Retainer mensuel", client: "Alexandre Senek", montant: 1700, paiement: "Payer", livraison: "Terminé" },
  { id: "RET-2026-03", date: "2026-03-01", prestation: "Retainer mensuel", client: "Alexandre Senek", montant: 1700, paiement: "Payer", livraison: "Terminé" },
  { id: "RET-2026-04", date: "2026-04-01", prestation: "Retainer mensuel", client: "Alexandre Senek", montant: 1700, paiement: "En attente", livraison: "En cours" },
];

const NET_HUGO  = VENTES.reduce((s, v) => s + v.montant, 0); // part Hugo (Hugo + CM non-assignés + retainer)
const TOTAL_CA  = 42_223 + 6_800; // CA global agence tous associés (43 723€ CSV -1500€ Angello + 6 800€ retainers 2026)

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(34,211,238,0.12)",
  borderRadius: "16px",
};
const cardGlow: React.CSSProperties = {
  ...card,
  boxShadow: "0 0 30px rgba(34,211,238,0.06)",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function livraisonBadge(l: string) {
  if (l === "Terminé")    return { color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (l === "En cours")   return { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" };
  if (l === "En attente") return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
}

function paiementBadge(p: string) {
  if (p === "Payer")         return { color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (p === "Acompte Payé")  return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  if (p === "En attente")    return { color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  return { color: "#6b7280", bg: "rgba(107,114,128,0.1)" };
}

// ─── Vente row ────────────────────────────────────────────────
function VenteRow({ v }: { v: Vente }) {
  const liv  = livraisonBadge(v.livraison);
  const pay  = paiementBadge(v.paiement);
  const { hidden } = usePrivacy();
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(34,211,238,0.07)" }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{v.prestation}</p>
          <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{v.id}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          {v.client} · {fmtDate(v.date)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:inline-flex"
          style={{ background: liv.bg, color: liv.color }}>{v.livraison}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full hidden md:inline-flex"
          style={{ background: pay.bg, color: pay.color }}>{v.paiement}</span>
        <span className="text-sm font-bold tabular-nums" style={{
          color: "#22d3ee",
          filter: hidden ? "blur(8px)" : "none",
          transition: "filter 0.25s ease",
          userSelect: hidden ? "none" : "auto",
          display: "inline-block",
        }}>
          {v.montant.toLocaleString("fr-FR")} €
        </span>
      </div>
    </div>
  );
}

// ─── Client group ─────────────────────────────────────────────
function ClientGroup({ client, ventes }: { client: string; ventes: Vente[] }) {
  const [open, setOpen] = useState(false);
  const total = ventes.reduce((s, v) => s + v.montant, 0);
  return (
    <div style={{ border: "1px solid rgba(34,211,238,0.12)", borderRadius: "14px", overflow: "hidden" }}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left transition-all"
        style={{ background: open ? "rgba(34,211,238,0.05)" : "rgba(255,255,255,0.02)" }}
        onClick={() => setOpen(!open)}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)" }}>
          <Building2 className="w-4 h-4" style={{ color: "#22d3ee" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{client}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
            {ventes.length} prestation{ventes.length > 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-base font-bold tabular-nums mr-2" style={{ color: "#22d3ee" }}>
          {total.toLocaleString("fr-FR")} €
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: "1px solid rgba(34,211,238,0.08)" }}>
          <div className="h-2" />
          {ventes.map(v => <VenteRow key={v.id} v={v} />)}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function AgencePage() {
  const [search,  setSearch]  = useState("");
  const [view,    setView]    = useState<ViewMode>("chrono");
  const { hidden } = usePrivacy();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return VENTES;
    return VENTES.filter(v =>
      v.client.toLowerCase().includes(q) ||
      v.prestation.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q)
    );
  }, [search]);

  // Group by client
  const byClient = useMemo(() => {
    const map: Record<string, Vente[]> = {};
    for (const v of filtered) {
      if (!map[v.client]) map[v.client] = [];
      map[v.client].push(v);
    }
    return Object.entries(map)
      .sort((a, b) => b[1].reduce((s, v) => s + v.montant, 0) - a[1].reduce((s, v) => s + v.montant, 0));
  }, [filtered]);

  const filteredTotal = filtered.reduce((s, v) => s + v.montant, 0);
  const uniqueClients = new Set(filtered.map(v => v.client)).size;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Agence</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
          Prestations de services · {VENTES.length} ventes · 2025
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4"
        style={{ filter: hidden ? "blur(10px)" : "none", transition: "filter 0.25s ease", userSelect: hidden ? "none" : "auto" }}>
        {/* CA card — shows global + net Hugo */}
        <div className="p-4" style={cardGlow}>
          <span className="text-xl">💰</span>
          <p className="text-2xl font-bold mt-2" style={{ color: "#22d3ee" }}>{TOTAL_CA.toLocaleString("fr-FR")} €</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>CA global agence</p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#4ade80" }}>net Hugo ≈ {NET_HUGO.toLocaleString("fr-FR")} €</p>
        </div>
        {[
          { label: "Ventes (Hugo)",   value: String(VENTES.length),                    color: "#a855f7", icon: "📦" },
          { label: "Clients uniques", value: String(new Set(VENTES.map(v => v.client)).size), color: "#4ade80", icon: "👤" },
        ].map(k => (
          <div key={k.label} className="p-4" style={cardGlow}>
            <span className="text-xl">{k.icon}</span>
            <p className="text-2xl font-bold mt-2" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search + view toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par client, prestation…"
            style={{
              width: "100%", paddingLeft: 36, padding: "8px 14px 8px 36px",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,211,238,0.12)",
              borderRadius: 10, fontSize: 13, color: "rgba(255,255,255,0.8)", outline: "none",
            }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(34,211,238,0.1)", width: "fit-content" }}>
          {(["chrono", "client"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={view === v ? {
                background: "rgba(34,211,238,0.15)",
                color: "#22d3ee", border: "1px solid rgba(34,211,238,0.25)",
              } : {
                color: "rgba(255,255,255,0.4)", border: "1px solid transparent",
              }}>
              {v === "chrono" ? "Chronologique" : "Par client"}
            </button>
          ))}
        </div>
      </div>

      {search && (
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""} · {filteredTotal.toLocaleString("fr-FR")} € · {uniqueClients} client{uniqueClients > 1 ? "s" : ""}
        </p>
      )}

      {/* List */}
      {view === "chrono" ? (
        <div className="space-y-2">
          {filtered.map(v => <VenteRow key={v.id} v={v} />)}
          {filtered.length === 0 && (
            <div className="p-10 text-center" style={card}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Aucun résultat</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {byClient.map(([client, ventes]) => (
            <ClientGroup key={client} client={client} ventes={ventes} />
          ))}
          {byClient.length === 0 && (
            <div className="p-10 text-center" style={card}>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Aucun résultat</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

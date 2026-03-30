import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Building2 } from "lucide-react";

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

// ─── Data (CSV Notion — Hugo + non-assigné) ───────────────────
// Total: 43 723€ — 103 ventes
const VENTES: Vente[] = [
  { id: "MADE-388", date: "2025-12-04", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "En cours" },
  { id: "MADE-377", date: "2025-11-30", prestation: "Créa x1", client: "Sofiane", montant: 40, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-387", date: "2025-11-30", prestation: "Crea novembre", client: "Alexandre Senek", montant: 145, paiement: "En attente", livraison: "Terminé" },
  { id: "MADE-385", date: "2025-11-23", prestation: "PDF keynote x7", client: "sabri bk", montant: 380, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-384", date: "2025-11-20", prestation: "Créatives x6", client: "sabri bk", montant: 240, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-383", date: "2025-11-12", prestation: "Vente de société", client: "Angello", montant: 3000, paiement: "Payer", livraison: "Terminé" },
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
  { id: "MADE-261", date: "2025-05-09", prestation: "Site testing", client: "Yildiz Mustafa", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-260", date: "2025-05-06", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-263", date: "2025-04-30", prestation: "Site testing", client: "Brenda", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-264", date: "2025-04-30", prestation: "Site brandé", client: "Lorenzo Pozzo", montant: 390, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-265", date: "2025-04-23", prestation: "Site premium", client: "Luka Metral", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-266", date: "2025-04-23", prestation: "Site brandé", client: "Ashley", montant: 197, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-268", date: "2025-04-23", prestation: "189 pages PDF Formation", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-267", date: "2025-04-22", prestation: "Site webflow", client: "Nicolas Poisson", montant: 550, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-269", date: "2025-04-21", prestation: "Site brandé", client: "Yanis Ecom", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-270", date: "2025-04-10", prestation: "Site brandé", client: "Yanis Ecom", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-271", date: "2025-04-10", prestation: "Site brandé", client: "Damien Dams", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-272", date: "2025-04-10", prestation: "Site brandé", client: "Ébru", montant: 390, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-273", date: "2025-04-10", prestation: "Site Premium", client: "Bryan Ecom", montant: 1690, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-274", date: "2025-04-10", prestation: "Site Premium", client: "CA Capital", montant: 490, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-275", date: "2025-04-10", prestation: "Site brandé", client: "Yanis Ecom", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-276", date: "2025-04-07", prestation: "Site brandé", client: "Farid", montant: 390, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-277", date: "2025-03-26", prestation: "Site testing", client: "Sarah", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-280", date: "2025-03-21", prestation: "Site Premium", client: "Aymeric", montant: 490, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-279", date: "2025-03-17", prestation: "Site testing", client: "Leo", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-281", date: "2025-03-17", prestation: "Site Premium", client: "CA Capital", montant: 590, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-282", date: "2025-03-17", prestation: "Site Premium", client: "CA Capital", montant: 590, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-283", date: "2025-03-17", prestation: "Page Produit", client: "Yanis Ecom", montant: 35, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-284", date: "2025-03-17", prestation: "Site brandé", client: "Vico", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-285", date: "2025-03-17", prestation: "Site brandé", client: "Damien Dams", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-286", date: "2025-03-17", prestation: "Site brandé", client: "Kamao", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-287", date: "2025-03-14", prestation: "Site testing", client: "Alexis", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-278", date: "2025-03-01", prestation: "E-book", client: "Alexandre Senek", montant: 350, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-290", date: "2025-03-01", prestation: "Charte graphique", client: "Alexandre Senek", montant: 350, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-291", date: "2025-03-01", prestation: "LOGO", client: "Alexandre Senek", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-292", date: "2025-03-01", prestation: "CM Tradamax IT/FR", client: "Alexandre Senek", montant: 1200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-294", date: "2025-02-26", prestation: "Site testing", client: "Dydou", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-295", date: "2025-02-26", prestation: "Site testing", client: "Eric Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-293", date: "2025-02-22", prestation: "Site testing", client: "Taltal", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-296", date: "2025-02-22", prestation: "Site testing", client: "Sami", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-298", date: "2025-02-19", prestation: "Refonte", client: "Arabian Musc", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-300", date: "2025-02-13", prestation: "Site brandé", client: "Mr. Freken", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-301", date: "2025-02-13", prestation: "Site brandé", client: "James Kirmizigul", montant: 250, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-302", date: "2025-02-11", prestation: "Site testing", client: "Eric Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-303", date: "2025-02-11", prestation: "Site testing", client: "Eric Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-304", date: "2025-02-11", prestation: "Site testing", client: "Eric Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-305", date: "2025-02-11", prestation: "Site testing", client: "Eric Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-306", date: "2025-02-08", prestation: "Traduction Site", client: "Jefferson", montant: 80, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-307", date: "2025-02-08", prestation: "Site brandé", client: "Yanis Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-308", date: "2025-02-08", prestation: "Charte graphique", client: "Media Magma LLC", montant: 290, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-309", date: "2025-02-08", prestation: "Site Premium", client: "Media Magma LLC", montant: 890, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-310", date: "2025-02-07", prestation: "Site testing", client: "Benjamin Klotz", montant: 315, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-311", date: "2025-02-07", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-312", date: "2025-02-06", prestation: "Media buying", client: "Sofien K", montant: 990, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-313", date: "2025-02-02", prestation: "Site testing", client: "Elviro", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-314", date: "2025-02-02", prestation: "Site testing", client: "Elviro", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-315", date: "2025-02-02", prestation: "Site testing", client: "Keldi Nayann", montant: 100, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-316", date: "2025-01-14", prestation: "Site testing", client: "Yanis Ecom", montant: 150, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-317", date: "2025-01-14", prestation: "Site testing", client: "Yanis Ecom", montant: 80, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-319", date: "2025-01-14", prestation: "Site brandé", client: "Noé", montant: 300, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-322", date: "2025-01-14", prestation: "Site testing", client: "Yanis Ecom", montant: 80, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-318", date: "2025-01-13", prestation: "CM Tradamax IT", client: "Alexandre Senek", montant: 200, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-320", date: "2025-01-13", prestation: "CM Tradamax FR", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-323", date: "2025-01-12", prestation: "Site testing", client: "Eric Ecom", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-324", date: "2025-01-12", prestation: "Site testing", client: "Eric Ecom", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-326", date: "2025-01-12", prestation: "4x Page Produit", client: "Hawa", montant: 250, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-327", date: "2025-01-11", prestation: "Site testing 4 produits", client: "Donovan", montant: 350, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-325", date: "2025-01-09", prestation: "Pack 10x Créatives", client: "Lamia Medjen", montant: 600, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-329", date: "2025-01-09", prestation: "Site testing", client: "Yanis Ecom", montant: 80, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-328", date: "2025-01-06", prestation: "2x Charte Graphique", client: "Bryan Ecom", montant: 990, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-330", date: "2025-01-06", prestation: "Site testing", client: "Victoria", montant: 330, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-332", date: "2025-01-05", prestation: "3x Page Produit", client: "Hawa", montant: 210, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-331", date: "2025-01-03", prestation: "Site testing", client: "Léa", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-333", date: "2025-01-03", prestation: "Site testing", client: "Damien Dams", montant: 120, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-334", date: "2025-01-03", prestation: "Site testing", client: "EcomShip", montant: 190, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-336", date: "2025-01-02", prestation: "Page produit", client: "Sergen", montant: 80, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-15",  date: "2025-01-01", prestation: "Site brandé", client: "Lucie", montant: 390, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-321", date: "2025-01-01", prestation: "CM Billio", client: "Alexandre Senek", montant: 1000, paiement: "Payer", livraison: "Terminé" },
  { id: "MADE-335", date: "2025-01-01", prestation: "Site testing", client: "Damien Dams", montant: 100, paiement: "Payer", livraison: "Terminé" },
];

const TOTAL_CA = VENTES.reduce((s, v) => s + v.montant, 0);

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
        <span className="text-sm font-bold tabular-nums" style={{ color: "#22d3ee" }}>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "CA total agence", value: TOTAL_CA.toLocaleString("fr-FR") + " €", color: "#22d3ee", icon: "💰" },
          { label: "Ventes",          value: String(VENTES.length),                    color: "#a855f7", icon: "📦" },
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

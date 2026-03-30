import { useState } from "react";
import { Mail, MapPin, Calendar, DollarSign, BookOpen, Trophy, ChevronDown, ChevronUp, Search } from "lucide-react";
import { useCoachingStats } from "@/lib/coachingStats";

// ─── Types ───────────────────────────────────────────────────
type ClientType = "ht" | "premium" | "agence";

interface ClientHT {
  type: "ht";
  id: string;
  nom: string;
  programme: string;
  montant: number;
  dateDebut: string;
}

interface ClientPremium {
  type: "premium";
  id: string;
  nom: string;
  email: string;
  joinDate: string;
  lastActive: string;
  location: string;
  actif30j: boolean;
  ltv: number; // mois × 97€
  posts: number;
  activityScore: number;
}

interface ClientAgence {
  type: "agence";
  id: string;
  nom: string;
  ca: number;      // total encaissé (part Hugo)
  projets: number; // nb transactions
  derniere: string; // date dernière vente
}

type Client = ClientHT | ClientPremium | ClientAgence;

// ─── Data agence ─────────────────────────────────────────────
// CA = part Hugo uniquement (VENTES Notion, triés par CA desc)
const CLIENTS_AGENCE: ClientAgence[] = [
  { type: "agence", id: "ag1",  nom: "Alexandre Senek",  ca: 16_100, projets: 25, derniere: "2026-04-01" },
  { type: "agence", id: "ag2",  nom: "Angello",          ca: 1_500,  projets: 1,  derniere: "2025-11-12" },
  { type: "agence", id: "ag3",  nom: "Aymane",           ca: 2_190,  projets: 1,  derniere: "2025-07-01" },
  { type: "agence", id: "ag4",  nom: "Guilan",           ca: 2_000,  projets: 1,  derniere: "2025-06-04" },
  { type: "agence", id: "ag5",  nom: "Lilo",             ca: 1_490,  projets: 1,  derniere: "2025-06-02" },
  { type: "agence", id: "ag6",  nom: "sabri bk",         ca: 1_196,  projets: 5,  derniere: "2025-11-30" },
  { type: "agence", id: "ag7",  nom: "Ines",             ca: 590,    projets: 1,  derniere: "2025-10-19" },
  { type: "agence", id: "ag8",  nom: "Dimitry Santiago", ca: 195,    projets: 1,  derniere: "2025-11-07" },
  { type: "agence", id: "ag9",  nom: "Geneviève",        ca: 195,    projets: 1,  derniere: "2025-07-15" },
  { type: "agence", id: "ag10", nom: "Bryan Ecom",       ca: 350,    projets: 1,  derniere: "2025-05-13" },
  { type: "agence", id: "ag11", nom: "Luka Metral",      ca: 500,    projets: 1,  derniere: "2025-04-23" },
  { type: "agence", id: "ag12", nom: "Sofiane",          ca: 40,     projets: 1,  derniere: "2025-11-30" },
];

// ─── Data ────────────────────────────────────────────────────
const CLIENTS: Client[] = [
  // ── Coaching HT (9) ──
  { type: "ht", id: "ht1",  nom: "Ayoub",       programme: "Accompagnement HT", montant: 2490, dateDebut: "2025-08-04" },
  { type: "ht", id: "ht2",  nom: "Amèle",        programme: "Accompagnement HT", montant: 2397, dateDebut: "2025-08-17" },
  { type: "ht", id: "ht3",  nom: "Yassine",      programme: "Accompagnement HT", montant: 2397, dateDebut: "2025-08-27" },
  { type: "ht", id: "ht4",  nom: "Shirlie",      programme: "Accompagnement HT", montant: 2200, dateDebut: "2025-09-09" },
  { type: "ht", id: "ht5",  nom: "Aristote C",   programme: "Accompagnement HT", montant: 3000, dateDebut: "2025-09-11" },
  { type: "ht", id: "ht6",  nom: "Thomas",       programme: "Accompagnement HT", montant: 3000, dateDebut: "2025-09-22" },
  { type: "ht", id: "ht7",  nom: "Kryz Emile",   programme: "Accompagnement HT", montant: 2999, dateDebut: "2025-10-10" },
  { type: "ht", id: "ht8",  nom: "Flavio",       programme: "Accompagnement HT", montant: 3500, dateDebut: "2025-11-25" },
  { type: "ht", id: "ht9",  nom: "Lenny",        programme: "Accompagnement HT", montant: 3500, dateDebut: "2025-12-16" },

  // ── Académie Premium payants (16) — Oct–Déc 25, LTV max 3 mois = 291€ ──
  // Exclus : Amèle + Kryzz (coaching Elite, accès gratuit), Tom + Said (non comptés)
  { type: "premium", id: "ac1",  nom: "Sheyma",          email: "sheymaelqoqui27@gmail.com",   joinDate: "2025-08-05", lastActive: "2026-03-22", location: "France", actif30j: true,  ltv: 291, posts: 0, activityScore: 1.97 },
  { type: "premium", id: "ac2",  nom: "Ali",             email: "tarfa_ali@hotmail.com",        joinDate: "2025-08-05", lastActive: "2025-12-11", location: "France", actif30j: false, ltv: 291, posts: 1, activityScore: 0 },
  { type: "premium", id: "ac4",  nom: "Geneviève",       email: "queen9.tg@gmail.com",          joinDate: "2025-08-05", lastActive: "2025-09-11", location: "France", actif30j: false, ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac5",  nom: "Hugo Pottier",    email: "hugo.pottier.1161@gmail.com",  joinDate: "2025-08-05", lastActive: "2026-03-16", location: "France", actif30j: true,  ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac6",  nom: "Rizk",            email: "rizk.sarouphim@gmail.com",     joinDate: "2025-08-05", lastActive: "2025-12-30", location: "Canada", actif30j: false, ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac7",  nom: "Reda",            email: "reda-2008@gmx.fr",             joinDate: "2025-08-05", lastActive: "2026-02-05", location: "France", actif30j: false, ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac8",  nom: "Samy",            email: "premiumoui@gmail.com",         joinDate: "2025-08-06", lastActive: "2025-12-07", location: "France", actif30j: false, ltv: 291, posts: 1, activityScore: 0 },
  { type: "premium", id: "ac9",  nom: "Ainoussa",        email: "ainoussa_boumed@yahoo.fr",     joinDate: "2025-08-06", lastActive: "2026-03-14", location: "Canada", actif30j: true,  ltv: 291, posts: 1, activityScore: 0 },
  { type: "premium", id: "ac10", nom: "Rachid",          email: "rachid.amlouka89@gmail.com",   joinDate: "2025-08-06", lastActive: "2026-02-02", location: "France", actif30j: false, ltv: 291, posts: 3, activityScore: 0 },
  { type: "premium", id: "ac11", nom: "Chahine",         email: "booggiestyle@hotmail.com",     joinDate: "2025-08-08", lastActive: "2026-03-19", location: "France", actif30j: true,  ltv: 291, posts: 3, activityScore: 5 },
  { type: "premium", id: "ac12", nom: "Antoine",         email: "antoine.vyc@hotmail.com",      joinDate: "2025-08-09", lastActive: "2026-02-02", location: "France", actif30j: false, ltv: 291, posts: 3, activityScore: 0 },
  { type: "premium", id: "ac14", nom: "Manu",            email: "salemdcom@gmail.com",          joinDate: "2025-08-12", lastActive: "2025-11-23", location: "Israel", actif30j: false, ltv: 291, posts: 2, activityScore: 0 },
  { type: "premium", id: "ac15", nom: "Karine",          email: "shourock@yahoo.fr",            joinDate: "2025-08-13", lastActive: "2025-11-28", location: "France", actif30j: false, ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac16", nom: "Ashley",          email: "bondeliashley@gmail.com",      joinDate: "2025-08-24", lastActive: "2025-10-18", location: "",       actif30j: false, ltv: 291, posts: 1, activityScore: 0 },
  { type: "premium", id: "ac17", nom: "Ahmed Ibrahim",   email: "aibhraim01@gmail.com",         joinDate: "2025-09-14", lastActive: "2025-10-20", location: "France", actif30j: false, ltv: 291, posts: 0, activityScore: 0 },
  { type: "premium", id: "ac19", nom: "Dimitry Santiago",email: "dimitrymeric@gmail.com",       joinDate: "2025-11-06", lastActive: "2025-12-04", location: "France", actif30j: false, ltv: 194, posts: 0, activityScore: 0 },
];

const MONTH_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
function fmtDate(d: string) {
  const dt = new Date(d + "T12:00:00");
  return `${dt.getDate()} ${MONTH_FR[dt.getMonth()]} ${dt.getFullYear()}`;
}

// ─── Styles ──────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
};

// ─── Client Card HT ──────────────────────────────────────────
function CardHT({ c }: { c: ClientHT }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, borderColor: "rgba(168,85,247,0.2)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#fff",
        }}>
          {c.nom[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>{c.nom}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>{c.programme} · {fmtDate(c.dateDebut)}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ color: "#a855f7", fontWeight: 700, fontSize: 15 }}>{c.montant.toLocaleString("fr-FR")} €</p>
          <p style={{ color: "rgba(34,197,94,0.8)", fontSize: 11, marginTop: 2 }}>✓ payé</p>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 0 }}>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { icon: DollarSign, label: "Montant", value: `${c.montant.toLocaleString("fr-FR")} €` },
              { icon: Calendar,   label: "Début",   value: fmtDate(c.dateDebut) },
              { icon: Trophy,     label: "Produit",  value: c.programme },
              { icon: BookOpen,   label: "Statut",   value: "Terminé · Payé" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(168,85,247,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon style={{ width: 13, height: 13, color: "#a855f7" }} />
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{item.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Card Premium ──────────────────────────────────────
function CardPremium({ c }: { c: ClientPremium }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, borderColor: "rgba(99,102,241,0.2)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #4338ca, #6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#fff",
        }}>
          {c.nom[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>{c.nom}</p>
            {c.actif30j && (
              <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(34,197,94,0.15)", color: "#4ade80", borderRadius: 4, padding: "2px 5px" }}>ACTIF</span>
            )}
          </div>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Premium · {fmtDate(c.joinDate)}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ color: "#818cf8", fontWeight: 700, fontSize: 15 }}>{c.ltv.toLocaleString("fr-FR")} €</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>LTV</p>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { icon: Mail,     label: "Email",        value: c.email },
              { icon: MapPin,   label: "Localisation", value: c.location || "—" },
              { icon: Calendar, label: "Rejoint",       value: fmtDate(c.joinDate) },
              { icon: Calendar, label: "Vu pour la dernière fois", value: fmtDate(c.lastActive) },
              { icon: DollarSign, label: "LTV (97€/mois)", value: `${c.ltv} €` },
              { icon: BookOpen,  label: "Posts Circle",  value: String(c.posts) },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon style={{ width: 13, height: 13, color: "#818cf8" }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{item.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Client Card Agence ───────────────────────────────────────
function CardAgence({ c }: { c: ClientAgence }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ ...card, borderColor: "rgba(34,211,238,0.2)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #0891b2, #22d3ee)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "#fff",
        }}>
          {c.nom[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: 14 }}>{c.nom}</p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            Agence · {c.projets} projet{c.projets > 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ color: "#22d3ee", fontWeight: 700, fontSize: 15 }}>{c.ca.toLocaleString("fr-FR")} €</p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>CA total</p>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
        }
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { icon: DollarSign, label: "CA encaissé", value: `${c.ca.toLocaleString("fr-FR")} €` },
              { icon: BookOpen,   label: "Projets",     value: String(c.projets) },
              { icon: Calendar,   label: "Dernière vente", value: fmtDate(c.derniere) },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,211,238,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <item.icon style={{ width: 13, height: 13, color: "#22d3ee" }} />
                </div>
                <div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{item.label}</p>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600 }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────
type Filter = "tous" | "ht" | "premium" | "agence";

export default function ClientsPage() {
  const [filter, setFilter] = useState<Filter>("tous");
  const [search, setSearch] = useState("");
  const { stats } = useCoachingStats();

  const htClients  = CLIENTS.filter(c => c.type === "ht") as ClientHT[];
  const premClients = CLIENTS.filter(c => c.type === "premium") as ClientPremium[];
  const caHT       = htClients.reduce((s, c) => s + c.montant, 0);
  const caAcademie = stats.academieCA; // CA réel encaissé (Oct–Déc 25)
  const caAgence   = stats.agenceNetHugo;

  const allClients = [...CLIENTS, ...CLIENTS_AGENCE];

  const filtered = allClients.filter(c => {
    if (filter === "ht"      && c.type !== "ht")      return false;
    if (filter === "premium" && c.type !== "premium")  return false;
    if (filter === "agence"  && c.type !== "agence")   return false;
    const nom = c.nom.toLowerCase();
    const q = search.toLowerCase();
    if (q && !nom.includes(q) && !(c.type === "premium" && c.email.toLowerCase().includes(q))) return false;
    return true;
  });

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "tous",    label: "Tous",          count: allClients.length },
    { key: "ht",      label: "Coaching HT",   count: htClients.length },
    { key: "premium", label: "Académie",       count: premClients.length },
    { key: "agence",  label: "Agence",         count: CLIENTS_AGENCE.length },
  ];

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Clients</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{allClients.length} clients · tous produits confondus</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "CA Coaching HT", value: caHT.toLocaleString("fr-FR") + " €",       color: "#a855f7", sub: `${htClients.length} clients` },
          { label: "CA Académie",    value: caAcademie.toLocaleString("fr-FR") + " €",  color: "#818cf8", sub: "Oct–Déc 25" },
          { label: "CA Agence",      value: caAgence.toLocaleString("fr-FR") + " €",    color: "#22d3ee", sub: `${CLIENTS_AGENCE.length} clients` },
          { label: "Total encaissé", value: (caHT + caAcademie + caAgence).toLocaleString("fr-FR") + " €", color: "#4ade80", sub: `${allClients.length} clients` },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client…"
          style={{
            width: "100%", padding: "10px 12px 10px 36px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
            color: "rgba(255,255,255,0.9)", fontSize: 13, outline: "none",
          }}
        />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === f.key ? "rgba(168,85,247,0.25)" : "rgba(255,255,255,0.05)",
              color: filter === f.key ? "#d8b4fe" : "rgba(255,255,255,0.45)",
              border: filter === f.key ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.15s ease",
            }}
          >
            {f.label} · {f.count}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "32px 0", fontSize: 13 }}>Aucun client trouvé</p>
        )}
        {filtered.map(c =>
          c.type === "ht"      ? <CardHT      key={c.id} c={c as ClientHT} />      :
          c.type === "premium" ? <CardPremium key={c.id} c={c as ClientPremium} /> :
                                 <CardAgence  key={c.id} c={c as ClientAgence} />
        )}
      </div>

    </div>
  );
}

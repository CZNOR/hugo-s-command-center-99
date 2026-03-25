import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Calendar, CheckSquare, LayoutDashboard, TrendingUp,
  Phone, Mic, DollarSign, Edit2, Users, Settings, Flame, Link2, Check,
} from "lucide-react";
import { useBusiness, type BusinessId } from "@/lib/businessContext";
import { gamificationProfile } from "@/lib/mock-data";

const AFFILIATE_URL = "https://track.coolaffs.com/visit/?bta=37391&brand=corgibet";

// ─── Types ───────────────────────────────────────────────────
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  affiliate?: true; // special: copy affiliate link instead of navigate
}

// ─── Navigation config ────────────────────────────────────────
const TOP_ITEMS: NavItem[] = [
  { path: "/",       label: "Command Center", icon: LayoutDashboard },
  { path: "/agenda", label: "Agenda",         icon: Calendar        },
  { path: "/tasks",  label: "Tâches",         icon: CheckSquare     },
];

const COACHING_ITEMS: NavItem[] = [
  { path: "/coaching",           label: "Dashboard",       icon: LayoutDashboard },
  { path: "/coaching/social",    label: "Réseaux sociaux", icon: TrendingUp      },
  { path: "/coaching/leads",     label: "Leads",           icon: Phone           },
  { path: "/coaching/appels",    label: "Appels",          icon: Mic             },
  { path: "/coaching/paiements", label: "Paiements",       icon: DollarSign      },
  { path: "/content",            label: "Contenu",         icon: Edit2           },
];

const CASINO_ITEMS: NavItem[] = [
  { path: "/casino",        label: "Dashboard Casino", icon: LayoutDashboard },
  { path: "/casino/social", label: "Réseaux sociaux",  icon: TrendingUp      },
  { path: "__affiliate__",  label: "Lien affiliation", icon: Link2, affiliate: true },
  { path: "/content",       label: "Contenu",          icon: Edit2           },
];

const BOTTOM_ITEMS: NavItem[] = [
  { path: "/coaching/equipe", label: "Équipe",     icon: Users    },
  { path: "/settings",        label: "Paramètres", icon: Settings },
];

// ─── Style constants ──────────────────────────────────────────
const COACHING_ACCENT   = "#7c3aed";
const COACHING_ACTIVE_BG = "rgba(139,92,246,0.15)";
const CASINO_ACCENT     = "#00cc44";
const CASINO_ACTIVE_BG  = "rgba(0,204,68,0.15)";

// ─── Affiliate nav item ───────────────────────────────────────
function AffiliateNavItem({ accentColor }: { accentColor: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(AFFILIATE_URL); }
    catch {
      const el = document.createElement("textarea");
      el.value = AFFILIATE_URL;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-150"
      style={{
        color: copied ? accentColor : "rgba(255,255,255,0.4)",
        borderLeft: copied ? `2px solid ${accentColor}` : "2px solid transparent",
        paddingLeft: 10,
        background: copied ? `${accentColor}12` : "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
      onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {copied
        ? <Check style={{ width: 16, height: 16, flexShrink: 0, color: accentColor }} />
        : <Link2 style={{ width: 16, height: 16, flexShrink: 0, color: "rgba(255,255,255,0.4)" }} />
      }
      <span className="font-medium">{copied ? "Lien copié !" : "Lien affiliation"}</span>
    </button>
  );
}

// ─── Nav link ─────────────────────────────────────────────────
function NavLink({
  item, accentColor, activeBg, onClick,
}: {
  item: NavItem;
  accentColor: string;
  activeBg: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const active =
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  return (
    <Link
      to={item.path}
      onClick={onClick}
      className="flex items-center gap-3 py-2 rounded-lg text-sm transition-all duration-150"
      style={
        active
          ? {
              background: activeBg,
              color: "rgba(255,255,255,0.9)",
              borderLeft: `2px solid ${accentColor}`,
              paddingLeft: 10,
            }
          : {
              color: "rgba(255,255,255,0.4)",
              borderLeft: "2px solid transparent",
              paddingLeft: 10,
            }
      }
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <item.icon style={{ width: 16, height: 16, flexShrink: 0, color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)" }} />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

// ─── Separator ────────────────────────────────────────────────
function Sep() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />;
}

// ─── Props ───────────────────────────────────────────────────
interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Main sidebar ─────────────────────────────────────────────
export default function AppSidebar({ open, onClose }: AppSidebarProps) {
  const { activeBusiness, setActiveBusiness } = useBusiness();
  const g = gamificationProfile;
  const isCoaching  = activeBusiness.id === "coaching";
  const accentColor = isCoaching ? COACHING_ACCENT : CASINO_ACCENT;
  const activeBg    = isCoaching ? COACHING_ACTIVE_BG : CASINO_ACTIVE_BG;
  const contextItems = isCoaching ? COACHING_ITEMS : CASINO_ITEMS;
  const xpPct = (g.total_xp / g.xp_for_next_level) * 100;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: 220,
          top: 56,
          height: "calc(100vh - 56px)",
          background: "#08080f",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* ── Scroll zone ── */}
        <div className="flex-1 overflow-y-auto px-3 pt-3 space-y-0.5">

          {/* TOP: always visible */}
          {TOP_ITEMS.map(item => (
            <NavLink key={item.path} item={item} accentColor={accentColor} activeBg={activeBg} onClick={onClose} />
          ))}

          <Sep />

          {/* BUSINESS SWITCHER */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setActiveBusiness("coaching" as BusinessId)}
              className="flex-1 py-2 text-xs font-bold tracking-wide transition-all duration-150"
              style={
                isCoaching
                  ? { background: COACHING_ACCENT, color: "#fff" }
                  : { background: "transparent", color: COACHING_ACCENT }
              }
            >
              COACHING
            </button>
            <button
              onClick={() => setActiveBusiness("casino" as BusinessId)}
              className="flex-1 py-2 text-xs font-bold tracking-wide transition-all duration-150"
              style={
                !isCoaching
                  ? { background: CASINO_ACCENT, color: "#000" }
                  : { background: "transparent", color: CASINO_ACCENT }
              }
            >
              CASINO
            </button>
          </div>

          <Sep />

          {/* CONTEXTUAL MENU */}
          <div className="space-y-0.5">
            {contextItems.map(item =>
              item.affiliate
                ? <AffiliateNavItem key={item.path} accentColor={accentColor} />
                : <NavLink key={item.path} item={item} accentColor={accentColor} activeBg={activeBg} onClick={onClose} />
            )}
          </div>

        </div>

        {/* ── BOTTOM: always visible ── */}
        <div className="px-3 pb-4">
          <Sep />

          {BOTTOM_ITEMS.map(item => (
            <NavLink key={item.path} item={item} accentColor={accentColor} activeBg={activeBg} onClick={onClose} />
          ))}

          <Sep />

          {/* XP bar */}
          <div className="px-1 pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span
                  className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                  style={{ background: "rgba(139,92,246,0.2)", color: "#a855f7" }}
                >
                  Lv.{g.level}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)" }}>{g.level_title}</span>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3" style={{ color: "#f97316" }} />
                <span className="font-mono font-semibold text-[11px]" style={{ color: "#f97316" }}>{g.current_streak}j</span>
              </div>
            </div>
            <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)" }}
              />
            </div>
            <p className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              {g.total_xp.toLocaleString()} / {g.xp_for_next_level.toLocaleString()} XP
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

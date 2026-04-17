import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { Plus, LayoutDashboard, CheckSquare, Calendar, Menu, Eye, EyeOff, Flame } from "lucide-react";
import AppSidebar from "./AppSidebar";
import StarField from "../StarField";
import RippleCanvas from "../RippleCanvas";
import PageTransition from "../PageTransition";
// Three.js is heavy (~80 KB gzipped); only pull it in when the overlay is actually shown.
const BizTransitionOverlay = lazy(() => import("../BizTransitionOverlay"));
import WelcomeIntro from "../WelcomeIntro";
import { BusinessProvider, useBusiness } from "@/lib/businessContext";
import { TaskProvider, useTasks, type TaskBusiness } from "@/lib/taskContext";
import { PrivacyProvider, usePrivacy } from "@/lib/privacyContext";
import { RitualProvider } from "@/lib/dailyRitualContext";
import { initGoogleAuth } from "@/lib/googleCalendar";
import { useTaskNotifications } from "@/lib/useTaskNotifications";
import { usePushSubscription } from "@/lib/usePushSubscription";
import DailyGate from "@/components/DailyGate";
import { Bell } from "lucide-react";

const SIDEBAR_W = 220;
const HEADER_H  = 56;

// ─── Mobile bottom nav — floating pill style ──────────────────
function MobileBottomNav({ onOpenSidebar, onCloseSidebar }: { onOpenSidebar: () => void; onCloseSidebar: () => void }) {
  const location = useLocation();
  const { hidden, toggle } = usePrivacy();

  const items = [
    { path: "/command-center", icon: Flame           },
    { path: "/tasks",          icon: CheckSquare     },
    { path: "/agenda",         icon: Calendar        },
  ];

  return (
    <nav
      className="lg:hidden"
      style={{
        position: "fixed",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex", alignItems: "center",
        gap: 2,
        background: "rgba(10,10,22,0.94)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: 50,
        padding: "5px 6px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.04) inset",
        whiteSpace: "nowrap",
      }}
    >
      {items.map(item => {
        const active = item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onCloseSidebar}
            style={{
              width: 50, height: 50, borderRadius: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: active ? "#a855f7" : "rgba(255,255,255,0.38)",
              textDecoration: "none",
              background: active ? "rgba(168,85,247,0.18)" : "transparent",
              transition: "all 0.15s ease",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <item.icon style={{ width: 21, height: 21 }} />
            {active && (
              <div style={{
                position: "absolute", bottom: 7, left: "50%",
                transform: "translateX(-50%)",
                width: 4, height: 4, borderRadius: "50%",
                background: "#a855f7",
                boxShadow: "0 0 6px #a855f7",
              }} />
            )}
          </Link>
        );
      })}
      {/* Eye — privacy toggle */}
      <button
        onClick={toggle}
        style={{
          width: 50, height: 50, borderRadius: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: hidden ? "rgba(168,85,247,0.2)" : "transparent",
          border: "none", cursor: "pointer",
          color: hidden ? "#a855f7" : "rgba(255,255,255,0.38)",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        {hidden
          ? <EyeOff style={{ width: 20, height: 20 }} />
          : <Eye    style={{ width: 20, height: 20 }} />}
      </button>
      {/* Separator */}
      <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.1)", margin: "0 2px", flexShrink: 0 }} />
      {/* Menu — bouton flottant voyant */}
      <button
        onClick={onOpenSidebar}
        style={{
          width: 50, height: 50, borderRadius: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          border: "none", cursor: "pointer",
          color: "#fff",
          transition: "all 0.15s ease",
          flexShrink: 0,
          boxShadow: "0 0 16px rgba(168,85,247,0.5)",
        }}
      >
        <Menu style={{ width: 20, height: 20 }} />
      </button>
    </nav>
  );
}

// ─── Header (inside TaskProvider + BusinessProvider) ──────────
function AppHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { tasks } = useTasks();
  const navigate  = useNavigate();

  const pending = (biz: TaskBusiness) => tasks.filter(t => t.business === biz && t.status !== "done").length;
  const coachingPending = pending("coaching");
  const casinoPending   = pending("casino");
  const totalPending    = tasks.filter(t => t.status !== "done").length;

  const handleAddTask = () => navigate("/");

  return (
    <header
      className="hidden lg:flex"
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: HEADER_H,
        zIndex: 100,
        background: "#040110",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        alignItems: "stretch",
      }}
    >
      {/* Zone 1 — Coaching (hidden on mobile) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: "0 0 25%",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          alignItems: "center",
          gap: 10,
          paddingLeft: 16,
        }}
      >
        <div>
          <p style={{
            color: "#a855f7",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}>
            Coaching
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2, lineHeight: 1 }}>
            {coachingPending} tâche{coachingPending !== 1 ? "s" : ""} aujourd'hui
          </p>
        </div>
      </div>

      {/* Mobile hamburger + title */}
      <div className="flex lg:hidden items-center gap-3 pl-3 flex-shrink-0">
        <button
          onClick={onOpenSidebar}
          style={{ color: "rgba(255,255,255,0.5)", fontSize: 20, lineHeight: 1 }}
          aria-label="Open menu"
        >
          ☰
        </button>
        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em" }}>
          CZN
        </span>
      </div>

      {/* Zone 2 — CZN logo (desktop only) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: "1 1 0",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/czn-logo.png"
          alt="CZN"
          style={{ height: 36, width: "auto", userSelect: "none", mixBlendMode: "screen" }}
        />
      </div>

      {/* Spacer on mobile */}
      <div className="flex lg:hidden flex-1" />

      {/* Zone 3 — Casino (hidden on mobile) */}
      <div
        className="hidden lg:flex"
        style={{
          flex: "0 0 25%",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          alignItems: "center",
          paddingLeft: 16,
        }}
      >
        <div>
          <p style={{
            color: "#00cc44",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}>
            Casino
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2, lineHeight: 1 }}>
            {casinoPending} tâche{casinoPending !== 1 ? "s" : ""} aujourd'hui
          </p>
        </div>
      </div>

      {/* Zone 4 — Actions */}
      <div
        style={{
          flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <span className="hidden sm:inline" style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.7)",
          borderRadius: 20,
          fontSize: 12,
          padding: "3px 10px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}>
          {totalPending} à faire
        </span>
        <button
          onClick={handleAddTask}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
            whiteSpace: "nowrap",
            flexShrink: 0,
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: 12, height: 12 }} />
          <span className="hidden sm:inline">Tâche</span>
        </button>
      </div>
    </header>
  );
}

// ─── Notification permission banner ───────────────────────────
function NotifBanner({ onAllow, onDismiss }: { onAllow: () => void; onDismiss: () => void }) {
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      zIndex: 200, display: "flex", alignItems: "center", gap: 10,
      background: "rgba(10,4,20,0.96)", border: "1px solid rgba(168,85,247,0.35)",
      borderRadius: 14, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      backdropFilter: "blur(20px)", maxWidth: "calc(100vw - 32px)",
    }}>
      <Bell style={{ width: 16, height: 16, color: "#a855f7", flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", whiteSpace: "nowrap" }}>
        Activer les rappels 5 min avant les tâches ?
      </span>
      <button onClick={onAllow} style={{
        background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff",
        border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12,
        fontWeight: 600, cursor: "pointer", flexShrink: 0,
      }}>Oui</button>
      <button onClick={onDismiss} style={{
        background: "transparent", color: "rgba(255,255,255,0.4)",
        border: "none", cursor: "pointer", padding: 4, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

// ─── Inner layout ──────────────────────────────────────────────
function AppLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const { hidden } = usePrivacy();
  const { tasks } = useTasks();
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  // Heavy visual effects (StarField, RippleCanvas, BizTransitionOverlay, mouse parallax)
  // are skipped on mobile for battery + perf. Honours prefers-reduced-motion.
  const [heavyFx] = useState(() => {
    if (typeof window === "undefined") return true;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    return !reduce && window.innerWidth >= 1024;
  });
  // Only show intro once per browser session (not on every page refresh)
  const [showIntro, setShowIntro] = useState(() => {
    if (sessionStorage.getItem("intro_seen")) return false;
    sessionStorage.setItem("intro_seen", "1");
    return true;
  });
  const isFirstMount = useRef(true);

  // ── Notifications push ────────────────────────────────────────
  // Fallback in-browser (tab ouvert)
  useTaskNotifications(tasks);
  // Vrai push natif iPhone (Service Worker + VAPID)
  const { permission, subscribed, subscribe } = usePushSubscription();
  const [showNotifBanner, setShowNotifBanner] = useState(() =>
    "Notification" in window && Notification.permission === "default"
  );

  const handleAllowNotif = async () => {
    await subscribe();
    setShowNotifBanner(false);
  };

  // Sync data-biz attr on body for CSS card hover theming
  useEffect(() => {
    document.body.setAttribute("data-biz", activeBusiness.id);
  }, [activeBusiness.id]);

  // Business mode transition — full-screen overlay + biz-transition class
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (!heavyFx) return; // skip overlay on mobile / reduced motion
    setShowOverlay(true);
    document.body.classList.add("biz-transition");
    const t = setTimeout(() => document.body.classList.remove("biz-transition"), 1000);
    return () => clearTimeout(t);
  }, [activeBusiness.id, heavyFx]);

  // Mouse parallax — desktop only
  useEffect(() => {
    if (!heavyFx) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!parallaxRef.current) return;
      const x = ((e.clientX / window.innerWidth) - 0.5) * 40;
      const y = ((e.clientY / window.innerHeight) - 0.5) * 40;
      parallaxRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [heavyFx]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      initGoogleAuth().then(authed => {
        if (authed) navigate("/agenda", { replace: true });
      });
    }
  }, []);

  const isCoaching = activeBusiness.id === "coaching";
  const bgAnimation = isCoaching
    ? "bg-coaching 8s ease-in-out infinite"
    : activeBusiness.id === "casino"
    ? "bg-casino 8s ease-in-out infinite"
    : undefined;

  return (
    <div style={{ background: "#030108", minHeight: "100vh", maxWidth: "100vw" }}>
      {showIntro && <WelcomeIntro onDone={() => setShowIntro(false)} />}
      {heavyFx && showOverlay && (
        <Suspense fallback={null}>
          <BizTransitionOverlay
            mode={activeBusiness.id as "coaching" | "casino"}
            onDone={() => setShowOverlay(false)}
          />
        </Suspense>
      )}
      {heavyFx && <StarField />}
      {heavyFx && <RippleCanvas />}

      {/* Mouse parallax glow overlay — desktop only */}
      {heavyFx && (
        <div
          ref={parallaxRef}
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background: isCoaching
              ? "radial-gradient(ellipse 40% 40% at 50% 50%, rgba(168,85,247,0.025) 0%, transparent 70%)"
              : "radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0,204,68,0.02) 0%, transparent 70%)",
            transition: "transform 0.3s ease-out",
          }}
        />
      )}

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(ellipse 50% 35% at 0% 0%, rgba(0,255,136,0.015) 0%, transparent 60%)," +
          "radial-gradient(ellipse 50% 35% at 100% 0%, rgba(168,85,247,0.02) 0%, transparent 60%)," +
          "radial-gradient(ellipse 40% 30% at 80% 100%, rgba(124,58,237,0.015) 0%, transparent 70%)",
      }} />

      {/* Fixed header */}
      <AppHeader onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Fixed sidebar — starts below header */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Notification permission banner */}
      {showNotifBanner && (
        <NotifBanner
          onAllow={handleAllowNotif}
          onDismiss={() => setShowNotifBanner(false)}
        />
      )}

      {/* Mobile bottom nav */}
      <MobileBottomNav onOpenSidebar={() => setSidebarOpen(true)} onCloseSidebar={() => setSidebarOpen(false)} />

      {/* Main content — offset header (desktop only) + sidebar */}
      <main
        className="lg:ml-[220px] main-content"
        style={{
          paddingBottom: "calc(112px + env(safe-area-inset-bottom))",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="p-4 lg:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* Daily ritual gate — blocks navigation until morning/evening checkpoints are done */}
      <DailyGate />
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────
export default function AppLayout() {
  return (
    <PrivacyProvider>
      <BusinessProvider>
        <TaskProvider>
          <RitualProvider>
            <AppLayoutInner />
          </RitualProvider>
        </TaskProvider>
      </BusinessProvider>
    </PrivacyProvider>
  );
}

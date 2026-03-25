import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import AppSidebar from "./AppSidebar";
import StarField from "../StarField";
import RippleCanvas from "../RippleCanvas";
import { BusinessProvider, useBusiness } from "@/lib/businessContext";
import { TaskProvider, useTasks, type TaskBusiness } from "@/lib/taskContext";
import { initGoogleAuth } from "@/lib/googleCalendar";

const SIDEBAR_W = 220;
const HEADER_H  = 56;

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
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: HEADER_H,
        zIndex: 100,
        background: "#08080f",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      {/* Zone 1 — Coaching */}
      <div
        style={{
          flex: "0 0 25%",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingLeft: 16,
        }}
      >
        {/* Mobile hamburger */}
        <button
          className="lg:hidden"
          onClick={onOpenSidebar}
          style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, flexShrink: 0, lineHeight: 1 }}
          aria-label="Open menu"
        >
          ☰
        </button>
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

      {/* Zone 2 — CZN logo */}
      <div
        style={{
          flex: "1 1 0",
          display: "flex",
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

      {/* Zone 3 — Casino */}
      <div
        style={{
          flex: "0 0 25%",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
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
          flex: "0 0 180px",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <span style={{
          background: "rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.7)",
          borderRadius: 20,
          fontSize: 12,
          padding: "3px 10px",
          fontWeight: 500,
          whiteSpace: "nowrap",
          flexShrink: 0,
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
          Tâche
        </button>
      </div>
    </header>
  );
}

// ─── Inner layout ──────────────────────────────────────────────
function AppLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  // Sync data-biz attr on body for CSS card hover theming
  useEffect(() => {
    document.body.setAttribute("data-biz", activeBusiness.id);
  }, [activeBusiness.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
      initGoogleAuth().then(authed => {
        if (authed) navigate("/agenda", { replace: true });
      });
    }
  }, []);

  return (
    <div style={{ background: "#07040F", minHeight: "100vh" }}>
      <StarField />
      <RippleCanvas />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(ellipse 50% 35% at 0% 0%, rgba(0,255,136,0.04) 0%, transparent 60%)," +
          "radial-gradient(ellipse 50% 35% at 100% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)," +
          "radial-gradient(ellipse 40% 30% at 80% 100%, rgba(124,58,237,0.04) 0%, transparent 70%)",
      }} />

      {/* Fixed header */}
      <AppHeader onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Fixed sidebar — starts below header */}
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset header + sidebar */}
      <main
        className="lg:ml-[220px]"
        style={{
          paddingTop: HEADER_H,
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────
export default function AppLayout() {
  return (
    <BusinessProvider>
      <TaskProvider>
        <AppLayoutInner />
      </TaskProvider>
    </BusinessProvider>
  );
}

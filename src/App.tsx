import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";

// Eagerly loaded (home + high-traffic)
import DashboardPage from "@/pages/DashboardPage";
import CommandCenter from "@/pages/CommandCenter";
import TasksPage from "@/pages/TasksPage";
import AgendaPage from "@/pages/AgendaPage";

// Lazy-loaded (split per route)
const AgentsPage        = lazy(() => import("@/pages/AgentsPage"));
const BusinessPage      = lazy(() => import("@/pages/BusinessPage"));
const ContentPage       = lazy(() => import("@/pages/ContentPage"));
const TeamPage          = lazy(() => import("@/pages/TeamPage"));
const GoalsPage         = lazy(() => import("@/pages/GoalsPage"));
const GamificationPage  = lazy(() => import("@/pages/GamificationPage"));
const VentesPage        = lazy(() => import("@/pages/VentesPage"));
const FinancesPage      = lazy(() => import("@/pages/FinancesPage"));
const CoachingDashboard = lazy(() => import("@/pages/CoachingDashboard"));
const SocialPage        = lazy(() => import("@/pages/SocialPage"));
const BeaconsPage       = lazy(() => import("@/pages/BeaconsPage"));
const LeadsPage         = lazy(() => import("@/pages/LeadsPage"));
const PaiementsPage     = lazy(() => import("@/pages/PaiementsPage"));
const ClientsPage       = lazy(() => import("@/pages/ClientsPage"));
const AgencePage        = lazy(() => import("@/pages/AgencePage"));
const EquipePage        = lazy(() => import("@/pages/EquipePage"));
const CasinoDashboard   = lazy(() => import("@/pages/CasinoDashboard"));
const CasinoSocialPage  = lazy(() => import("@/pages/CasinoSocialPage"));
// /casino/depots and /casino/revshare now render CasinoDashboard (it detects the tab from the URL)
const SettingsPage      = lazy(() => import("@/pages/SettingsPage"));
const NotFound          = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#a855f7",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/gamification" element={<GamificationPage />} />
              <Route path="/ventes" element={<VentesPage />} />
              <Route path="/finances" element={<FinancesPage />} />
              {/* Coaching */}
              <Route path="/coaching" element={<CoachingDashboard />} />
              <Route path="/coaching/social" element={<SocialPage />} />
              <Route path="/coaching/beacons" element={<BeaconsPage />} />
              <Route path="/coaching/leads" element={<LeadsPage />} />
              <Route path="/coaching/clients" element={<ClientsPage />} />
              <Route path="/coaching/agence" element={<AgencePage />} />
              <Route path="/coaching/paiements" element={<PaiementsPage />} />
              <Route path="/coaching/equipe" element={<EquipePage />} />
              {/* Casino */}
              <Route path="/casino" element={<CasinoDashboard />} />
              <Route path="/casino/social" element={<CasinoSocialPage />} />
              <Route path="/casino/depots" element={<CasinoDashboard />} />
              <Route path="/casino/revshare" element={<CasinoDashboard />} />
              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

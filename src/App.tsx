import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import CommandCenter from "@/pages/CommandCenter";
import AgentsPage from "@/pages/AgentsPage";
import BusinessPage from "@/pages/BusinessPage";
import ContentPage from "@/pages/ContentPage";
import TasksPage from "@/pages/TasksPage";
import AgendaPage from "@/pages/AgendaPage";
import TeamPage from "@/pages/TeamPage";
import GoalsPage from "@/pages/GoalsPage";
import GamificationPage from "@/pages/GamificationPage";
import VentesPage from "@/pages/VentesPage";
import FinancesPage from "@/pages/FinancesPage";
import CoachingDashboard from "@/pages/CoachingDashboard";
import SocialPage from "@/pages/SocialPage";
import BeaconsPage from "@/pages/BeaconsPage";
import LeadsPage from "@/pages/LeadsPage";
import PaiementsPage from "@/pages/PaiementsPage";
import ClientsPage from "@/pages/ClientsPage";
import AgencePage from "@/pages/AgencePage";
import EquipePage from "@/pages/EquipePage";
import CasinoDashboard from "@/pages/CasinoDashboard";
import CasinoSocialPage from "@/pages/CasinoSocialPage";
import CasinoDepotsPage from "@/pages/CasinoDepotsPage";
import CasinoRevSharePage from "@/pages/CasinoRevSharePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/casino/depots" element={<CasinoDepotsPage />} />
            <Route path="/casino/revshare" element={<CasinoRevSharePage />} />
            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState, ElementType } from "react";
import { TrendingUp, Users, Calendar, DollarSign, Plus, Phone, Mail, CheckCircle, Clock, X, ChevronRight, Target } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";

// ─── Types ───────────────────────────────────────────────
type Stage = "Prospect" | "RDV" | "Offre" | "Client" | "Perdu";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: Stage;
  value: number;
  notes: string;
  date: string;
  nextAction?: string;
}

interface Session {
  id: string;
  clientName: string;
  date: string;
  time: string;
  duration: number; // minutes
  type: "Discovery" | "Coaching" | "Suivi" | "Stratégie";
  status: "planned" | "done" | "cancelled";
  notes?: string;
}

// ─── Mock Data ────────────────────────────────────────────
const INITIAL_LEADS: Lead[] = [
  { id: "1", name: "Marie Dupont", email: "marie@example.com", phone: "06 12 34 56 78", stage: "Prospect", value: 2500, notes: "Intéressée par coaching business 3 mois", date: "2026-03-20", nextAction: "Envoyer brochure" },
  { id: "2", name: "Thomas Laurent", email: "thomas@startup.io", phone: "07 98 76 54 32", stage: "RDV", value: 4800, notes: "CEO startup, veut scaler son équipe", date: "2026-03-18", nextAction: "RDV Zoom Mardi 14h" },
  { id: "3", name: "Sophie Martin", email: "sophie@corp.fr", stage: "Offre", value: 6000, notes: "Offre 6 mois envoyée", date: "2026-03-15", nextAction: "Relance vendredi" },
  { id: "4", name: "Lucas Bernard", email: "lucas@agence.com", stage: "Client", value: 3200, notes: "Client actif - session hebdo", date: "2026-02-01" },
  { id: "5", name: "Emma Rousseau", email: "emma@freelance.fr", stage: "Client", value: 1800, notes: "Coaching mensuel", date: "2026-01-15" },
  { id: "6", name: "Paul Moreau", email: "paul@saas.io", stage: "Perdu", value: 5000, notes: "Budget insuffisant", date: "2026-03-10" },
];

const INITIAL_SESSIONS: Session[] = [
  { id: "1", clientName: "Lucas Bernard", date: "2026-03-24", time: "10:00", duration: 60, type: "Coaching", status: "planned" },
  { id: "2", clientName: "Emma Rousseau", date: "2026-03-24", time: "14:00", duration: 45, type: "Suivi", status: "planned" },
  { id: "3", clientName: "Thomas Laurent", date: "2026-03-25", time: "11:00", duration: 30, type: "Discovery", status: "planned" },
  { id: "4", clientName: "Lucas Bernard", date: "2026-03-17", time: "10:00", duration: 60, type: "Coaching", status: "done" },
  { id: "5", clientName: "Emma Rousseau", date: "2026-03-17", time: "14:00", duration: 45, type: "Suivi", status: "done" },
];

const STAGES: Stage[] = ["Prospect", "RDV", "Offre", "Client", "Perdu"];

const STAGE_COLORS: Record<Stage, { bg: string; border: string; text: string; dot: string }> = {
  Prospect: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", text: "#818cf8", dot: "#6366f1" },
  RDV: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#fbbf24", dot: "#f59e0b" },
  Offre: { bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.3)", text: "#a78bfa", dot: "#7c3aed" },
  Client: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)", text: "#34d399", dot: "#10b981" },
  Perdu: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", text: "#f87171", dot: "#ef4444" },
};

const SESSION_TYPE_COLORS: Record<Session["type"], string> = {
  Discovery: "#6366f1",
  Coaching: "#a855f7",
  Suivi: "#10b981",
  Stratégie: "#f59e0b",
};

// ─── Sub-components ───────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  icon: ElementType; color: string;
}) {

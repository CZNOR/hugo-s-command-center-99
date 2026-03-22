// ─── Types ───────────────────────────────────────────────────────────────────
// Ces types définissent la forme des données attendues par la vraie DB (Supabase)

export interface GamificationProfile {
  total_xp: number;
  level: number;
  level_title: string;
  current_streak: number;
  longest_streak: number;
  score_today: number;
  score_record: number;
  xp_today: number;
  xp_for_next_level: number;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  color: string;
  revenue_mtd: number;
  mrr: number;
  deals_active: number;
  expenses: number;
}

export interface Task {
  id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "inbox" | "todo" | "in_progress" | "done" | "cancelled";
  due_date: string;
  assignee: string;
  xp: number;
  project: string;
  business_id?: string;
}

export interface Deal {
  id: string;
  title: string;
  client: string;
  value: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  probability: number;
  business_id?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: "active" | "away" | "offline";
  tasks_assigned: number;
  avatar: string;
  business_id?: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  business_id: string;
  category: "revenue" | "growth" | "content" | "ops" | "personal";
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date-time
  end: string;
  type: "meeting" | "focus" | "creative" | "personal" | "deadline";
  business_id?: string;
  color?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  model: string;
  tools: string[];
  status: "active" | "paused" | "building";
  tasks_total: number;
  tasks_success: number;
  avatar: string;
  last_action: string;
  business_id?: string;
}

// ─── Profil gamification (seule donnée conservée — affichée dans le header) ───
export const gamificationProfile: GamificationProfile = {
  total_xp: 0,
  level: 1,
  level_title: "Débutant",
  current_streak: 0,
  longest_streak: 0,
  score_today: 0,
  score_record: 0,
  xp_today: 0,
  xp_for_next_level: 1000,
};

// ─── Données vides — à remplacer par des appels Supabase ─────────────────────
export const businesses: Business[] = [];
export const tasks: Task[] = [];
export const deals: Deal[] = [];
export const teamMembers: TeamMember[] = [];
export const goals: Goal[] = [];
export const calendarEvents: CalendarEvent[] = [];
export const aiAgents: AIAgent[] = [];

export const gamificationProfile = {
  total_xp: 8420,
  level: 12,
  level_title: "Architect",
  current_streak: 14,
  longest_streak: 31,
  score_today: 9840,
  score_record: 11200,
  xp_today: 420,
  xp_for_next_level: 10000,
};

export const businesses = [
  { id: "1", name: "Agence Made", type: "agency", color: "#6366F1", revenue_mtd: 24800, mrr: 12400, deals_active: 4, expenses: 8200 },
  { id: "2", name: "SaaS Vision", type: "saas", color: "#06B6D4", revenue_mtd: 8950, mrr: 8950, deals_active: 2, expenses: 3100 },
  { id: "3", name: "Hugo Contenu", type: "content", color: "#EC4899", revenue_mtd: 3200, mrr: 1800, deals_active: 0, expenses: 450 },
];

export const aiAgents = [
  { id: "1", name: "Aria", role: "Content Writer", model: "GPT-4o", tools: ["Make", "API"], status: "active" as const, tasks_total: 142, tasks_success: 139, avatar: "A", last_action: "il y a 2 min" },
  { id: "2", name: "Nexus", role: "Outreach Agent", model: "Claude 3.5", tools: ["n8n", "Slack"], status: "active" as const, tasks_total: 87, tasks_success: 83, avatar: "N", last_action: "il y a 8 min" },
  { id: "3", name: "Orion", role: "Data Analyst", model: "GPT-4o", tools: ["API"], status: "active" as const, tasks_total: 56, tasks_success: 55, avatar: "O", last_action: "il y a 15 min" },
  { id: "4", name: "Vega", role: "Social Manager", model: "Gemini Pro", tools: ["Make", "TikTok"], status: "paused" as const, tasks_total: 34, tasks_success: 31, avatar: "V", last_action: "il y a 2h" },
  { id: "5", name: "Atlas", role: "Customer Support", model: "Claude 3.5", tools: ["Intercom", "API"], status: "building" as const, tasks_total: 0, tasks_success: 0, avatar: "At", last_action: "en construction" },
];

export interface Task {
  id: string;
  title: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "inbox" | "todo" | "in_progress" | "done" | "cancelled";
  due_date: string;
  assignee: string;
  xp: number;
  project: string;
}

export const tasks: Task[] = [
  { id: "1", title: "Finaliser proposition client Meridian", priority: "urgent" as const, status: "in_progress" as const, due_date: "Aujourd'hui", assignee: "self", xp: 50, project: "Agence Made" },
  { id: "2", title: "Revue des métriques Q1 SaaS Vision", priority: "high" as const, status: "todo" as const, due_date: "Demain", assignee: "self", xp: 20, project: "SaaS Vision" },
  { id: "3", title: "Publier vidéo YouTube — IA agents tutoriel", priority: "high" as const, status: "in_progress" as const, due_date: "Aujourd'hui", assignee: "Aria", xp: 75, project: "Hugo Contenu" },
  { id: "4", title: "Corriger bug onboarding flow", priority: "medium" as const, status: "todo" as const, due_date: "Mer 26", assignee: "self", xp: 20, project: "SaaS Vision" },
  { id: "5", title: "Préparer deck investisseur V2", priority: "medium" as const, status: "todo" as const, due_date: "Ven 28", assignee: "self", xp: 20, project: "SaaS Vision" },
  { id: "6", title: "Envoyer campagne outreach batch 12", priority: "high" as const, status: "done" as const, due_date: "Hier", assignee: "Nexus", xp: 20, project: "Agence Made" },
  { id: "7", title: "Analyser performance reels mars", priority: "low" as const, status: "done" as const, due_date: "Hier", assignee: "Orion", xp: 10, project: "Hugo Contenu" },
];

export const dailyMissions = [
  { id: "1", title: "Compléter 5 tâches", icon: "✅", xp: 200, completed: true, progress: "5/5" },
  { id: "2", title: "Morning routine complète", icon: "🌅", xp: 100, completed: true, progress: "7/7" },
  { id: "3", title: "Publier 1 contenu", icon: "📱", xp: 150, completed: true, progress: "1/1" },
  { id: "4", title: "Closer 1 deal", icon: "🤝", xp: 300, completed: false, progress: "0/1" },
  { id: "5", title: "Evening routine", icon: "🌙", xp: 75, completed: false, progress: "0/5" },
];

export const skills = [
  { name: "Business Ops", level: 7, xp: 3200, max_xp: 5000, color: "#6366F1" },
  { name: "Content Creator", level: 5, xp: 1800, max_xp: 3000, color: "#EC4899" },
  { name: "AI Commander", level: 8, xp: 4100, max_xp: 5000, color: "#06B6D4" },
  { name: "Leadership", level: 4, xp: 900, max_xp: 2000, color: "#10B981" },
  { name: "Mindset", level: 6, xp: 2400, max_xp: 4000, color: "#8B5CF6" },
];

export const badges = [
  { id: "1", name: "First Task", icon: "⚡", rarity: "common" as const, earned: true, description: "Compléter sa première tâche" },
  { id: "2", name: "7-Day Streak", icon: "🔥", rarity: "rare" as const, earned: true, description: "Streak de 7 jours consécutifs" },
  { id: "3", name: "First Deal", icon: "🤝", rarity: "common" as const, earned: true, description: "Closer son premier deal" },
  { id: "4", name: "Content Creator", icon: "🎬", rarity: "rare" as const, earned: true, description: "Publier 10 contenus" },
  { id: "5", name: "AI Commander", icon: "🤖", rarity: "epic" as const, earned: true, description: "Déployer 5 agents IA" },
  { id: "6", name: "Morning Warrior", icon: "🌅", rarity: "rare" as const, earned: true, description: "30 morning routines complètes" },
  { id: "7", name: "Deal Maker", icon: "💰", rarity: "epic" as const, earned: true, description: "Closer 10 deals" },
  { id: "8", name: "Growth Hacker", icon: "📈", rarity: "rare" as const, earned: true, description: "Atteindre 10K followers" },
  { id: "9", name: "30-Day Streak", icon: "💎", rarity: "epic" as const, earned: false, description: "Streak de 30 jours" },
  { id: "10", name: "Legend Status", icon: "👑", rarity: "legendary" as const, earned: false, description: "Atteindre le niveau 50" },
  { id: "11", name: "Revenue King", icon: "🏆", rarity: "legendary" as const, earned: false, description: "100K€ de CA en un mois" },
  { id: "12", name: "Full Stack", icon: "🎯", rarity: "epic" as const, earned: false, description: "Toutes les compétences au niveau 5+" },
];

export const deals = [
  { id: "1", title: "Refonte e-commerce", client: "Meridian Corp", value: 12500, stage: "negotiation" as const, probability: 75 },
  { id: "2", title: "App mobile MVP", client: "StartupFlow", value: 8000, stage: "proposal" as const, probability: 50 },
  { id: "3", title: "Branding complet", client: "NovaTech", value: 4500, stage: "qualified" as const, probability: 30 },
  { id: "4", title: "Dashboard analytics", client: "DataPulse", value: 15000, stage: "lead" as const, probability: 15 },
  { id: "5", title: "Site vitrine premium", client: "Luxe & Co", value: 6000, stage: "won" as const, probability: 100 },
  { id: "6", title: "Consulting IA", client: "FutureLab", value: 3000, stage: "won" as const, probability: 100 },
];

export const revenueData = [
  { month: "Oct", agence: 18500, saas: 5200, contenu: 1800 },
  { month: "Nov", agence: 22100, saas: 6400, contenu: 2100 },
  { month: "Déc", agence: 19800, saas: 7100, contenu: 2800 },
  { month: "Jan", agence: 21400, saas: 7800, contenu: 2400 },
  { month: "Fév", agence: 23200, saas: 8400, contenu: 2900 },
  { month: "Mar", agence: 24800, saas: 8950, contenu: 3200 },
];

export const xpHistory = [
  { id: "1", reason: "Tâche urgente complétée", amount: 50, source: "task", time: "il y a 12 min" },
  { id: "2", reason: "Mission 'Publier 1 contenu'", amount: 150, source: "mission", time: "il y a 45 min" },
  { id: "3", reason: "Morning routine complète", amount: 100, source: "routine", time: "il y a 2h" },
  { id: "4", reason: "Mission 'Morning routine'", amount: 100, source: "mission", time: "il y a 2h" },
  { id: "5", reason: "Connexion quotidienne", amount: 25, source: "login", time: "il y a 3h" },
];

export const teamMembers = [
  { id: "1", name: "Sarah Chen", role: "Designer UI/UX", status: "active" as const, tasks_assigned: 4, avatar: "SC" },
  { id: "2", name: "Marc Dubois", role: "Développeur Full-Stack", status: "active" as const, tasks_assigned: 6, avatar: "MD" },
];

export const routines = {
  morning: [
    { id: "1", label: "Méditation 10 min", done: true, xp: 15 },
    { id: "2", label: "Journaling", done: true, xp: 15 },
    { id: "3", label: "Revue objectifs", done: true, xp: 10 },
    { id: "4", label: "Inbox zero", done: true, xp: 15 },
    { id: "5", label: "Top 3 priorités", done: true, xp: 15 },
    { id: "6", label: "Exercice 20 min", done: true, xp: 20 },
    { id: "7", label: "Lecture 15 min", done: true, xp: 10 },
  ],
  evening: [
    { id: "1", label: "Revue journée", done: false, xp: 15 },
    { id: "2", label: "Planifier demain", done: false, xp: 15 },
    { id: "3", label: "Gratitude journal", done: false, xp: 15 },
    { id: "4", label: "Pas d'écran 30 min", done: false, xp: 15 },
    { id: "5", label: "Lecture 15 min", done: false, xp: 15 },
  ],
};

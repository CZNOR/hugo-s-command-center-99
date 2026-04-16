import { useEffect, useState } from "react";
import { Bell, Palette, Shield, Globe, Moon, Sparkles, Flame, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRitual, type WeekendMode } from "@/lib/dailyRitualContext";

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, description, children }: {
  icon: React.ElementType; label: string; description?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Icon style={{ width: 15, height: 15, color: "rgba(255,255,255,0.5)" }} />
        </div>
        <div>
          <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</div>
          {description && <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{description}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className="relative w-10 h-5 rounded-full cursor-pointer transition-colors"
      style={{ background: on ? "#7c3aed" : "rgba(255,255,255,0.1)", border: "none", padding: 0 }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
        style={{
          background: "#fff",
          left: on ? "calc(100% - 18px)" : 2,
        }}
      />
    </button>
  );
}

type SettingKey = "notif_tasks" | "notif_goals" | "dark_mode";
const STORAGE_KEY = "czn_settings_v1";
const DEFAULTS: Record<SettingKey, boolean> = {
  notif_tasks: true,
  notif_goals: false,
  dark_mode: true,
};

function loadSettings(): Record<SettingKey, boolean> {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>(loadSettings);
  const ritual = useRitual();

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* noop */ }
  }, [settings]);

  const set = (key: SettingKey) => (v: boolean) => setSettings(s => ({ ...s, [key]: v }));

  const handleResetToday = () => {
    ritual.resetToday();
    toast.success("Rituel d'aujourd'hui réinitialisé");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Configuration de votre espace CZN</p>
      </div>

      {/* Daily ritual settings */}
      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Rituel quotidien</h3>

        <Row icon={Sparkles} label="Heure du matin" description="Gate + notification push">
          <select
            value={ritual.settings.morningHour}
            onChange={e => ritual.updateSettings({ morningHour: parseInt(e.target.value, 10) })}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          >
            {[6, 7, 8, 9, 10, 11].map(h => <option key={h} value={h}>{h}h</option>)}
          </select>
        </Row>

        <Row icon={Moon} label="Heure du soir" description="Bilan + notification push">
          <select
            value={ritual.settings.eveningHour}
            onChange={e => ritual.updateSettings({ eveningHour: parseInt(e.target.value, 10) })}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          >
            {[17, 18, 19, 20, 21, 22].map(h => <option key={h} value={h}>{h}h</option>)}
          </select>
        </Row>

        <Row icon={Globe} label="Weekend" description="Jours où le rituel est actif">
          <select
            value={ritual.settings.weekendMode}
            onChange={e => ritual.updateSettings({ weekendMode: e.target.value as WeekendMode })}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}
          >
            <option value="saturday">Samedi oui, dimanche off</option>
            <option value="off">Off samedi et dimanche</option>
            <option value="full">Actif 7j/7</option>
          </select>
        </Row>

        <Row icon={Flame} label="Streak actuel" description="Jours consécutifs complétés">
          <span className="text-sm font-mono font-bold" style={{ color: ritual.streak > 0 ? "#f97316" : "rgba(255,255,255,0.4)" }}>
            {ritual.streak}j
          </span>
        </Row>

        <Row icon={RotateCcw} label="Réinitialiser aujourd'hui" description="Ré-afficher la gate du matin">
          <button
            onClick={handleResetToday}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer" }}
          >
            Reset
          </button>
        </Row>
      </Card>

      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Notifications</h3>
        <Row icon={Bell} label="Rappels de tâches" description="Notifier avant l'heure d'un call planifié">
          <Toggle on={settings.notif_tasks} onChange={set("notif_tasks")} />
        </Row>
        <Row icon={Bell} label="Alertes objectifs" description="Notifier quand un objectif est atteint">
          <Toggle on={settings.notif_goals} onChange={set("notif_goals")} />
        </Row>
      </Card>

      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Apparence</h3>
        <Row icon={Moon} label="Mode sombre" description="Interface en thème sombre (par défaut)">
          <Toggle on={settings.dark_mode} onChange={set("dark_mode")} />
        </Row>
        <Row icon={Palette} label="Couleur d'accentuation" description="Violet (Coaching) / Vert (Casino)">
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full" style={{ background: "#7c3aed" }} />
            <div className="w-5 h-5 rounded-full" style={{ background: "#00cc44" }} />
          </div>
        </Row>
      </Card>

      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Général</h3>
        <Row icon={Globe} label="Langue" description="Français">
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>FR</span>
        </Row>
        <Row icon={Shield} label="Données & confidentialité" description="Gestion des données locales">
          <span className="text-xs px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
            Local
          </span>
        </Row>
      </Card>

      <div className="text-center py-4">
        <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>CZN v1.0 · claude/nifty-wilbur</p>
      </div>
    </div>
  );
}

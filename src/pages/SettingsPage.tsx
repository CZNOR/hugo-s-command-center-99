import { Bell, Palette, Shield, Globe, Moon } from "lucide-react";

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

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <div
      className="relative w-10 h-5 rounded-full cursor-pointer transition-colors"
      style={{ background: defaultOn ? "#7c3aed" : "rgba(255,255,255,0.1)" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
        style={{
          background: "#fff",
          left: defaultOn ? "calc(100% - 18px)" : 2,
        }}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Configuration de votre espace CZN</p>
      </div>

      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Notifications</h3>
        <Row icon={Bell} label="Rappels de tâches" description="Notifier avant l'heure d'un call planifié">
          <Toggle defaultOn />
        </Row>
        <Row icon={Bell} label="Alertes objectifs" description="Notifier quand un objectif est atteint">
          <Toggle />
        </Row>
      </Card>

      <Card>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Apparence</h3>
        <Row icon={Moon} label="Mode sombre" description="Interface en thème sombre (par défaut)">
          <Toggle defaultOn />
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

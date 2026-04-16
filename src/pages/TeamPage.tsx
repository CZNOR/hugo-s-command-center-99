import { useState } from "react";
import { Users, Plus, Mail, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/lib/businessContext";

export default function TeamPage() {
  const { activeBusiness } = useBusiness();
  const [activeRole, setActiveRole] = useState("Tous");

  const roles = ["Tous", "Freelance", "Salarié", "Partenaire"];

  const notifyInvite = () =>
    toast.info("Invitation équipe — bientôt disponible", {
      description: "La gestion des membres sera activée avec le back Supabase.",
    });

  return (
    <div className="p-4 lg:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Équipe</h1>
          <p className="text-sm text-white/40 mt-1">Vos collaborateurs et partenaires</p>
        </div>
        <button
          onClick={notifyInvite}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Plus className="w-4 h-4" />
          Inviter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: <Users className="w-4 h-4" />, label: "Membres", value: "0" },
          { icon: <UserCheck className="w-4 h-4" />, label: "Actifs", value: "0" },
          { icon: <UserX className="w-4 h-4" />, label: "En attente", value: "0" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2 mb-2" style={{ color: activeBusiness.accent }}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-white/90">{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {roles.map((r) => {
          const active = activeRole === r;
          return (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: active ? `${activeBusiness.accent}22` : "rgba(255,255,255,0.04)",
                borderColor: active ? activeBusiness.accent : "rgba(255,255,255,0.08)",
                color: active ? activeBusiness.accent : "rgba(248,250,252,0.5)",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20 gap-4"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: `${activeBusiness.accent}15`, border: `1px solid ${activeBusiness.accent}30` }}
        >
          <Users className="w-8 h-8" style={{ color: activeBusiness.accent }} />
        </div>
        <div className="text-center">
          <p className="text-white/60 font-medium">Aucun membre d'équipe</p>
          <p className="text-white/30 text-sm mt-1">Invitez vos collaborateurs pour commencer</p>
        </div>
        <button
          onClick={notifyInvite}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white mt-1"
          style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
        >
          <Mail className="w-4 h-4" />
          Envoyer une invitation
        </button>
      </div>
    </div>
  );
}

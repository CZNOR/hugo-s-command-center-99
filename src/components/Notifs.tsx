import type { PushStatus } from "@/lib/usePushSubscription";

const TEXTE: Partial<Record<PushStatus, string>> = {
  "off":           "Active les rappels d'appels sur cet iPhone.",
  "busy":          "Activation en cours…",
  "denied":        "Notifications bloquées : Réglages iPhone → Notifications → Dring → Autoriser.",
  "not-installed": "Ouvre Dring depuis son icône de l'écran d'accueil pour activer les rappels.",
};

// Rappels d'appels (notifs) pas encore actifs sur cet appareil : une ligne et un bouton
export default function Notifs({ status, error, onEnable }: { status: PushStatus; error: string; onEnable: () => void }) {
  if (status === "on" || status === "checking" || status === "unsupported") return null;
  return (
    <div className="notice">
      <p>{status === "error" ? `Activation impossible : ${error}` : TEXTE[status]}</p>
      {(status === "off" || status === "error") && (
        <button className="textbtn" onClick={onEnable}>{status === "error" ? "Réessayer" : "Activer"}</button>
      )}
    </div>
  );
}

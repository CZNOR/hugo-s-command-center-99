import { useEffect, useRef, useCallback } from "react";
import type { Task } from "./taskContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Combine deadline (yyyy-mm-dd) + time (HH:MM) → Date. Returns null si pas de deadline. */
function taskDateTime(task: Task): Date | null {
  if (!task.deadline) return null;
  const [y, mo, d] = task.deadline.split("-").map(Number);
  if (task.time) {
    const [h, mi] = task.time.split(":").map(Number);
    return new Date(y, mo - 1, d, h, mi, 0);
  }
  // Pas d'heure → fin de journée 23:59
  return new Date(y, mo - 1, d, 23, 59, 0);
}

/** Envoie une notification native si la permission est accordée. */
function notify(title: string, body: string, tag: string) {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag,                    // évite les doublons côté OS
      icon: "/czn-logo.png",
      badge: "/czn-logo.png",
      silent: false,
    });
  } catch {}
}

// ─── Hook principal ────────────────────────────────────────────────────────

/**
 * useTaskNotifications
 * - Demande la permission push au premier usage
 * - Vérifie toutes les minutes les tâches à venir
 * - Notifie 5 min avant chaque tâche (une seule fois par tâche)
 * - Notifie si une tâche vient de passer en retard (dans la dernière minute)
 */
export function useTaskNotifications(tasks: Task[]) {
  // IDs déjà notifiés (5-min) pour éviter les doublons dans la session
  const notified5min  = useRef<Set<string>>(new Set());
  // IDs déjà notifiés (en retard)
  const notifiedLate  = useRef<Set<string>>(new Set());

  // ── Demande de permission ─────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "denied";
    if (Notification.permission === "default") {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }, []);

  // ── Vérification des tâches ───────────────────────────────────
  const checkTasks = useCallback((taskList: Task[]) => {
    const now = Date.now();

    for (const task of taskList) {
      if (task.status === "done") continue;

      const dt = taskDateTime(task);
      if (!dt) continue;

      const diffMs   = dt.getTime() - now;
      const diffMins = diffMs / 60_000;

      // ── 5 min avant (fenêtre ±30s) ──────────────────────────
      if (diffMins > 0 && diffMins <= 5.5 && !notified5min.current.has(task.id)) {
        notified5min.current.add(task.id);
        const label = task.time ? `à ${task.time}` : "aujourd'hui";
        notify(
          `⏰ Dans 5 min — ${task.title}`,
          `Tâche ${label} · ${task.business}`,
          `5min-${task.id}`
        );
      }

      // ── En retard (passé depuis < 2 min) ────────────────────
      if (diffMs < 0 && diffMs > -120_000 && !notifiedLate.current.has(task.id)) {
        notifiedLate.current.add(task.id);
        notify(
          `🔴 En retard — ${task.title}`,
          `Cette tâche était prévue ${task.time ? `à ${task.time}` : "aujourd'hui"}`,
          `late-${task.id}`
        );
      }
    }
  }, []);

  // ── Demande la permission au montage ─────────────────────────
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // ── setInterval toutes les 60s ────────────────────────────────
  useEffect(() => {
    // Vérification immédiate au chargement
    checkTasks(tasks);

    const interval = setInterval(() => {
      checkTasks(tasks);
    }, 60_000); // toutes les minutes

    return () => clearInterval(interval);
  }, [tasks, checkTasks]);

  // ── Notifier immédiatement à la création d'une tâche ─────────
  // (appelé manuellement depuis addTask)
  const notifyCreated = useCallback((task: Task) => {
    if (Notification.permission !== "granted") return;
    const dt = taskDateTime(task);
    if (!dt) return;

    const diffMins = (dt.getTime() - Date.now()) / 60_000;
    if (diffMins < 0) {
      notify(
        `🔴 Tâche en retard — ${task.title}`,
        "Tu viens d'ajouter une tâche déjà en retard.",
        `created-late-${task.id}`
      );
    } else if (diffMins <= 60) {
      notify(
        `📌 Tâche ajoutée — ${task.title}`,
        `Échéance dans ${Math.round(diffMins)} min${task.time ? ` (${task.time})` : ""}`,
        `created-${task.id}`
      );
    }
  }, []);

  return { requestPermission, notifyCreated };
}

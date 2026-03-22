import { motion } from "framer-motion";
import { Calendar, Clock, Plus } from "lucide-react";

import { stagger, fadeUp } from "@/lib/animations";

const hours = Array.from({ length: 14 }, (_, i) => i + 7);
const days = ["Lun 22", "Mar 23", "Mer 24", "Jeu 25", "Ven 26", "Sam 27", "Dim 28"];

const events = [
  { title: "Daily standup", day: 0, start: 9, duration: 0.5, color: "#6366F1", type: "meeting" },
  { title: "Deep work — SaaS", day: 0, start: 10, duration: 2, color: "#06B6D4", type: "focus" },
  { title: "Call client Meridian", day: 0, start: 14, duration: 1, color: "#6366F1", type: "meeting" },
  { title: "Contenu — Tournage", day: 1, start: 10, duration: 3, color: "#EC4899", type: "creative" },
  { title: "Review agents IA", day: 1, start: 15, duration: 1, color: "#06B6D4", type: "focus" },
  { title: "Gym", day: 2, start: 7, duration: 1, color: "#10B981", type: "personal" },
  { title: "Strat meeting agence", day: 2, start: 11, duration: 1.5, color: "#6366F1", type: "meeting" },
  { title: "Deep work — Contenu", day: 3, start: 9, duration: 3, color: "#06B6D4", type: "focus" },
  { title: "Deadline: Proposition Meridian", day: 4, start: 17, duration: 0.5, color: "#EF4444", type: "deadline" },
];

export default function AgendaPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5 max-w-7xl mx-auto">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Agenda</h2>
          <span className="chip-indigo">Semaine 13</span>
        </div>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all active:scale-[0.97] shadow-sm">
          <Plus className="w-4 h-4" /> Événement
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="glass-card p-4 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 mb-2">
            <div />
            {days.map((day, i) => (
              <div key={day} className={`text-center text-xs font-medium py-2 rounded-xl ${i === 0 ? "bg-primary/8 text-primary" : "text-muted-foreground"}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-0 relative">
            {hours.map((hour) => (
              <div key={hour} className="contents">
                <div className="h-12 flex items-start justify-end pr-2 text-[11px] text-muted-foreground font-mono-data -mt-2">
                  {hour}:00
                </div>
                {days.map((_, dayIdx) => (
                  <div key={dayIdx} className="h-12 border-t border-border/30 relative">
                    {events
                      .filter((e) => e.day === dayIdx && e.start === hour)
                      .map((event, i) => (
                        <div
                          key={i}
                          className="absolute inset-x-1 rounded-xl px-2 py-1 text-xs font-medium cursor-pointer hover:brightness-105 transition-all z-10 overflow-hidden"
                          style={{
                            top: 0,
                            height: `${event.duration * 48}px`,
                            background: `${event.color}12`,
                            borderLeft: `2px solid ${event.color}`,
                            color: event.color,
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

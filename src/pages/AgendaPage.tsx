import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";
import type { CalendarEvent } from "@/lib/mock-data";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7h → 21h
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

function getWeekDays(baseDate: Date) {
  const d = new Date(baseDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function isToday(date: Date) {
  const t = new Date();
  return date.getDate() === t.getDate() &&
    date.getMonth() === t.getMonth() &&
    date.getFullYear() === t.getFullYear();
}

// Données vides — à connecter à Supabase
const events: CalendarEvent[] = [];

export default function AgendaPage() {
  const { activeBusiness } = useBusiness();
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const monthLabel = `${MONTH_FR[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;

  return (
    <div className="space-y-4 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5" style={{ color: activeBusiness.accent }} />
          <h1 className="text-lg font-semibold text-white/90">Planning</h1>
          <span
            className="text-xs px-2.5 py-1 rounded-lg font-medium"
            style={{ background: `${activeBusiness.accent}20`, color: activeBusiness.accent }}
          >
            {monthLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-xs px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white ml-2"
            style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
          >
            <Plus className="w-3.5 h-3.5" />
            Événement
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Day headers */}
        <div className="grid border-b" style={{ gridTemplateColumns: "52px repeat(7, 1fr)", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="py-3" />
          {weekDays.map((date, i) => (
            <div key={i} className="py-3 text-center">
              <div className="text-[11px] text-white/40 font-medium uppercase tracking-wide">{DAYS_FR[i]}</div>
              <div
                className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                  isToday(date)
                    ? "text-white"
                    : "text-white/70"
                }`}
                style={isToday(date) ? { background: activeBusiness.accent } : {}}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="grid"
              style={{
                gridTemplateColumns: "52px repeat(7, 1fr)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Hour label */}
              <div className="py-3 pr-2 text-right text-[11px] text-white/25 font-mono select-none">
                {hour}:00
              </div>
              {/* Day cells */}
              {weekDays.map((date, di) => {
                const dayEvents = events.filter(e => {
                  const d = new Date(e.start);
                  return d.getDate() === date.getDate() &&
                    d.getMonth() === date.getMonth() &&
                    d.getHours() === hour;
                });
                return (
                  <div
                    key={di}
                    className="h-12 relative border-l group cursor-pointer hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    {dayEvents.map(ev => (
                      <div
                        key={ev.id}
                        className="absolute inset-x-1 top-0 rounded-lg px-2 py-1 text-[11px] font-medium z-10"
                        style={{
                          background: `${ev.color || activeBusiness.accent}20`,
                          borderLeft: `2px solid ${ev.color || activeBusiness.accent}`,
                          color: ev.color || activeBusiness.accent,
                        }}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {/* Hover add hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3 text-white/20" />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="text-white/30 text-sm">Aucun événement cette semaine</p>
          <p className="text-white/20 text-xs mt-1">Clique sur une cellule ou sur "+ Événement" pour commencer</p>
        </div>
      )}
    </div>
  );
}

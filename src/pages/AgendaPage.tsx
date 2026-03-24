import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, Link } from "lucide-react";
import { useBusiness } from "@/lib/businessContext";
import {
  initGoogleAuth,
  listCalendarEvents,
  getAuthUrl,
  isAuthenticated,
  clearTokens,
  type GCalEvent,
} from "@/lib/googleCalendar";

const HOURS    = Array.from({ length: 15 }, (_, i) => i + 7); // 7h → 21h
const DAYS_FR  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

function getWeekDays(baseDate: Date) {
  const d   = new Date(baseDate);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(mon);
    date.setDate(mon.getDate() + i);
    return date;
  });
}

function isToday(date: Date) {
  const t = new Date();
  return date.getDate() === t.getDate() &&
    date.getMonth()     === t.getMonth() &&
    date.getFullYear()  === t.getFullYear();
}

/** Extract the hour (0–23) from a GCalEvent start. Returns null for all-day events. */
function eventHour(ev: GCalEvent): number | null {
  if (ev.start.dateTime) return new Date(ev.start.dateTime).getHours();
  return null; // all-day
}

/** Extract the date string "yyyy-mm-dd" from a GCalEvent start. */
function eventDate(ev: GCalEvent): string {
  if (ev.start.dateTime) return ev.start.dateTime.split("T")[0];
  if (ev.start.date)     return ev.start.date;
  return "";
}

/** Format a GCalEvent start time as "HH:MM". Returns "" for all-day. */
function eventTime(ev: GCalEvent): string {
  if (!ev.start.dateTime) return "";
  const d = new Date(ev.start.dateTime);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function toISOWeekRange(days: Date[]): { min: string; max: string } {
  const first = new Date(days[0]);
  first.setHours(0, 0, 0, 0);
  const last = new Date(days[6]);
  last.setHours(23, 59, 59, 999);
  return { min: first.toISOString(), max: last.toISOString() };
}

export default function AgendaPage() {
  const { activeBusiness } = useBusiness();
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekDays = getWeekDays(currentDate);

  const [connected, setConnected]   = useState(false);
  const [gcalEvents, setGcalEvents] = useState<GCalEvent[]>([]);
  const [loadingGcal, setLoadingGcal] = useState(false);

  // ── Init: handle OAuth callback & check auth state ──────────────────────────
  useEffect(() => {
    initGoogleAuth().then(authed => {
      setConnected(authed);
    });
  }, []);

  // ── Fetch events whenever week or auth state changes ────────────────────────
  useEffect(() => {
    if (!connected) { setGcalEvents([]); return; }
    const { min, max } = toISOWeekRange(weekDays);
    setLoadingGcal(true);
    listCalendarEvents(min, max)
      .then(evs => setGcalEvents(evs))
      .catch(() => setGcalEvents([]))
      .finally(() => setLoadingGcal(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, currentDate]);

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

  const handleConnect = async () => {
    const url = await getAuthUrl();
    window.location.href = url;
  };

  const handleDisconnect = () => {
    clearTokens();
    setConnected(false);
    setGcalEvents([]);
  };

  const monthLabel = `${MONTH_FR[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;

  // Split events into timed vs all-day for display
  const allDayEvents  = gcalEvents.filter(ev => !ev.start.dateTime);
  const timedEvents   = gcalEvents.filter(ev => !!ev.start.dateTime);

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
          {loadingGcal && (
            <span className="text-xs text-white/30 animate-pulse">Syncing…</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Google Calendar connect / disconnect */}
          {connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 transition-colors"
            >
              <Link className="w-3 h-3" />
              Google Cal ✓
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: "#4285F420",
                color: "#4285F4",
                border: "1px solid #4285F440",
              }}
            >
              <Link className="w-3 h-3" />
              Connecter Google Calendar
            </button>
          )}

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
            onClick={() => window.open("https://calendar.google.com/calendar/r/eventnew?authuser=hugo@agencemade.com", "_blank")}
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
                className="text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors"
                style={isToday(date) ? { background: activeBusiness.accent, color: "#fff" } : { color: "rgba(255,255,255,0.7)" }}
              >
                {date.getDate()}
              </div>
              {/* All-day events for this day */}
              {allDayEvents
                .filter(ev => eventDate(ev) === date.toISOString().split("T")[0])
                .map(ev => (
                  <div
                    key={ev.id}
                    title={ev.summary}
                    className="mx-1 mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                    style={{
                      background: "#4285F420",
                      borderLeft: "2px solid #4285F4",
                      color: "#7aabff",
                    }}
                  >
                    {ev.summary}
                  </div>
                ))}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 310px)" }}>
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
                const dayStr   = date.toISOString().split("T")[0];
                const dayEvs   = timedEvents.filter(ev => eventDate(ev) === dayStr && eventHour(ev) === hour);

                return (
                  <div
                    key={di}
                    className="h-12 relative border-l group cursor-pointer hover:bg-white/[0.02] transition-colors"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    {dayEvs.map(ev => (
                      <div
                        key={ev.id}
                        title={`${eventTime(ev)} · ${ev.summary}`}
                        className="absolute inset-x-1 top-0 rounded-lg px-2 py-1 text-[11px] font-medium z-10 overflow-hidden"
                        style={{
                          background:  "#4285F420",
                          borderLeft:  "2px solid #4285F4",
                          color:       "#7aabff",
                        }}
                      >
                        <span className="opacity-70 mr-1">{eventTime(ev)}</span>
                        <span className="truncate">{ev.summary}</span>
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

      {/* Empty / connect state */}
      {!connected && (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="text-white/30 text-sm">Aucun agenda connecté</p>
          <p className="text-white/20 text-xs mt-1">
            Connecte Google Calendar pour voir tes événements ici
          </p>
          <button
            onClick={handleConnect}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "#4285F420",
              color: "#4285F4",
              border: "1px solid #4285F440",
            }}
          >
            <Link className="w-4 h-4" />
            Connecter Google Calendar
          </button>
        </div>
      )}

      {connected && gcalEvents.length === 0 && !loadingGcal && (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-white/15" />
          <p className="text-white/30 text-sm">Aucun événement cette semaine</p>
          <p className="text-white/20 text-xs mt-1">Clique sur une cellule ou sur "+ Événement" pour commencer</p>
        </div>
      )}
    </div>
  );
}

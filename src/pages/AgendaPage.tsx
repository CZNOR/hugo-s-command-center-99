import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, Link, Phone, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBusiness } from "@/lib/businessContext";
import { useTasks } from "@/lib/taskContext";
import {
  initGoogleAuth,
  listCalendarEvents,
  getAuthUrl,
  isAuthenticated,
  clearTokens,
  type GCalEvent,
} from "@/lib/googleCalendar";
import {
  loadManualCalls,
  addManualCall,
  deleteManualCall,
  type ManualCall,
} from "@/lib/manualCalls";

const HOURS    = Array.from({ length: 15 }, (_, i) => i + 7); // 7h → 21h
const DAYS_FR  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
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

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth()     === b.getMonth() &&
    a.getFullYear()  === b.getFullYear();
}

function eventHour(ev: GCalEvent): number | null {
  if (ev.start.dateTime) return new Date(ev.start.dateTime).getHours();
  return null;
}

function eventDate(ev: GCalEvent): string {
  if (ev.start.dateTime) return ev.start.dateTime.split("T")[0];
  if (ev.start.date)     return ev.start.date;
  return "";
}

function eventTime(ev: GCalEvent): string {
  if (!ev.start.dateTime) return "";
  const d = new Date(ev.start.dateTime);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function toISOWeekRange(days: Date[]): { min: string; max: string } {
  const first = new Date(days[0]); first.setHours(0, 0, 0, 0);
  const last  = new Date(days[6]); last.setHours(23, 59, 59, 999);
  return { min: first.toISOString(), max: last.toISOString() };
}

const BIZ_COLORS: Record<string, string> = {
  coaching: "#7c3aed", casino: "#00cc44", content: "#f97316", equipe: "#3b82f6",
};

export default function AgendaPage() {
  const { activeBusiness } = useBusiness();
  const { tasks } = useTasks();
  const [currentDate,   setCurrentDate]   = useState(new Date());
  const [selectedDay,   setSelectedDay]   = useState(new Date()); // mobile day view
  const [connected,     setConnected]     = useState(false);
  const [gcalEvents,    setGcalEvents]    = useState<GCalEvent[]>([]);
  const [loadingGcal,   setLoadingGcal]   = useState(false);
  const [manualCalls,   setManualCalls]   = useState<ManualCall[]>([]);
  const [showCallModal, setShowCallModal] = useState(false);
  const dayStripRef = useRef<HTMLDivElement>(null);

  const weekDays = getWeekDays(currentDate);

  useEffect(() => {
    initGoogleAuth().then(authed => setConnected(authed));
    loadManualCalls().then(setManualCalls);
  }, []);

  const refreshManualCalls = () => loadManualCalls().then(setManualCalls);

  const handleDeleteManualCall = async (id: string) => {
    await deleteManualCall(id);
    refreshManualCalls();
    toast.success("Appel supprimé");
  };

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

  // Scroll selected day into view in the strip
  useEffect(() => {
    if (!dayStripRef.current) return;
    const idx = weekDays.findIndex(d => isSameDay(d, selectedDay));
    if (idx < 0) return;
    const child = dayStripRef.current.children[idx] as HTMLElement;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDay]);

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };

  const prevDay = () => { const d = new Date(selectedDay); d.setDate(d.getDate() - 1); setSelectedDay(d); setCurrentDate(d); };
  const nextDay = () => { const d = new Date(selectedDay); d.setDate(d.getDate() + 1); setSelectedDay(d); setCurrentDate(d); };
  const goToday = () => { setCurrentDate(new Date()); setSelectedDay(new Date()); };

  const handleConnect    = async () => { const url = await getAuthUrl(); window.location.href = url; };
  const handleDisconnect = () => { clearTokens(); setConnected(false); setGcalEvents([]); };

  const monthLabel = `${MONTH_FR[weekDays[0].getMonth()]} ${weekDays[0].getFullYear()}`;
  const allDayEvents = gcalEvents.filter(ev => !ev.start.dateTime);
  const timedEvents  = gcalEvents.filter(ev => !!ev.start.dateTime);

  // ── Shared: events for a given day+hour ──
  const getEventsForSlot = (date: Date, hour: number) => {
    const dayStr = date.toISOString().split("T")[0];
    const gcal   = timedEvents.filter(ev => eventDate(ev) === dayStr && eventHour(ev) === hour);
    const taskEvs = tasks.filter(t => {
      if (!t.deadline || !t.time) return false;
      return t.deadline === dayStr && parseInt(t.time.split(":")[0]) === hour;
    });
    // Manual calls are stored with local date (YYYY-MM-DD) and time (HH:MM). We
    // rebuild a comparable day string from the slot's local Date so the comparison
    // is also local (avoids the UTC drift `toISOString()` would introduce).
    const slotLocalDay = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const mcs = manualCalls.filter(mc => {
      if (!mc.date || !mc.time) return false;
      const h = parseInt(mc.time.split(":")[0] ?? "0", 10);
      return mc.date === slotLocalDay && h === hour;
    });
    return { gcal, taskEvs, mcs };
  };

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: activeBusiness.accent }} />
          <h1 className="text-lg font-semibold text-white/90">Planning</h1>
          <span className="text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0"
            style={{ background: `${activeBusiness.accent}20`, color: activeBusiness.accent }}>
            {monthLabel}
          </span>
          {loadingGcal && <span className="text-xs text-white/30 animate-pulse">Sync…</span>}
        </div>

        <div className="flex items-center gap-1.5">
          {connected ? (
            <button onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/50 border border-white/10">
              <Link className="w-3 h-3" /> Google Cal ✓
            </button>
          ) : (
            <button onClick={handleConnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: "#4285F420", color: "#4285F4", border: "1px solid #4285F440" }}>
              <Link className="w-3 h-3" /> Google Cal
            </button>
          )}

          {/* Desktop week nav */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={prevWeek} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10">
              Aujourd'hui
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowCallModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.35)" }}
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Appel</span>
          </button>

          <button
            onClick={() => window.open("https://calendar.google.com/calendar/r/eventnew?authuser=hugo@agencemade.com", "_blank")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: activeBusiness.gradient, boxShadow: `0 4px 12px ${activeBusiness.glow}` }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Événement</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* ══ MOBILE VIEW ════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* Day picker strip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
        }}>
          <button onClick={prevDay} style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.6)", cursor: "pointer",
          }}>
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>

          <div ref={dayStripRef} style={{
            flex: 1, display: "flex", gap: 6, overflowX: "auto",
            scrollbarWidth: "none", padding: "2px 0",
          }}>
            {weekDays.map((day, i) => {
              const selected = isSameDay(day, selectedDay);
              const today    = isToday(day);
              return (
                <button key={i} onClick={() => setSelectedDay(new Date(day))} style={{
                  flexShrink: 0, width: 44, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 4,
                  padding: "8px 0", borderRadius: 12, cursor: "pointer",
                  background: selected
                    ? activeBusiness.accent
                    : today
                    ? `${activeBusiness.accent}20`
                    : "rgba(255,255,255,0.04)",
                  border: selected ? "none"
                    : today ? `1px solid ${activeBusiness.accent}50`
                    : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.15s ease",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: selected ? "#fff" : today ? activeBusiness.accent : "rgba(255,255,255,0.4)",
                  }}>{DAYS_FR[i]}</span>
                  <span style={{
                    fontSize: 16, fontWeight: 800, lineHeight: 1,
                    color: selected ? "#fff" : today ? activeBusiness.accent : "rgba(255,255,255,0.75)",
                  }}>{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <button onClick={nextDay} style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.6)", cursor: "pointer",
          }}>
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Day label */}
        <div style={{ marginBottom: 12, display: "flex", alignItems: "baseline", gap: 8 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
            {DAYS_FULL[(selectedDay.getDay() + 6) % 7]}
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            {selectedDay.getDate()} {MONTH_FR[selectedDay.getMonth()]}
          </p>
          {isToday(selectedDay) && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: activeBusiness.accent,
              background: `${activeBusiness.accent}18`,
              borderRadius: 20, padding: "2px 8px",
            }}>Aujourd'hui</span>
          )}
        </div>

        {/* All-day events for selected day */}
        {(() => {
          const dayStr = selectedDay.toISOString().split("T")[0];
          const evs = allDayEvents.filter(ev => eventDate(ev) === dayStr);
          if (evs.length === 0) return null;
          return (
            <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              {evs.map(ev => (
                <div key={ev.id} style={{
                  padding: "7px 12px", borderRadius: 8,
                  background: "#4285F420", borderLeft: "3px solid #4285F4",
                  fontSize: 13, color: "#7aabff", fontWeight: 600,
                }}>{ev.summary}</div>
              ))}
            </div>
          );
        })()}

        {/* Time slots — single day */}
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {HOURS.map((hour, hi) => {
            const { gcal, taskEvs, mcs } = getEventsForSlot(selectedDay, hour);
            const hasContent = gcal.length > 0 || taskEvs.length > 0 || mcs.length > 0;
            return (
              <div key={hour} style={{
                display: "flex", alignItems: "flex-start",
                borderBottom: hi < HOURS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                background: hasContent ? "rgba(255,255,255,0.02)" : "transparent",
                minHeight: hasContent ? "auto" : 48,
              }}>
                {/* Hour label */}
                <div style={{
                  width: 48, flexShrink: 0, padding: "14px 8px 0 12px",
                  fontSize: 12, color: "rgba(255,255,255,0.25)", fontFamily: "monospace",
                  textAlign: "right",
                }}>
                  {hour}:00
                </div>
                {/* Events */}
                <div style={{
                  flex: 1, padding: hasContent ? "6px 12px 6px 10px" : "0 12px",
                  display: "flex", flexDirection: "column", gap: 4,
                  borderLeft: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {gcal.map(ev => (
                    <div key={ev.id} style={{
                      padding: "7px 10px", borderRadius: 8,
                      background: "#4285F420", borderLeft: "3px solid #4285F4",
                      fontSize: 13, color: "#7aabff", fontWeight: 600,
                    }}>
                      <span style={{ opacity: 0.6, marginRight: 6, fontSize: 12 }}>{eventTime(ev)}</span>
                      {ev.summary}
                    </div>
                  ))}
                  {taskEvs.map(t => {
                    const color = BIZ_COLORS[t.business] ?? "#a855f7";
                    return (
                      <div key={t.id} style={{
                        padding: "7px 10px", borderRadius: 8,
                        background: t.status === "done" ? "rgba(255,255,255,0.04)" : `${color}20`,
                        borderLeft: `3px solid ${t.status === "done" ? "rgba(255,255,255,0.12)" : color}`,
                        fontSize: 13, fontWeight: 600,
                        color: t.status === "done" ? "rgba(255,255,255,0.25)" : `${color}ee`,
                        textDecoration: t.status === "done" ? "line-through" : "none",
                        opacity: t.status === "done" ? 0.5 : 1,
                      }}>
                        <span style={{ opacity: 0.6, marginRight: 6, fontSize: 12 }}>{t.time}</span>
                        {t.title}
                      </div>
                    );
                  })}
                  {mcs.map(mc => (
                    <div key={mc.id} style={{
                      padding: "7px 10px", borderRadius: 8,
                      background: "rgba(34,197,94,0.15)", borderLeft: "3px solid #22c55e",
                      fontSize: 13, fontWeight: 600, color: "#86efac",
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <Phone style={{ width: 11, height: 11, flexShrink: 0 }} />
                      <span style={{ opacity: 0.7, fontSize: 12 }}>{mc.time}</span>
                      <span style={{ flex: 1 }}>{mc.clientName}</span>
                      <span style={{ opacity: 0.5, fontSize: 10, textTransform: "uppercase" }}>{mc.business}</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteManualCall(mc.id); }}
                        style={{ background: "none", border: "none", color: "#86efac", opacity: 0.5, cursor: "pointer" }}
                        title="Supprimer"
                      >
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Connect prompt */}
        {!connected && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>Aucun agenda connecté</p>
            <button onClick={handleConnect} style={{
              marginTop: 12,
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 20px", borderRadius: 12,
              background: "#4285F420", color: "#4285F4",
              border: "1px solid #4285F440", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              <Link style={{ width: 16, height: 16 }} /> Connecter Google Calendar
            </button>
          </div>
        )}
      </div>

      {/* ══ DESKTOP VIEW ═══════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
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
                {allDayEvents
                  .filter(ev => eventDate(ev) === date.toISOString().split("T")[0])
                  .map(ev => (
                    <div key={ev.id} title={ev.summary}
                      className="mx-1 mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium truncate"
                      style={{ background: "#4285F420", borderLeft: "2px solid #4285F4", color: "#7aabff" }}>
                      {ev.summary}
                    </div>
                  ))}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 310px)" }}>
            {HOURS.map((hour) => (
              <div key={hour} className="grid"
                style={{ gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="py-3 pr-2 text-right text-[11px] text-white/25 font-mono select-none">
                  {hour}:00
                </div>
                {weekDays.map((date, di) => {
                  const { gcal, taskEvs, mcs } = getEventsForSlot(date, hour);
                  return (
                    <div key={di} className="h-12 relative border-l group cursor-pointer hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                      {gcal.map(ev => (
                        <div key={ev.id} title={`${eventTime(ev)} · ${ev.summary}`}
                          className="absolute inset-x-1 top-0 rounded-lg px-2 py-1 text-[11px] font-medium z-10 overflow-hidden"
                          style={{ background: "#4285F420", borderLeft: "2px solid #4285F4", color: "#7aabff" }}>
                          <span className="opacity-70 mr-1">{eventTime(ev)}</span>
                          <span className="truncate">{ev.summary}</span>
                        </div>
                      ))}
                      {taskEvs.map(t => {
                        const color = BIZ_COLORS[t.business] ?? "#a855f7";
                        return (
                          <div key={t.id} title={`${t.time} · ${t.title}`}
                            className="absolute inset-x-1 rounded-lg px-2 py-1 text-[11px] font-medium z-10 overflow-hidden"
                            style={{
                              top: gcal.length > 0 ? "50%" : "0",
                              background: t.status === "done" ? "rgba(255,255,255,0.04)" : `${color}20`,
                              borderLeft: `2px solid ${t.status === "done" ? "rgba(255,255,255,0.15)" : color}`,
                              color: t.status === "done" ? "rgba(255,255,255,0.25)" : `${color}ee`,
                              textDecoration: t.status === "done" ? "line-through" : "none",
                              opacity: t.status === "done" ? 0.4 : 1,
                            }}>
                            <span className="opacity-70 mr-1">{t.time}</span>
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}
                      {mcs.map(mc => (
                        <div key={mc.id} title={`📞 ${mc.time} · ${mc.clientName} (${mc.business})`}
                          className="absolute inset-x-1 rounded-lg px-2 py-1 text-[11px] font-medium z-10 overflow-hidden flex items-center gap-1"
                          style={{
                            top: gcal.length + taskEvs.length > 0 ? "66%" : "0",
                            background: "rgba(34,197,94,0.18)",
                            borderLeft: "2px solid #22c55e", color: "#86efac",
                          }}>
                          <Phone className="w-2.5 h-2.5 opacity-70 flex-shrink-0" />
                          <span className="truncate">{mc.clientName}</span>
                        </div>
                      ))}
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

        {!connected && (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 mx-auto mb-3 text-white/15" />
            <p className="text-white/30 text-sm">Aucun agenda connecté</p>
            <p className="text-white/20 text-xs mt-1">Connecte Google Calendar pour voir tes événements ici</p>
            <button onClick={handleConnect}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#4285F420", color: "#4285F4", border: "1px solid #4285F440" }}>
              <Link className="w-4 h-4" /> Connecter Google Calendar
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

      {/* Manual call modal */}
      {showCallModal && (
        <ManualCallModal
          defaultDate={selectedDay}
          onClose={() => setShowCallModal(false)}
          onSaved={() => { refreshManualCalls(); setShowCallModal(false); }}
        />
      )}

    </div>
  );
}

// ─── Modal: add a manual call ──────────────────────────────────────────────
function ManualCallModal({
  defaultDate, onClose, onSaved,
}: {
  defaultDate: Date;
  onClose: () => void;
  onSaved: () => void;
}) {
  const defaultDateStr =
    `${defaultDate.getFullYear()}-${String(defaultDate.getMonth() + 1).padStart(2, "0")}-${String(defaultDate.getDate()).padStart(2, "0")}`;
  const [clientName, setClientName] = useState("");
  const [date, setDate]             = useState(defaultDateStr);
  const [time, setTime]             = useState("14:00");
  const [durationMin, setDurationMin] = useState(30);
  const [business, setBusiness]     = useState<"agence" | "coaching" | "casino">("agence");
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);

  const canSubmit = clientName.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time);

  const handleSave = async () => {
    if (!canSubmit) {
      toast.error("Nom client + date + heure requis");
      return;
    }
    setSaving(true);
    try {
      await addManualCall({
        clientName: clientName.trim(),
        date, time, durationMin, business,
        notes: notes.trim() || undefined,
      });
      toast.success("Appel ajouté — rappel 5 min avant activé");
      onSaved();
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "#0d0d18", border: "1px solid rgba(34,197,94,0.25)",
          borderRadius: 16, padding: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ color: "#22c55e", fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Phone style={{ width: 16, height: 16 }} />
            Nouvel appel
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Client
            </label>
            <input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ex: Senek, Guibs, Delphine…"
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 14, outline: "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Heure
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark",
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Durée
              </label>
              <select
                value={durationMin}
                onChange={e => setDurationMin(parseInt(e.target.value, 10))}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              >
                {[15, 20, 30, 45, 60, 90].map(v => <option key={v} value={v}>{v} min</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Business
              </label>
              <select
                value={business}
                onChange={e => setBusiness(e.target.value as "agence" | "coaching" | "casino")}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              >
                <option value="agence">Agence</option>
                <option value="coaching">Coaching</option>
                <option value="casino">Casino</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contexte, points à aborder…"
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, outline: "none", resize: "vertical",
              }}
            />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleSave}
          disabled={!canSubmit || saving}
          style={{
            width: "100%", marginTop: 16, padding: "12px 16px", borderRadius: 10,
            background: canSubmit ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.06)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.3)",
            border: "none", fontSize: 14, fontWeight: 700,
            cursor: canSubmit ? "pointer" : "not-allowed",
            boxShadow: canSubmit ? "0 8px 24px rgba(34,197,94,0.3)" : "none",
          }}
        >
          {saving ? "Enregistrement…" : "Ajouter (rappel 5 min avant inclus)"}
        </button>
      </div>
    </div>
  );
}

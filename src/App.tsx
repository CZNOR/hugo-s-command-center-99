import { useCallback, useEffect, useState } from "react";
import { apiFetch, NEED_CODE_EVENT } from "@/lib/api";
import { fetchUpcomingCalls, TZ, type Call } from "@/lib/cal";
import { usePushSubscription } from "@/lib/usePushSubscription";
import AccessGate from "@/components/AccessGate";
import type { SuiviData } from "@/components/Suivi";
import { IcCalendar, IcCopy, IcLink, IcSun } from "@/components/Icons";
import Appels from "@/tabs/Appels";
import Point from "@/tabs/Point";
import Vinted from "@/tabs/Vinted";
import Liens from "@/tabs/Liens";

type Tab = "appels" | "point" | "vinted" | "liens";
const TABS: { id: Tab; label: string; Icon: () => JSX.Element }[] = [
  { id: "appels", label: "Appels", Icon: IcCalendar },
  { id: "point",  label: "Point",  Icon: IcSun },
  { id: "vinted", label: "Vinted", Icon: IcCopy },
  { id: "liens",  label: "Liens",  Icon: IcLink },
];
// Grand titre de chaque onglet : [blanc, lavande]
const TITLES: Record<Tab, [string, string]> = {
  appels: ["Mes", "appels"],
  point:  ["Point du", "jour"],
  vinted: ["Textes", "Vinted"],
  liens:  ["Liens", "en appel"],
};
const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1) as Tab;
  return TABS.some((t) => t.id === h) ? h : "appels";
};
const REFRESH_MS = 60_000;
const SUIVI_MS = 20_000; // le Mac envoie l'avancement toutes les 20 s

export default function App() {
  // L'écran de code ne s'affiche que si le serveur refuse vraiment (401) :
  // le jeton d'appareil (cookie d'un an) suffit, même si le stockage local est vidé.
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [callsErr, setCallsErr] = useState("");
  const [point, setPoint] = useState<{ markdown: string; updatedAt: string | null }>({ markdown: "", updatedAt: null });
  const [suivi, setSuivi] = useState<SuiviData>({});
  const [now, setNow] = useState(Date.now());
  const [toastMsg, setToastMsg] = useState("");
  const { status: pushStatus, error: pushError, subscribe } = usePushSubscription();

  // Un appel refusé (401) ramène à l'écran de code
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(NEED_CODE_EVENT, lock);
    return () => window.removeEventListener(NEED_CODE_EVENT, lock);
  }, []);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const load = useCallback(async () => {
    setNow(Date.now());
    fetchUpcomingCalls()
      .then((c) => { setCalls(c); setCallsErr(""); })
      .catch((e) => setCallsErr(String(e.message ?? e)));
    apiFetch("/api/point")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p && setPoint(p))
      .catch(() => {});
  }, []);

  // Avancement en direct : relu toutes les 20 s, seulement quand l'app est à l'écran
  const loadSuivi = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    apiFetch("/api/suivi")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setSuivi(d); setNow(Date.now()); } })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (locked) return;
    loadSuivi();
    const id = setInterval(loadSuivi, SUIVI_MS);
    document.addEventListener("visibilitychange", loadSuivi);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", loadSuivi); };
  }, [locked, loadSuivi]);

  // Chargement, puis rafraîchissement chaque minute et au retour dans l'app
  useEffect(() => {
    if (locked) return;
    load();
    const id = setInterval(load, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [locked, load]);

  const go = (t: Tab) => {
    window.location.hash = t === "appels" ? "" : t;
    setTab(t);
    window.scrollTo(0, 0);
  };

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 1400);
  };

  if (locked) return <AccessGate onDone={() => { setLocked(false); window.location.reload(); }} />;

  const date = new Date(now).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

  return (
    <div className="shell">
      <header className="top">
        <img className="icon" src="/icon-192.png" alt="Dring" />
        <span className="date">{date}</span>
      </header>
      <h1 className="title">{TITLES[tab][0]} <em>{TITLES[tab][1]}</em></h1>

      {tab === "appels" && (
        <Appels
          calls={calls}
          error={callsErr}
          point={point.markdown}
          now={now}
          pushStatus={pushStatus}
          pushError={pushError}
          onEnableNotif={subscribe}
          onOpenPoint={() => go("point")}
        />
      )}
      {tab === "point" && <Point markdown={point.markdown} updatedAt={point.updatedAt} suivi={suivi} now={now} />}
      {tab === "vinted" && <Vinted toast={toast} />}
      {tab === "liens" && <Liens toast={toast} />}

      {toastMsg && <div className="toast">{toastMsg}</div>}

      <nav className="nav">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}>
            <Icon />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

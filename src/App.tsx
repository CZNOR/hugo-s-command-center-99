import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, NEED_CODE_EVENT } from "@/lib/api";
import { fetchCancelledCalls, fetchPastCalls, fetchUpcomingCalls, TZ, type Call } from "@/lib/cal";
import type { Fiche, Suivi, Visite } from "@/lib/prospect";
import { usePushSubscription } from "@/lib/usePushSubscription";
import AccessGate from "@/components/AccessGate";
import type { SuiviData } from "@/components/Suivi";
import { IcCalendar, IcCopy, IcLink, IcSun } from "@/components/Icons";
import Appels from "@/tabs/Appels";
import Point from "@/tabs/Point";
import Vinted from "@/tabs/Vinted";
import Liens from "@/tabs/Liens";
import FicheProspect from "@/tabs/FicheProspect";

type Tab = "appels" | "point" | "vinted" | "liens";
const TABS: { id: Tab; label: string; Icon: () => JSX.Element }[] = [
  { id: "appels", label: "Appels", Icon: IcCalendar },
  { id: "point",  label: "Point",  Icon: IcSun },
  { id: "vinted", label: "Vinted", Icon: IcCopy },
  { id: "liens",  label: "Liens",  Icon: IcLink },
];
// Grand titre de chaque onglet
const TITLES: Record<Tab, string> = { appels: "Appels", point: "Point du jour", vinted: "Vinted", liens: "Liens" };
const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1) as Tab;
  return TABS.some((t) => t.id === h) ? h : "appels";
};
// Fiche prospect ouverte : #appel-<id de réservation Cal> (aussi le lien des notifs 1 h avant)
const ficheFromHash = (): number | null => {
  const m = window.location.hash.match(/^#appel-(\d+)$/);
  return m ? Number(m[1]) : null;
};
const RECENTS_JOURS = 7;
const SUIVI_JOURS = 45; // fiches chargées sur 45 jours : les relances courent jusqu'à J+30
const HISTO_MS = 5 * 60_000; // passé, annulations et visites : relus toutes les 5 min (au lieu de chaque minute)
const REFRESH_MS = 60_000;
const SUIVI_MS = 20_000; // le Mac envoie l'avancement toutes les 20 s

export default function App() {
  // L'écran de code ne s'affiche que si le serveur refuse vraiment (401) :
  // le jeton d'appareil (cookie d'un an) suffit, même si le stockage local est vidé.
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [callsErr, setCallsErr] = useState("");
  const [past, setPast] = useState<Call[]>([]);
  const [annulees, setAnnulees] = useState<Call[]>([]);
  const [visites, setVisites] = useState<Visite[]>([]);
  const [fiches, setFiches] = useState<Record<number, Fiche>>({});
  const [ficheId, setFicheId] = useState<number | null>(ficheFromHash);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const lastHisto = useRef(0);
  const pastRef = useRef<Call[]>([]);
  const [point, setPoint] = useState<{ markdown: string; updatedAt: string | null }>({ markdown: "", updatedAt: null });
  const [suivi, setSuivi] = useState<SuiviData>({});
  const [now, setNow] = useState(Date.now());
  // Sens du glissement entre écrans : vers la droite si on avance dans les onglets, fiche = « push »
  const [sens, setSens] = useState<"droite" | "gauche" | "push" | "pop">("droite");
  // Le grand titre se réduit en barre fine quand on fait défiler (comme les apps Apple)
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 56);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const [toastMsg, setToastMsg] = useState("");
  const { status: pushStatus, error: pushError, subscribe } = usePushSubscription();

  // Un appel refusé (401) ramène à l'écran de code
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(NEED_CODE_EVENT, lock);
    return () => window.removeEventListener(NEED_CODE_EVENT, lock);
  }, []);

  useEffect(() => {
    const onHash = () => { setTab(tabFromHash()); setFicheId(ficheFromHash()); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadVisites = useCallback(() => {
    apiFetch("/api/visite").then((r) => (r.ok ? r.json() : null)).then((v) => v && setVisites(v)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setNow(Date.now());
    // Les appels à venir chaque minute ; le reste (lourd, qui bouge peu) toutes les 5 min
    const histoAJour = Date.now() - lastHisto.current < HISTO_MS;
    const [up, pa] = await Promise.all([
      fetchUpcomingCalls().catch((e) => { setCallsErr(String(e.message ?? e)); return null; }),
      histoAJour ? Promise.resolve(pastRef.current) : fetchPastCalls().catch(() => pastRef.current),
    ]);
    if (up) { setCalls(up); setCallsErr(""); }
    if (!histoAJour) {
      lastHisto.current = Date.now();
      pastRef.current = pa;
      setPast(pa);
      fetchCancelledCalls().then(setAnnulees).catch(() => {});
      loadVisites();
    }
    // Fiches (source + suivi) des appels à venir et des 7 derniers jours
    const depuis = Date.now() - SUIVI_JOURS * 86_400_000;
    const ids = [...(up ?? []), ...pa.filter((c) => c.start.getTime() > depuis)].map((c) => c.id).slice(0, 60);
    if (ids.length) {
      apiFetch(`/api/prospect?ids=${ids.join(",")}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((f) => f && setFiches(f))
        .catch(() => {});
    }
    apiFetch("/api/point")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p && setPoint(p))
      .catch(() => {});
  }, [loadVisites]);

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

  const openFiche = (id: number | null) => {
    setSens(id ? "push" : "pop");
    window.location.hash = id ? `appel-${id}` : "";
    setFicheId(id);
    window.scrollTo(0, 0);
    if (id) loadVisites(); // visite toute fraîche (réservation faite il y a quelques minutes)
  };

  // Suivi après l'appel : mis à jour tout de suite à l'écran, puis enregistré
  // On envoie tout le suivi à chaque fois : deux taps rapides ne s'écrasent pas côté serveur.
  const saveFiche = (id: number, patch: Partial<Suivi>) => {
    const suivi: Suivi = { ...fiches[id]?.suivi, ...patch };
    setFiches((f) => ({ ...f, [id]: { ...f[id], suivi } }));
    // Enregistrements à la file : le serveur lit puis réécrit la fiche, deux envois simultanés se perdraient
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => apiFetch("/api/prospect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...suivi, frein: suivi.frein ?? null, rappel: suivi.rappel ?? "" }) }))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFiches((f) => ({ ...f, [id]: { ...f[id], suivi: d.suivi, historique: d.historique } })))
      .then(() => toast("Enregistré"))
      .catch(() => toast("Pas enregistré, réessaie"));
  };


  const go = (t: Tab) => {
    const ordre = TABS.map((x) => x.id);
    setSens(ordre.indexOf(t) >= ordre.indexOf(tab) ? "droite" : "gauche");
    setFicheId(null);
    window.location.hash = t === "appels" ? "" : t;
    setTab(t);
    window.scrollTo(0, 0);
  };

  const toast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 1400);
  };

  if (locked) return <AccessGate onDone={() => { setLocked(false); window.location.reload(); }} />;

  const fiche = ficheId ? [...(calls ?? []), ...past].find((c) => c.id === ficheId) ?? null : null;
  const date = new Date(now).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  const heure = Number(new Date(now).toLocaleTimeString("fr-FR", { hour: "2-digit", hour12: false, timeZone: TZ }).slice(0, 2));
  const salut = heure < 5 ? "Bonne nuit" : heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";
  const titreCourant = fiche ? fiche.name : TITLES[tab];

  return (
    <div className="shell">
      <div className={`mini-bar ${compact ? "visible" : ""}`} aria-hidden={!compact}>{titreCourant}</div>
      <main className={`view ${sens}`} key={fiche ? `fiche-${fiche.id}` : tab}>
      {fiche ? (
        <FicheProspect
          call={fiche}
          autres={[...(calls ?? []), ...past]}
          annulees={annulees}
          visites={visites}
          fiche={fiches[fiche.id] ?? {}}
          now={now}
          onBack={() => openFiche(null)}
          onSave={(patch) => saveFiche(fiche.id, patch)}
          toast={toast}
        />
      ) : (
        <header className="head">
          <p className="eyebrow">{salut} Hugo · {date}</p>
          <h1 className="title">{TITLES[tab]}</h1>
        </header>
      )}

      {!fiche && tab === "appels" && (
        <Appels
          calls={calls}
          error={callsErr}
          point={point.markdown}
          now={now}
          pushStatus={pushStatus}
          pushError={pushError}
          onEnableNotif={subscribe}
          onOpenPoint={() => go("point")}
          recents={past.filter((c) => c.start.getTime() > now - RECENTS_JOURS * 86_400_000)}
          suivis={past.filter((c) => c.start.getTime() > now - SUIVI_JOURS * 86_400_000)}
          fiches={fiches}
          onOpenFiche={openFiche}
        />
      )}
      {!fiche && tab === "point" && <Point markdown={point.markdown} updatedAt={point.updatedAt} suivi={suivi} now={now} />}
      {!fiche && tab === "vinted" && <Vinted toast={toast} />}
      {!fiche && tab === "liens" && <Liens toast={toast} />}
      </main>

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

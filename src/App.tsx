import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { apiFetch, NEED_CODE_EVENT } from "@/lib/api";
import { fetchCancelledCalls, fetchPastCalls, fetchUpcomingCalls, TZ, type Call } from "@/lib/cal";
import type { Fiche, Suivi, Visite } from "@/lib/prospect";
import { usePushSubscription } from "@/lib/usePushSubscription";
import AccessGate from "@/components/AccessGate";
import Notifs from "@/components/Notifs";
import type { SuiviData } from "@/components/Suivi";
import { IcCalendar, IcCheck, IcLink, IcRefresh, IcSun, IcTag } from "@/components/Icons";
import Appels from "@/tabs/Appels";
import Point from "@/tabs/Point";
import Vinted from "@/tabs/Vinted";
import Liens from "@/tabs/Liens";
import FicheProspect from "@/tabs/FicheProspect";

type Tab = "point" | "appels" | "vinted" | "liens";
const TABS: { id: Tab; label: string; titre: string; Icon: () => JSX.Element }[] = [
  { id: "point",  label: "Suivi",  titre: "Suivi", Icon: IcSun },
  { id: "appels", label: "Appels", titre: "Appels",        Icon: IcCalendar },
  { id: "vinted", label: "Vinted", titre: "Vinted",        Icon: IcTag },
  { id: "liens",  label: "Liens",  titre: "Liens",         Icon: IcLink },
];
const indexDe = (t: Tab) => TABS.findIndex((x) => x.id === t);
// Accueil = le Point. #appels, #vinted, #liens : un onglet ; #appel-<id Cal> : une fiche (lien des notifs 1 h avant)
const tabFromHash = (): Tab => {
  const h = window.location.hash.slice(1);
  if (/^appel-\d+$/.test(h)) return "appels";
  return TABS.some((t) => t.id === h) ? (h as Tab) : "point";
};
const ficheFromHash = (): number | null => {
  const m = window.location.hash.match(/^#appel-(\d+)$/);
  return m ? Number(m[1]) : null;
};

const RECENTS_JOURS = 7;
const SUIVI_JOURS = 45;     // fiches chargées sur 45 jours : les relances courent jusqu'à J+30
const APPELS_MS = 30_000;   // appels à venir, fiches et point : toutes les 30 s
const HISTO_MS = 2 * 60_000; // appels passés, annulations, visites : toutes les 2 min
const SUIVI_MS = 10_000;    // le Mac recalcule le Suivi toutes les 10 s

export default function App() {
  // L'écran de code ne s'affiche que si le serveur refuse vraiment (401) :
  // le jeton d'appareil (cookie d'un an) suffit, même si le stockage local est vidé.
  const [locked, setLocked] = useState(false);
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [ficheId, setFicheId] = useState<number | null>(ficheFromHash);
  const [calls, setCalls] = useState<Call[] | null>(null);
  const [callsErr, setCallsErr] = useState("");
  const [callsMaj, setCallsMaj] = useState(0);
  const [past, setPast] = useState<Call[]>([]);
  const [annulees, setAnnulees] = useState<Call[]>([]);
  const [visites, setVisites] = useState<Visite[]>([]);
  const [fiches, setFiches] = useState<Record<number, Fiche>>({});
  const [point, setPoint] = useState<{ markdown: string; updatedAt: string | null }>({ markdown: "", updatedAt: null });
  const [suivi, setSuivi] = useState<SuiviData>({});
  const [now, setNow] = useState(Date.now());
  const [compact, setCompact] = useState(false); // grand titre réduit en barre fine quand la page défile
  const [compactFiche, setCompactFiche] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const lastHisto = useRef(0);
  const pastRef = useRef<Call[]>([]);
  const pager = useRef<HTMLDivElement>(null);
  const pages = useRef<(HTMLElement | null)[]>([]);
  const pastilleNav = useRef<HTMLSpanElement>(null);
  const memes = useRef<Record<string, string>>({}); // dernière version reçue de chaque donnée : pas de rendu si rien n'a changé
  const ficheEl = useRef<HTMLDivElement>(null);
  const { status: pushStatus, error: pushError, subscribe } = usePushSubscription();

  // Un appel refusé (401) ramène à l'écran de code
  useEffect(() => {
    const lock = () => setLocked(true);
    window.addEventListener(NEED_CODE_EVENT, lock);
    return () => window.removeEventListener(NEED_CODE_EVENT, lock);
  }, []);

  // ── Données : tout se relit souvent, et tout de suite au retour dans l'app ──
  // Une donnée identique à la précédente ne redessine rien : l'app reste fluide pendant qu'on fait défiler.
  const nouveau = (cle: string, v: unknown) => {
    const k = JSON.stringify(v);
    if (memes.current[cle] === k) return false;
    memes.current[cle] = k;
    return true;
  };
  const loadVisites = useCallback(() => {
    apiFetch("/api/visite").then((r) => (r.ok ? r.json() : null)).then((v) => v && nouveau("visites", v) && setVisites(v)).catch(() => {});
  }, []);

  const load = useCallback(async (forcer = false) => {
    setNow(Date.now());
    const histoAJour = !forcer && Date.now() - lastHisto.current < HISTO_MS;
    const [up, pa] = await Promise.all([
      fetchUpcomingCalls().catch((e) => { setCallsErr(String(e.message ?? e)); return null; }),
      histoAJour ? Promise.resolve(pastRef.current) : fetchPastCalls().catch(() => pastRef.current),
    ]);
    if (up) { if (nouveau("calls", up)) setCalls(up); setCallsErr(""); setCallsMaj(Date.now()); }
    if (!histoAJour) {
      lastHisto.current = Date.now();
      pastRef.current = pa;
      if (nouveau("past", pa)) setPast(pa);
      fetchCancelledCalls().then((a) => nouveau("annulees", a) && setAnnulees(a)).catch(() => {});
      loadVisites();
    }
    // Fiches (source + suivi) des appels à venir et des 45 derniers jours
    const depuis = Date.now() - SUIVI_JOURS * 86_400_000;
    const ids = [...(up ?? []), ...pa.filter((c) => c.start.getTime() > depuis)].map((c) => c.id).slice(0, 60);
    await Promise.all([
      ids.length && apiFetch(`/api/prospect?ids=${ids.join(",")}`).then((r) => (r.ok ? r.json() : null)).then((f) => f && nouveau("fiches", f) && setFiches(f)).catch(() => {}),
      apiFetch("/api/point").then((r) => (r.ok ? r.json() : null)).then((p) => p && nouveau("point", p.markdown) && setPoint(p)).catch(() => {}),
    ]);
  }, [loadVisites]);

  const loadSuivi = useCallback(() =>
    apiFetch("/api/suivi").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { setSuivi(d); setNow(Date.now()); } }).catch(() => {}),
  []);

  useEffect(() => {
    if (locked) return;
    load(true);
    loadSuivi();
    const ids = [
      setInterval(() => document.visibilityState === "visible" && load(), APPELS_MS),
      setInterval(() => document.visibilityState === "visible" && loadSuivi(), SUIVI_MS),
      setInterval(() => setNow(Date.now()), 30_000), // l'heure qui avance (les « il y a 12 s » ont leur propre minuteur)
    ];
    const retour = () => { if (document.visibilityState === "visible") { load(true); loadSuivi(); } };
    document.addEventListener("visibilitychange", retour);
    return () => { ids.forEach(clearInterval); document.removeEventListener("visibilitychange", retour); };
  }, [locked, load, loadSuivi]);

  // ── Navigation : les 4 pages côte à côte, on glisse de l'une à l'autre ──
  // La pastille du menu suit le doigt ; l'onglet change quand la page est à moitié passée.
  const largeur = () => pager.current?.clientWidth || window.innerWidth;
  const tabRef = useRef(tab);
  tabRef.current = tab;
  useLayoutEffect(() => {
    if (locked || !pager.current) return;
    pager.current.scrollLeft = indexDe(tab) * largeur();
    placerPastille(indexDe(tab));
    const recaler = () => { if (pager.current) pager.current.scrollLeft = indexDe(tabRef.current) * largeur(); placerPastille(indexDe(tabRef.current)); };
    window.addEventListener("resize", recaler);
    return () => window.removeEventListener("resize", recaler);
  }, [locked]); // eslint-disable-line react-hooks/exhaustive-deps

  // La pastille du menu bouge par transformation (fluide, sans recalcul de mise en page)
  function placerPastille(pos: number) {
    const el = pastilleNav.current;
    if (!el?.parentElement) return;
    const pas = (el.parentElement.clientWidth - 20) / TABS.length;
    el.style.transform = `translateX(${(pos * pas).toFixed(1)}px)`;
  }
  const onPager = () => {
    const pos = (pager.current?.scrollLeft ?? 0) / largeur();
    placerPastille(pos);
    const t = TABS[Math.max(0, Math.min(TABS.length - 1, Math.round(pos)))].id;
    if (t !== tabRef.current) {
      tabRef.current = t;
      setTab(t);
      setCompact((pages.current[indexDe(t)]?.scrollTop ?? 0) > 56);
      history.replaceState(null, "", t === "point" ? location.pathname : `#${t}`);
    }
  };

  const go = (t: Tab) => {
    if (ficheId) fermerFiche();
    if (t === tab) { pages.current[indexDe(t)]?.scrollTo({ top: 0, behavior: "smooth" }); return; }
    pager.current?.scrollTo({ left: indexDe(t) * largeur(), behavior: "smooth" });
  };

  // ── Fiche prospect : s'ouvre par-dessus, se referme d'un glissement vers la droite ──
  const openFiche = useCallback((id: number) => {
    setFicheId(id);
    setCompactFiche(false);
    history.pushState(null, "", `#appel-${id}`);
    loadVisites(); // visite toute fraîche (réservation faite il y a quelques minutes)
  }, [loadVisites]);
  const fermerFiche = () => {
    setFicheId(null);
    history.replaceState(null, "", tab === "point" ? location.pathname : `#${tab}`);
  };
  useEffect(() => {
    const onHash = () => {
      const id = ficheFromHash();
      setFicheId(id);
      if (!id) { const t = tabFromHash(); pager.current?.scrollTo({ left: indexDe(t) * largeur() }); }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => { window.removeEventListener("hashchange", onHash); window.removeEventListener("popstate", onHash); };
  }, []);

  const doigt = useRef<{ x: number; y: number; dx: number; suit: boolean } | null>(null);
  const ficheTouch = {
    onTouchStart: (e: React.TouchEvent) => { const t = e.touches[0]; doigt.current = { x: t.clientX, y: t.clientY, dx: 0, suit: false }; },
    onTouchMove: (e: React.TouchEvent) => {
      const d = doigt.current, el = ficheEl.current;
      if (!d || !el) return;
      const t = e.touches[0], dx = t.clientX - d.x, dy = t.clientY - d.y;
      if (!d.suit && dx > 12 && dx > Math.abs(dy) * 1.4) d.suit = true;
      if (d.suit) { d.dx = Math.max(0, dx); el.style.transition = "none"; el.style.transform = `translateX(${d.dx}px)`; }
    },
    onTouchEnd: () => {
      const d = doigt.current, el = ficheEl.current;
      doigt.current = null;
      if (!d?.suit || !el) return;
      el.style.transition = "transform .3s cubic-bezier(.32,.72,0,1)";
      if (d.dx > largeur() * 0.3) { el.style.transform = "translateX(100%)"; setTimeout(fermerFiche, 280); }
      else el.style.transform = "";
    },
  };

  // Suivi après l'appel : mis à jour tout de suite à l'écran, puis enregistré
  // On envoie tout le suivi à chaque fois, à la file : deux taps rapides ne s'écrasent pas côté serveur.
  const saveFiche = (id: number, patch: Partial<Suivi>) => {
    const s: Suivi = { ...fiches[id]?.suivi, ...patch };
    setFiches((f) => ({ ...f, [id]: { ...f[id], suivi: s } }));
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => apiFetch("/api/prospect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...s, frein: s.frein ?? null, rappel: s.rappel ?? "" }) }))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFiches((f) => ({ ...f, [id]: { ...f[id], suivi: d.suivi, historique: d.historique } })))
      .then(() => toast("Enregistré"))
      .catch(() => toast("Pas enregistré, réessaie"));
  };

  // ── Tirer vers le bas, en haut d'une page : tout est relu tout de suite ──
  const ptr = useRef<HTMLDivElement>(null);
  const tire = useRef<{ x: number; y: number; d: number; actif: boolean } | null>(null);
  const [rafraichi, setRafraichi] = useState<"" | "charge" | "ok">("");
  const SEUIL = 64;
  const placer = (d: number, transition = false) => {
    const el = ptr.current;
    if (!el) return;
    el.style.transition = transition ? "transform .3s cubic-bezier(.32,.72,0,1), opacity .3s" : "none";
    el.style.transform = `translate(-50%, ${d}px) rotate(${d * 4}deg)`;
    el.style.opacity = String(Math.min(1, d / SEUIL));
    el.classList.toggle("pret", d >= SEUIL);
  };
  const rafraichir = async () => {
    setRafraichi("charge");
    placer(SEUIL, true);
    await Promise.all([load(true), loadSuivi(), new Promise((r) => setTimeout(r, 700))]);
    setRafraichi("ok");
    setTimeout(() => { placer(0, true); setRafraichi(""); }, 650);
  };
  const tirer = {
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
      if (e.currentTarget.scrollTop > 0 || rafraichi) return;
      const t = e.touches[0];
      tire.current = { x: t.clientX, y: t.clientY, d: 0, actif: false };
    },
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => {
      const g = tire.current;
      if (!g) return;
      const t = e.touches[0], dy = t.clientY - g.y, dx = t.clientX - g.x;
      if (!g.actif) {
        if (dy > 8 && dy > Math.abs(dx) * 1.3 && e.currentTarget.scrollTop <= 0) g.actif = true;
        else if (Math.abs(dx) > 8 || dy < -4) { tire.current = null; return; }
        else return;
      }
      g.d = Math.min(110, dy * 0.5);
      placer(g.d);
    },
    onTouchEnd: () => {
      const g = tire.current;
      tire.current = null;
      if (!g?.actif) return;
      if (g.d >= SEUIL) rafraichir(); else placer(0, true);
    },
  };

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 1400);
  }, []);

  // Listes dérivées gardées tant que rien ne change : les pages ne se redessinent pas pour rien
  const recents = useMemo(() => past.filter((c) => c.start.getTime() > now - RECENTS_JOURS * 86_400_000), [past, now]);
  const suivis = useMemo(() => past.filter((c) => c.start.getTime() > now - SUIVI_JOURS * 86_400_000), [past, now]);

  if (locked) return <AccessGate onDone={() => { setLocked(false); window.location.reload(); }} />;

  const tous = [...(calls ?? []), ...past];
  const fiche = ficheId ? tous.find((c) => c.id === ficheId) ?? null : null;
  const date = new Date(now).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  const heure = Number(new Date(now).toLocaleTimeString("fr-FR", { hour: "2-digit", hour12: false, timeZone: TZ }).slice(0, 2));
  const salut = heure < 5 ? "Bonne nuit" : heure < 12 ? "Bonjour" : heure < 18 ? "Bon après-midi" : "Bonsoir";

  const contenu = (t: Tab) => {
    switch (t) {
      case "point": return (
        <>
          <Notifs status={pushStatus} error={pushError} onEnable={subscribe} />
          <Point suivi={suivi} now={now} onOpenFiche={openFiche} />
        </>
      );
      case "appels": return <Appels calls={calls} error={callsErr} maj={callsMaj} now={now} recents={recents} suivis={suivis} fiches={fiches} onOpenFiche={openFiche} />;
      case "vinted": return <Vinted toast={toast} />;
      case "liens": return <Liens toast={toast} />;
    }
  };

  return (
    <div className="app" data-page={fiche ? "fiche" : tab}>
      <div className={`mini-bar ${(fiche ? compactFiche : compact) ? "visible" : ""}`} aria-hidden="true">{fiche ? fiche.name : TABS[indexDe(tab)].titre}</div>

      <div className="ecran">
        <div className={`ptr ${rafraichi}`} ref={ptr} aria-hidden="true">{rafraichi === "ok" ? <IcCheck /> : <IcRefresh />}</div>
        <div className="pager" ref={pager} onScroll={onPager}>
          {TABS.map((t, i) => (
            <section
              key={t.id} className="page" data-tab={t.id} aria-hidden={t.id !== tab}
              ref={(el) => { pages.current[i] = el; }}
              onScroll={(e) => t.id === tabRef.current && setCompact(e.currentTarget.scrollTop > 56)}
              {...tirer}
            >
              <div className="shell">
                <header className="head">
                  <p className="eyebrow">{salut} Hugo · {date}</p>
                  <h1 className="title">{t.titre}</h1>
                </header>
                {contenu(t.id)}
              </div>
            </section>
          ))}
        </div>

        {fiche && (
          <div className="fiche-couche" ref={ficheEl} key={fiche.id} {...ficheTouch} onScroll={(e) => setCompactFiche(e.currentTarget.scrollTop > 56)}>
            <div className="shell">
              <FicheProspect
                call={fiche} autres={tous} annulees={annulees} visites={visites}
                fiche={fiches[fiche.id] ?? {}} now={now}
                onBack={fermerFiche} onSave={(patch) => saveFiche(fiche.id, patch)} toast={toast}
              />
            </div>
          </div>
        )}
      </div>

      {toastMsg && <div className="toast">{toastMsg}</div>}

      <nav className="nav">
        <span className="nav-pastille" ref={pastilleNav} aria-hidden="true" />
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => go(id)}>
            <Icon />{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

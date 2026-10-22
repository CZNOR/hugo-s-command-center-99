import { useEffect, useState } from "react";
import { fmtDay, fmtTime, TZ, type Call } from "@/lib/cal";
import {
  alertes, duree, messageConfirmation, offre, pageLisible, provenanceLisible, questions, relances,
  RESULTATS, sourceLisible, visiteDe, type Fiche, type Resultat, type Visite,
} from "@/lib/prospect";
import CopyButton, { copyText } from "@/components/CopyButton";
import { IcPhone, IcVideo } from "@/components/Icons";

interface Props {
  call: Call;
  autres: Call[];        // tous les appels connus (pour compter ses appels précédents)
  annulees: Call[];      // réservations annulées (pour repérer qui annule souvent)
  visites: Visite[];     // visites du site envoyées par hugo-bnls.fr
  fiche: Fiche;
  now: number;
  onBack: () => void;
  onSave: (patch: { venu?: string; resultat?: string; note?: string }) => void;
  toast: (msg: string) => void;
}

const same = (a: string, b: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
const digits = (s?: string) => (s ?? "").replace(/\D/g, "").slice(-9);

export default function FicheProspect({ call: c, autres, annulees, visites, fiche, now, onBack, onSave, toast }: Props) {
  const [note, setNote] = useState(fiche.suivi?.note ?? "");
  useEffect(() => setNote(fiche.suivi?.note ?? ""), [fiche.suivi?.note]);

  const memePersonne = (o: Call) => o.id !== c.id && (same(o.email, c.email) || (!!digits(o.phone) && digits(o.phone) === digits(c.phone)));
  const annuls = annulees.filter(memePersonne);
  const al = [...alertes(c), ...(annuls.length ? [`A déjà annulé ${annuls.length} fois`] : [])];
  const visite = visiteDe(c, visites);
  const precedents = autres.filter((o) => o.start < c.start && memePersonne(o));
  const of = offre(c);
  const src = sourceLisible(fiche.source);
  const passe = c.start.getTime() <= now;
  const rel = relances(c, of);
  const reserve = c.createdAt?.toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });

  return (
    <>
      <button className="back" onClick={onBack}>‹ Appels</button>
      <h1 className="title fiche-name">{c.name}</h1>
      <p className="fiche-when">{fmtDay(c.start)} · {fmtTime(c.start)}{reserve && ` · réservé ${reserve}`}</p>
      <div className="badges">
        <span className="badge lav">{precedents.length ? `${precedents.length + 1}e appel` : "1er appel"}</span>
        {(visite || src) && <span className="badge green">{visite ? provenanceLisible(visite) : src!.split(" · ")[0]}</span>}
        {al.length > 0 && <span className="badge amber">À confirmer</span>}
      </div>

      {!passe && (c.meetingUrl || c.phone) && (
        <div className="btns">
          {c.meetingUrl && <a className="btn" href={c.meetingUrl} target="_blank" rel="noreferrer"><IcVideo />Rejoindre</a>}
          {c.phone && <a className="btn ghost-dark" href={`tel:${c.phone}`}><IcPhone />Appeler</a>}
        </div>
      )}

      {passe && (
        <>
          <h2 className="sh">Il est venu ?</h2>
          <div className="choices">
            {[["venu", "Venu"], ["absent", "Pas venu"]].map(([id, label]) => (
              <button key={id} className={fiche.suivi?.venu === id ? "on" : ""} onClick={() => onSave({ venu: id })}>{label}</button>
            ))}
          </div>
          <h2 className="sh">Résultat</h2>
          <div className="choices">
            {RESULTATS.map((r) => (
              <button key={r.id} className={fiche.suivi?.resultat === r.id ? "on" : ""} onClick={() => onSave({ resultat: r.id as Resultat })}>{r.label}</button>
            ))}
          </div>
          <h2 className="sh">Note</h2>
          <textarea
            className="note"
            value={note}
            placeholder="Ce qu'il a dit, ce qui bloque, quand le rappeler…"
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => note !== (fiche.suivi?.note ?? "") && onSave({ note })}
          />
          {fiche.suivi?.resultat && fiche.suivi.resultat !== "signe" && fiche.suivi.resultat !== "pas-interesse" && (
            <>
              <h2 className="sh">Relance J+1</h2>
              <div className="group"><div className="item msg-row"><p className="msg">{rel.j1}</p><CopyButton text={rel.j1} onCopied={() => toast("Message copié")} /></div></div>
              <h2 className="sh">Relance J+3</h2>
              <div className="group"><div className="item msg-row"><p className="msg">{rel.j3}</p><CopyButton text={rel.j3} onCopied={() => toast("Message copié")} /></div></div>
            </>
          )}
        </>
      )}

      {al.length > 0 && (
        <>
          <h2 className="sh">Signaux d'alerte</h2>
          <div className="alert-box"><ul>{al.map((a) => <li key={a}>{a}</li>)}</ul></div>
          {!passe && (
            <>
              <h2 className="sh">Message de confirmation</h2>
              <div className="group"><div className="item msg-row"><p className="msg">{messageConfirmation(c)}</p><CopyButton text={messageConfirmation(c)} onCopied={() => toast("Message copié")} /></div></div>
            </>
          )}
        </>
      )}

      <h2 className="sh">Ses réponses</h2>
      <div className="group">
        {c.answers.length ? c.answers.map((a) => (
          <div key={a.label} className="item kv"><span>{a.label}</span>{a.value}</div>
        )) : <p className="item empty">Pas de réponse au formulaire.</p>}
        {(c.email || c.phone) && <div className="item kv"><span>Contact</span>{[c.phone, c.email].filter(Boolean).join(" · ")}</div>}
      </div>

      <h2 className="sh">D'où il vient</h2>
      <div className="group">
        {visite && (
          <div className="item">
            <b>{provenanceLisible(visite)} · {visite.appareil}</b>
            <p className="item-sub">
              {duree(visite.duree_s)} sur le site · {visite.visites > 1 ? `${visite.visites}e visite (1re le ${new Date(visite.premiere).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })})` : "1re visite"}
              {visite.bouton && ` · a cliqué « ${visite.bouton} »`}
            </p>
          </div>
        )}
        {visite?.pages.filter((p) => p.page).map((p, i) => (
          <div key={i} className="item">
            <div className="item-head"><span>{pageLisible(p.page)}</span><span className="muted">{p.lu} % lu · {duree(p.s)}</span></div>
            <div className="bar"><i style={{ width: `${Math.max(3, p.lu)}%` }} /></div>
          </div>
        ))}
        {!!visite?.faq.length && (
          <div className="item"><span className="muted">FAQ ouverte :</span> {visite.faq.join(" · ")}</div>
        )}
        {(src || !visite) && (
          <div className="item">
            {src ? <span>Lien Cal : <b>{src}</b></span> : <span className="muted">Pas de visite du site retrouvée : il a sûrement réservé directement depuis le lien Cal.</span>}
          </div>
        )}
        {precedents.length > 0 && (
          <div className="item"><span className="muted">Appels précédents :</span> {precedents.map((p) => p.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: TZ })).join(", ")}</div>
        )}
      </div>

      <h2 className="sh">Offre conseillée</h2>
      {of ? (
        <div className="offer">
          <div className="offer-k">Selon son budget et son niveau</div>
          <div className="offer-n">{of.nom}</div>
          <div className="offer-p">{of.prix}</div>
          <p className="offer-why">{of.pourquoi}</p>
          <div className="btns stack">
            {of.liens.slice(0, 2).map((l, i) => (
              <button key={l.url} className={`btn ${i ? "ghost" : ""}`} onClick={async () => { if (await copyText(l.url)) toast("Lien de paiement copié"); }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="group"><p className="item muted">Budget sous 500 € : pas d'offre adaptée. Confirme d'abord sa venue et son budget.</p></div>
      )}

      <h2 className="sh">3 questions pour l'appel</h2>
      <div className="group">
        {questions(c).map((q, i) => (
          <div key={i} className="item q"><b>{i + 1}</b><span>{q}</span></div>
        ))}
      </div>

      {!!fiche.historique?.length && (
        <>
          <h2 className="sh">Historique</h2>
          <div className="group">
            {fiche.historique.slice().reverse().map((h, i) => (
              <div key={i} className="item kv">
                <span>{new Date(h.quand).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: TZ })}</span>
                {[h.venu === "venu" ? "Venu" : h.venu === "absent" ? "Pas venu" : null, RESULTATS.find((r) => r.id === h.resultat)?.label].filter(Boolean).join(" · ")}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

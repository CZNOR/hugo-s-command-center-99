import { useEffect, useState } from "react";
import { fmtDay, fmtTime, TZ, type Call } from "@/lib/cal";
import {
  alertes, duree, FREINS, messageConfirmation, MODALITES, offre, pageLisible, PRODUITS, provenanceLisible,
  questions, RESULTATS, sourceLisible, visiteDe, type Fiche, type Suivi, type Visite,
} from "@/lib/prospect";
import { etatMessage, lireNote, plan, quandLisible, suiviEffectif } from "@/lib/messages";
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
  onSave: (patch: Partial<Suivi>) => void;
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
  const su: Suivi = fiche.suivi ?? {};
  const deduit = suiviEffectif(su, c.end);   // note lue par rapport au jour de l'appel
  const pl = plan(c, deduit);
  const produitConseille = of?.nom === "Coaching +" ? "coaching" : "academie";
  const avecProduit = su.resultat === "interesse" || su.resultat === "relancer" || su.resultat === "signe";
  const avecFrein = su.resultat === "interesse" || su.resultat === "relancer" || su.resultat === "pas-interesse";
  const produit = deduit.produit ?? produitConseille;

  // À la sortie du champ note : on enregistre, et on devine frein et jour de rappel s'ils manquent
  const finNote = () => {
    if (note === (su.note ?? "")) return;
    const lu = lireNote(note, c.end);
    const patch: Partial<Suivi> = { note };
    const vus: string[] = [];
    if (lu.produit && !su.produit) { patch.produit = lu.produit; vus.push(PRODUITS.find((x) => x.id === lu.produit)?.label ?? ""); }
    if (lu.modalite && !su.modalite) { patch.modalite = lu.modalite; vus.push(lu.modalite === "3fois" ? "en 3 fois" : "en 1 fois"); }
    if (lu.frein && !su.frein) { patch.frein = lu.frein; vus.push(`frein « ${FREINS.find((f) => f.id === lu.frein)?.label.toLowerCase()} »`); }
    if (lu.rappel && !su.rappel) { patch.rappel = lu.rappel; vus.push(`rappel le ${new Date(lu.rappel + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" })}`); }
    onSave(patch);
    if (vus.length) toast(`Lu dans ta note : ${vus.join(", ")}`);
  };

  const basculerEnvoye = (id: string) => {
    const env = su.envoyes ?? [];
    onSave({ envoyes: env.includes(id) ? env.filter((x) => x !== id) : [...env, id] });
  };
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
        <section className="apres">
          <h2 className="sh">Il est venu ?</h2>
          <div className="choices">
            {[["venu", "Venu"], ["absent", "Pas venu"]].map(([id, label]) => (
              <button key={id} className={su.venu === id ? "on" : ""} onClick={() => onSave({ venu: id as Suivi["venu"] })}>{label}</button>
            ))}
          </div>

          {su.venu === "venu" && (
            <>
              <h2 className="sh">Résultat</h2>
              <div className="choices">
                {RESULTATS.map((r) => (
                  <button key={r.id} className={su.resultat === r.id ? "on" : ""} onClick={() => onSave({ resultat: r.id })}>{r.label}</button>
                ))}
              </div>
            </>
          )}

          {su.venu === "venu" && avecProduit && (
            <>
              <h2 className="sh">Pour quel produit{!su.produit && <span>{deduit.produit ? "lu dans ta note" : `conseillé : ${PRODUITS.find((x) => x.id === produitConseille)?.label}`}</span>}</h2>
              <div className="choices">
                {PRODUITS.map((x) => (
                  <button key={x.id} className={produit === x.id ? (su.produit ? "on" : "on soft") : ""}
                    onClick={() => onSave({ produit: x.id, modalite: x.id === "suivi" ? "echeances" : su.modalite === "echeances" ? "1fois" : su.modalite })}>{x.label}</button>
                ))}
              </div>
              <h2 className="sh">Paiement</h2>
              <div className="choices">
                {MODALITES.filter((m) => (produit === "suivi") === (m.id === "echeances")).map((m) => (
                  <button key={m.id} className={(su.modalite ?? deduit.modalite ?? (produit === "suivi" ? "echeances" : "1fois")) === m.id ? (su.modalite ? "on" : "on soft") : ""} onClick={() => onSave({ modalite: m.id })}>{m.label}</button>
                ))}
              </div>
            </>
          )}

          {su.venu === "venu" && avecFrein && (
            <>
              <h2 className="sh">Ce qui le bloque</h2>
              <div className="choices">
                {FREINS.map((f) => (
                  <button key={f.id} className={su.frein === f.id ? "on" : !su.frein && deduit.frein === f.id ? "on soft" : ""} onClick={() => onSave({ frein: su.frein === f.id ? undefined : f.id })}>{f.label}</button>
                ))}
              </div>
            </>
          )}

          {su.venu === "venu" && (su.resultat === "relancer" || su.resultat === "interesse") && (
            <>
              <h2 className="sh">Le recontacter le{su.rappel && <button className="link-btn" onClick={() => onSave({ rappel: undefined })}>effacer</button>}</h2>
              <input className="date-input" type="date" value={su.rappel ?? deduit.rappel ?? ""} onChange={(e) => onSave({ rappel: e.target.value || undefined })} />
            </>
          )}

          <h2 className="sh">Note</h2>
          <textarea
            className="note"
            value={note}
            placeholder="Ce qu'il a dit, ce qui bloque, « rappeler jeudi »… Je lis ta note pour adapter les messages."
            onChange={(e) => setNote(e.target.value)}
            onBlur={finNote}
          />

          {pl ? (
            <>
              <h2 className="sh">Tes 3 messages</h2>
              <p className="plan-resume">{pl.resume}</p>
              <div className="msgs">
                {pl.messages.map((m, i) => {
                  const etat = etatMessage(m, su, now);
                  return (
                    <div key={m.id} className={`msg-card ${etat}`}>
                      <div className="msg-head">
                        <span className="msg-num">{i + 1}</span>
                        <div className="msg-meta"><b>{m.titre}</b><span>{quandLisible(m.quand, now)}</span></div>
                        <span className={`msg-etat ${etat}`}>{etat === "envoye" ? "Envoyé" : etat === "retard" ? "En retard" : etat === "aujourdhui" ? "Aujourd'hui" : "Plus tard"}</span>
                      </div>
                      <p className="msg">{m.texte}</p>
                      <div className="msg-actions">
                        <button className="btn small" onClick={async () => { if (await copyText(m.texte)) toast("Message copié"); }}>Copier</button>
                        <button className={`btn small ghost-dark ${etat === "envoye" ? "done" : ""}`} onClick={() => basculerEnvoye(m.id)}>{etat === "envoye" ? "✓ Envoyé" : "Marquer envoyé"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="hint">{su.venu ? "Choisis le résultat : je te prépare les 3 messages à envoyer, avec les dates." : "Dis-moi s'il est venu : je te prépare les messages de suivi."}</p>
          )}
        </section>
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
                {[h.venu === "venu" ? "Venu" : h.venu === "absent" ? "Pas venu" : null, RESULTATS.find((r) => r.id === h.resultat)?.label, PRODUITS.find((x) => x.id === h.produit)?.label].filter(Boolean).join(" · ")}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

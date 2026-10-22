import { useEffect, useState } from "react";
import { fmtDay, fmtTime, TZ, type Call } from "@/lib/cal";
import {
  alertes, duree, FREINS, messageConfirmation, MODALITES, offre, pageLisible, PRODUITS, provenanceLisible,
  questions, RESULTATS, sourceLisible, visiteDe, type Fiche, type Suivi, type Visite,
} from "@/lib/prospect";
import { etatMessage, lienSiOui, lireNote, plan, quandLisible, suiviEffectif } from "@/lib/messages";
import CopyButton from "@/components/CopyButton";

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

  // Liste à coche, comme dans Réglages (un tap coche, un 2e tap décoche si « optionnel »)
  const Coches = <T extends string>({ items, choisi, deduit: lu, onPick, optionnel }: {
    items: { id: T; label: string }[]; choisi?: T; deduit?: T; onPick: (id: T | undefined) => void; optionnel?: boolean;
  }) => (
    <div className="list">
      {items.map((x) => {
        const on = choisi === x.id, propose = !choisi && lu === x.id;
        return (
          <button key={x.id} className="li check" onClick={() => onPick(on && optionnel ? undefined : x.id)}>
            <span className="li-title">{x.label}{propose && <span className="hint-inline"> · lu dans ta note</span>}</span>
            <span className={`tick ${on ? "on" : propose ? "maybe" : ""}`} aria-hidden="true">{on || propose ? "✓" : ""}</span>
          </button>
        );
      })}
    </div>
  );

  const Segment = <T extends string>({ items, choisi, onPick }: { items: { id: T; label: string }[]; choisi?: T; onPick: (id: T) => void }) => (
    <div className={`segmented glisse ${choisi ? "" : "vide"}`} style={{ "--n": items.length, "--i": Math.max(0, items.findIndex((x) => x.id === choisi)) } as React.CSSProperties}>
      {items.map((x) => (
        <button key={x.id} className={choisi === x.id ? "on" : ""} onClick={() => onPick(x.id)}>{x.label}</button>
      ))}
    </div>
  );

  const siOui = lienSiOui(deduit, c);
  const modaliteChoisie = su.modalite ?? deduit.modalite ?? (produit === "suivi" ? "echeances" : "1fois");

  return (
    <>
      <button className="back" onClick={onBack}>Appels</button>
      <h1 className="title">{c.name}</h1>
      <p className="subtitle">
        {fmtDay(c.start)} · {fmtTime(c.start)}{reserve && ` · réservé ${reserve}`}
        <br />
        {precedents.length ? `${precedents.length + 1}e appel` : "1er appel"}
        {(visite || src) && ` · vient de ${visite ? provenanceLisible(visite) : src!.split(" · ")[0]}`}
        {al.length > 0 && <span className="todo"> · à confirmer</span>}
      </p>

      {!passe && (c.meetingUrl || c.phone) && (
        <div className="list actions">
          {c.meetingUrl && <a className="li action" href={c.meetingUrl} target="_blank" rel="noreferrer">Rejoindre la visio<span className="chev" aria-hidden="true" /></a>}
          {c.phone && <a className="li action" href={`tel:${c.phone}`}>Appeler {c.phone}<span className="chev" aria-hidden="true" /></a>}
        </div>
      )}

      {passe && (
        <>
          <h2 className="sec">Il est venu ?</h2>
          <Segment items={[{ id: "venu", label: "Venu" }, { id: "absent", label: "Pas venu" }]} choisi={su.venu} onPick={(id) => onSave({ venu: id as Suivi["venu"] })} />

          {su.venu === "venu" && (
            <>
              <h2 className="sec">Résultat</h2>
              <Coches items={RESULTATS} choisi={su.resultat} onPick={(id) => onSave({ resultat: id })} />
            </>
          )}

          {su.venu === "venu" && avecProduit && (
            <>
              <h2 className="sec">Produit</h2>
              <Coches items={PRODUITS} choisi={su.produit} deduit={deduit.produit ?? produitConseille}
                onPick={(id) => id && onSave({ produit: id, modalite: id === "suivi" ? "echeances" : su.modalite === "echeances" ? "1fois" : su.modalite })} />
              {produit !== "suivi" && (
                <>
                  <h2 className="sec">Paiement</h2>
                  <Segment items={MODALITES.filter((m) => m.id !== "echeances")} choisi={modaliteChoisie} onPick={(id) => onSave({ modalite: id })} />
                </>
              )}
            </>
          )}

          {su.venu === "venu" && avecFrein && (
            <>
              <h2 className="sec">Ce qui le bloque</h2>
              <Coches items={FREINS} choisi={su.frein} deduit={deduit.frein} optionnel onPick={(id) => onSave({ frein: id })} />
            </>
          )}

          {su.venu === "venu" && (su.resultat === "relancer" || su.resultat === "interesse") && (
            <>
              <h2 className="sec">Le recontacter le{(su.rappel || deduit.rappel) && <button className="sec-link" onClick={() => onSave({ rappel: undefined })}>Effacer</button>}</h2>
              <input className="field" type="date" value={su.rappel ?? deduit.rappel ?? ""} onChange={(e) => onSave({ rappel: e.target.value || undefined })} />
            </>
          )}

          <h2 className="sec">Note</h2>
          <textarea
            className="field note"
            value={note}
            placeholder="Ce qu'il a dit, ce qui bloque, « rappeler jeudi »…"
            onChange={(e) => setNote(e.target.value)}
            onBlur={finNote}
          />

          {pl ? (
            <>
              <h2 className="sec">Messages à envoyer</h2>
              <p className="explain">{pl.resume}</p>
              <div className="list">
                {pl.messages.map((m, i) => {
                  const etat = etatMessage(m, su, now);
                  return (
                    <div key={m.id} className={`li message ${etat}`}>
                      <div className="message-top">
                        <span>{i + 1}. {m.titre}</span>
                        <span className={etat === "retard" ? "late" : etat === "aujourdhui" ? "todo" : etat === "envoye" ? "done" : ""}>
                          {etat === "envoye" ? "Envoyé" : etat === "retard" ? `En retard · ${quandLisible(m.quand, now)}` : quandLisible(m.quand, now)}
                        </span>
                      </div>
                      <p className="message-text">{m.texte}</p>
                      <div className="message-actions">
                        <CopyButton text={m.texte} onCopied={() => toast("Message copié")} />
                        <button className="textbtn" onClick={() => basculerEnvoye(m.id)}>{etat === "envoye" ? "Annuler « envoyé »" : "Marquer envoyé"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {su.venu === "venu" && (su.resultat === "interesse" || su.resultat === "relancer") && (
                <>
                  <h2 className="sec">S'il dit oui</h2>
                  <div className="list">
                    {siOui.length ? siOui.map((l) => (
                      <div key={l.url} className="li">
                        <span className="li-main"><span className="li-title">Lien de paiement</span><span className="li-sub">{l.label}</span></span>
                        <CopyButton text={l.url} onCopied={() => toast("Lien de paiement copié")} />
                      </div>
                    )) : <p className="empty">Pas de lien GoCardless pour le coaching ads : envoie-le à part.</p>}
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="explain">{su.venu ? "Choisis le résultat : je te prépare les messages, avec les dates." : "Dis-moi s'il est venu : je te prépare les messages de suivi."}</p>
          )}
        </>
      )}

      {al.length > 0 && (
        <>
          <h2 className="sec">À vérifier</h2>
          <div className="list">
            {al.map((a) => <div key={a} className="li"><span className="li-title todo">{a}</span></div>)}
          </div>
          {!passe && (
            <div className="list">
              <div className="li message">
                <div className="message-top"><span>Message de confirmation</span></div>
                <p className="message-text">{messageConfirmation(c)}</p>
                <div className="message-actions"><CopyButton text={messageConfirmation(c)} onCopied={() => toast("Message copié")} /></div>
              </div>
            </div>
          )}
        </>
      )}

      <h2 className="sec">Ses réponses</h2>
      <div className="list">
        {c.answers.length ? c.answers.map((a) => (
          <div key={a.label} className="li kv"><span>{a.label}</span><span>{a.value}</span></div>
        )) : <p className="empty">Pas de réponse au formulaire.</p>}
        {c.phone && <div className="li kv"><span>Téléphone</span><span>{c.phone}</span></div>}
        {c.email && <div className="li kv"><span>Mail</span><span>{c.email}</span></div>}
      </div>

      <h2 className="sec">D'où il vient</h2>
      <div className="list">
        {visite && (
          <>
            <div className="li kv"><span>Provenance</span><span>{provenanceLisible(visite)} · {visite.appareil}</span></div>
            <div className="li kv"><span>Sur le site</span><span>{duree(visite.duree_s)} · {visite.visites > 1 ? `${visite.visites}e visite` : "1re visite"}</span></div>
            {visite.pages.filter((x) => x.page).map((x, i) => (
              <div key={i} className="li kv"><span>{pageLisible(x.page)}</span><span>{x.lu} % lu · {duree(x.s)}</span></div>
            ))}
            {!!visite.faq.length && <div className="li kv"><span>FAQ ouverte</span><span>{visite.faq.join(" · ")}</span></div>}
            {visite.bouton && <div className="li kv"><span>A cliqué</span><span>{visite.bouton}</span></div>}
          </>
        )}
        {src && <div className="li kv"><span>Lien Cal</span><span>{src}</span></div>}
        {!visite && !src && <p className="empty">Pas de visite du site retrouvée : il a sûrement réservé directement depuis le lien Cal.</p>}
        {precedents.length > 0 && (
          <div className="li kv"><span>Appels avant</span><span>{precedents.map((x) => x.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: TZ })).join(", ")}</span></div>
        )}
      </div>

      <h2 className="sec">Offre conseillée</h2>
      {of ? (
        <div className="list">
          <div className="li">
            <span className="li-main"><span className="li-title">{of.nom}</span><span className="li-sub">{of.prix}</span></span>
          </div>
          <p className="explain inset">{of.pourquoi}</p>
        </div>
      ) : <p className="empty">Budget sous 500 € : pas d'offre adaptée. Confirme d'abord sa venue et son budget.</p>}

      <h2 className="sec">Questions pour l'appel</h2>
      <div className="list">
        {questions(c).map((q, i) => (
          <div key={i} className="li"><span className="li-title wrap">{i + 1}. {q}</span></div>
        ))}
      </div>

      {!!fiche.historique?.length && (
        <>
          <h2 className="sec">Historique</h2>
          <div className="list">
            {fiche.historique.slice().reverse().map((h, i) => (
              <div key={i} className="li kv">
                <span>{new Date(h.quand).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: TZ })}</span>
                <span>{[h.venu === "venu" ? "Venu" : h.venu === "absent" ? "Pas venu" : null, RESULTATS.find((r) => r.id === h.resultat)?.label, PRODUITS.find((x) => x.id === h.produit)?.label].filter(Boolean).join(" · ")}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

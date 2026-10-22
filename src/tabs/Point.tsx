import { memo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { Age, CarteSuivi, Repli, type SuiviData } from "@/components/Suivi";
import { Nombre } from "@/components/Deco";

interface Props {
  suivi: SuiviData;
  now: number;
  onOpenFiche: (id: number) => void;
}

// Le Suivi, exactement comme le widget du Mac : même source (suivi.json), mêmes sections,
// même ordre, mêmes libellés, mêmes couleurs (contrat : reports/suivi-spec.md).
// Rien n'est recalculé ici, sauf l'âge de la donnée.
function Point({ suivi, now, onOpenFiche }: Props) {
  if (!suivi.version || !suivi.entete) {
    return <p className="carte"><span className="texte gris">Le suivi arrive dès que ton Mac l'envoie.</span></p>;
  }
  const maj = (suivi.maj ?? 0) * 1000;
  const horsLigne = now - maj > 90_000;
  const e = suivi.entete;

  return (
    <>
      {/* En-tête du widget : l'anneau (il tourne quand une session travaille), le compteur ambre, le résumé */}
      <div className="resume">
        <span className={`anneau-widget ${e.anneau}`} aria-hidden="true"><i /></span>
        {e.pour_toi > 0 && <span className="compteur"><Nombre n={e.pour_toi} /></span>}
        <span className="resume-texte">
          <b>{e.titre}</b>
          <span>{e.resume}</span>
        </span>
      </div>
      {(suivi.alertes ?? []).map((a) => <p key={a} className="alerte">{a}</p>)}

      {(suivi.sections ?? []).map((s) => {
        const cartes = s.cartes.map((c, i) => <CarteSuivi key={i} c={c} onOpenFiche={onOpenFiche} />);
        return s.repliee ? (
          <div key={s.id} className="replis"><Repli titre={s.titre} n={s.cartes.length}><div className="cartes">{cartes}</div></Repli></div>
        ) : (
          <section key={s.id}>
            <h2 className={`sec-titre ${s.couleur}`}>{s.titre}</h2>
            <div className="cartes">
              {cartes.length ? cartes : <p className="carte"><span className="texte gris">{s.vide}</span></p>}
            </div>
          </section>
        );
      })}

      {suivi.chiffres && (
        <div className="replis">
          <Repli titre={`Chiffres du point${suivi.chiffres.releve ? ` · relevés à ${suivi.chiffres.releve}` : ""}`} n={suivi.chiffres.sections.length}>
            {suivi.chiffres.sections.map((c) => (
              <details key={c.titre} className="acc">
                <summary>{c.titre}</summary>
                <div className="md" dangerouslySetInnerHTML={{ __html: renderMarkdown(c.markdown) }} />
              </details>
            ))}
          </Repli>
        </div>
      )}

      {/* Pied du widget : le point qui bat et l'âge de la donnée */}
      <p className={`live pied ${horsLigne ? "eteint" : ""}`}>
        <i aria-hidden="true" />
        {horsLigne ? <>Mac hors ligne · dernière nouvelle <Age ms={maj} /></> : <>En direct · mis à jour <Age ms={maj} /></>}
      </p>
    </>
  );
}

export default memo(Point);

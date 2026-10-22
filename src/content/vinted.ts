// Textes Vinted d'Hugo (21-22/10). Couleur et taille restent vides :
// il les remplit à chaque annonce.
export interface VintedText {
  id: string;
  label: string;
  text: string;
}

const outro = `Envoi rapide et soigné 📦👌🏻

Une question sur les mesures ou autre ?
N’hésitez pas à m’envoyer un message, je vous répondrai avec plaisir.`;

export const VINTED: VintedText[] = [
  {
    id: "ensemble",
    label: "Ensemble",
    text: `Magnifique ensemble ALO disponible dès maintenant dans mon dressing ! ✨

🏷️ Marque : ALO
👕 Ensemble : T-shirt + pantalon
🖤 Couleur : 
📏 Taille : 

${outro}`,
  },
  {
    id: "sabots",
    label: "Sabots",
    text: `Magnifique croc disponible dès maintenant dans mon dressing ! ✨

🏷️ marque : Crocs
Couleur : 
Taille : 

${outro}`,
  },
];

// Liens à envoyer à un prospect ou un client, groupés par usage.
// Paiements : liens GoCardless d'Hugo (reports/liens-paiement-gocardless.md).
// Les liens « Marvin » du commercial sont volontairement absents.
export interface Lien {
  label: string;
  detail?: string; // montant, affiché à la place de l'URL
  url: string;
}

export interface Groupe {
  title: string;
  liens: Lien[];
}

export const GROUPES: Groupe[] = [
  {
    title: "Moi",
    liens: [
      { label: "Mon TikTok", detail: "lives presque tous les soirs", url: "https://www.tiktok.com/@hugo.bnls" },
      { label: "Mon Instagram", detail: "@hugo.bnls", url: "https://www.instagram.com/hugo.bnls/" },
      { label: "Tous mes liens", url: "https://hugo-bnls.fr/" },
    ],
  },
  {
    title: "Académie",
    liens: [
      { label: "Réserver un appel", url: "https://cal.com/team/made-academie/appel-coaching-academie" },
      { label: "Page Académie", url: "https://hugo-bnls.fr/academie/" },
      { label: "Résultats des élèves", detail: "contre « pas confiance »", url: "https://hugo-bnls.fr/academie/#resultats" },
      { label: "Les offres", detail: "Académie et Coaching +", url: "https://hugo-bnls.fr/academie/#offres" },
      { label: "Questions fréquentes", url: "https://hugo-bnls.fr/academie/#faq" },
      { label: "Voyage Canton (Chine)", url: "https://hugo-bnls.fr/academie/chine/" },
      { label: "Espace élèves", detail: "après paiement", url: "https://made-academie.vercel.app/login" },
    ],
  },
  {
    title: "Agence",
    liens: [
      { label: "Agence MADE", url: "https://agencemade.com" },
    ],
  },
  {
    title: "Paiement · Académie",
    liens: [
      { label: "En 1 fois", detail: "1 497 €", url: "https://pay.gocardless.com/BRT01KS4HC3AXS46RVVEN9GAQPTAE" },
      { label: "En 3 fois", detail: "3 × 499 €", url: "https://pay.gocardless.com/BRT01KRZHPB7W150CAD8ZXAA8YJ2Y" },
    ],
  },
  {
    title: "Paiement · Coaching +",
    liens: [
      { label: "En 1 fois", detail: "4 998 €", url: "https://pay.gocardless.com/BRT01KS4J7S30WVQ3EDD84ERD8X9B" },
      { label: "En 3 fois", detail: "3 × 1 665 €", url: "https://pay.gocardless.com/BRT01KS4J5QZRAAP3Y79WJCG2JSPT" },
    ],
  },
  {
    title: "Paiement · Académie + suivi MADE",
    liens: [
      { label: "En échéances", detail: "3 500 € au total", url: "https://pay.gocardless.com/BRT01KWH397NVFPXEJBWYDVH2FD5S" },
    ],
  },
];

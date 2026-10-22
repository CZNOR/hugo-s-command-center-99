// Liens Académie à envoyer pendant un appel.
// Paiement : à ajouter quand Hugo donne son lien.
export interface Lien {
  label: string;
  url: string;
}

export const LIENS: Lien[] = [
  { label: "Réserver un appel", url: "https://cal.com/team/made-academie/appel-coaching-academie" },
  { label: "Page Académie", url: "https://hugo-bnls.fr/academie/" },
  { label: "Voyage Canton (Chine)", url: "https://hugo-bnls.fr/academie/chine/" },
  { label: "Espace élèves", url: "https://made-academie.vercel.app/login" },
  { label: "Agence MADE", url: "https://agencemade.com" },
];

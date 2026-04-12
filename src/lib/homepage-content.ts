/**
 * homepage-content.ts
 * ────────────────────────────────────────────────────────────────
 * Tous les textes éditoriaux de la page d'accueil sont ici.
 * Modifiez ce fichier pour mettre à jour les accroches, titres,
 * descriptions et CTAs sans toucher au JSX.
 * ────────────────────────────────────────────────────────────────
 */

/* ─── § 1 — Hero ─────────────────────────────────────────────── */
export const HERO_CONTENT = {
  /** Ligne de contexte géographique / positionnement, affichée en micro-uppercase */
  eyebrow: "Paris & Île-de-France · Depuis 2018",

  /** Première ligne du headline principal (italic) */
  headline1: "L'immobilier",

  /** Deuxième ligne — mise en valeur (semi-bold) */
  headline2: "d'exception",

  /** Sous-titre affiché sous la règle dorée */
  tagline:
    "Des adresses d'exception, rigoureusement sélectionnées\npour une clientèle qui n'accepte pas le compromis.",

  /** CTA principal → /biens */
  cta_primary: "Découvrir la sélection",

  /** CTA secondaire → /contact */
  cta_secondary: "Prendre contact",

  /** Label de l'indicateur de défilement */
  scroll_label: "Défiler",
};

/* ─── § 2 — Manifeste ────────────────────────────────────────── */
export const MANIFESTE_CONTENT = {
  /** Première ligne de la citation (italic) */
  quote_italic: "Nous ne cherchons pas\nl'emplacement idéal.",

  /** Réponse en gras — la chute de la citation */
  quote_bold: "Nous le révélons.",

  /** Paragraphe de présentation sous la citation */
  description:
    "Depuis 2018, notre agence accompagne une clientèle d'exception dans ses projets immobiliers commerciaux à Paris et Île-de-France. Chaque mandat reçoit une attention singulière, chaque client mérite une réponse sur-mesure.",

  /** Quatre chiffres-clés */
  stats: [
    { value: "6+",   line1: "Années",          line2: "d'excellence"  },
    { value: "120+", line1: "Transactions",     line2: "réalisées"     },
    { value: "20",   line1: "Arrondissements",  line2: "couverts"      },
    { value: "98%",  line1: "Clients",          line2: "satisfaits"    },
  ],

  /** Trois piliers d'engagement */
  commitments: [
    {
      title: "Expertise Locale",
      description:
        "Une connaissance fine du marché parisien, quartier par quartier, pour identifier les meilleures opportunités avant qu'elles ne paraissent.",
    },
    {
      title: "Accompagnement Dédié",
      description:
        "Un interlocuteur unique, disponible et attentif, qui suit votre projet de A à Z — de la première visite à la signature définitive.",
    },
    {
      title: "Réseau Qualifié",
      description:
        "Un portefeuille d'offres qualitatives et un réseau de décideurs pour concrétiser rapidement les projets les plus ambitieux.",
    },
  ],
};

/* ─── § 3 — Sélection exclusive ─────────────────────────────── */
export const SELECTION_CONTENT = {
  overline: "Sélection Exclusive",
  title: "Biens d'exception",
  cta_label: "Voir tout",
};

/* ─── § 4 — Savoir-Faire ────────────────────────────────────── */
export const SAVOIR_FAIRE_CONTENT = {
  overline: "Nos Savoir-Faire",

  /** Titre sur deux lignes */
  title_line1: "Un accompagnement",
  title_line2: "de haute précision",

  services: [
    {
      num: "01",
      title: "Location Commerciale",
      description:
        "Des adresses sélectionnées avec soin, de la boutique de quartier au flagship parisien. Nous identifions le local qui fera l'histoire de votre activité.",
    },
    {
      num: "02",
      title: "Vente de Murs",
      description:
        "Acquérir des murs commerciaux, c'est inscrire son patrimoine dans la durée. Nous guidons chaque investissement avec rigueur et discernement.",
    },
    {
      num: "03",
      title: "Fonds de Commerce",
      description:
        "Restaurants, enseignes, commerces de proximité — nous orchestrons chaque cession et acquisition avec la précision qu'elle mérite.",
    },
    {
      num: "04",
      title: "Conseil & Expertise",
      description:
        "Notre lecture fine du marché parisien, quartier par quartier, vous donne l'avantage décisif pour négocier, valoriser et sécuriser.",
    },
  ],

  more_cta: "En savoir plus sur nos services",
};

/* ─── § 5 — Contact Privé ────────────────────────────────────── */
export const CONTACT_CONTENT = {
  overline: "Contact Privé",

  /** Headline — première ligne (italic) */
  headline_italic: "Une conversation",

  /** Headline — deuxième ligne (semi-bold, dorée) */
  headline_bold: "discrète et sur-mesure",

  description:
    "Chaque projet mérite une attention singulière. Notre équipe vous répond avec la discrétion et l'excellence qui vous sont dues — sous 24 heures.",

  cta_primary: "Prendre Contact",
  cta_secondary: "Parcourir la sélection",

  contact_overline: "Ou contactez-nous directement",

  /** Remplacez par vos vraies coordonnées */
  phone: "+33 (0)1 00 00 00 00",
  phone_href: "tel:+33100000000",
  email: "contact@retailavenue.fr",
  email_href: "mailto:contact@retailavenue.fr",
};

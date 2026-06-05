export const APP_NAME = "Retail Avenue";
export const APP_DESCRIPTION =
  "Immobilier commercial & professionnel à Paris — Expertise, conseil et accompagnement sur-mesure.";

/**
 * Canonical public URL of the site. Used for metadataBase, canonical tags,
 * sitemap, robots and structured data so every brand signal points to the
 * single authoritative domain (retail-avenue.fr).
 */
export const SITE_URL = (process.env.APP_URL || "https://retail-avenue.fr").replace(/\/$/, "");

/** Brand-name variants Google should associate with the entity. */
export const BRAND_ALTERNATE_NAMES = [
  "Retail Avenue",
  "RetailAvenue",
  "Retail-Avenue",
  "Retail Avenue Paris",
] as const;

export const PARIS_CENTER = {
  lat: 48.8566,
  lng: 2.3522,
} as const;

export const PARIS_DISTRICTS = [
  "1er arrondissement",
  "2e arrondissement",
  "3e arrondissement",
  "4e arrondissement",
  "5e arrondissement",
  "6e arrondissement",
  "7e arrondissement",
  "8e arrondissement",
  "9e arrondissement",
  "10e arrondissement",
  "11e arrondissement",
  "12e arrondissement",
  "13e arrondissement",
  "14e arrondissement",
  "15e arrondissement",
  "16e arrondissement",
  "17e arrondissement",
  "18e arrondissement",
  "19e arrondissement",
  "20e arrondissement",
] as const;

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  BOUTIQUE: "Boutique",
  BUREAU: "Bureau",
  LOCAL_COMMERCIAL: "Local commercial",
  LOCAL_ACTIVITE: "Local d'activité",
  RESTAURANT: "Restaurant",
  HOTEL: "Hôtel",
  ENTREPOT: "Entrepôt",
  PARKING: "Parking",
  TERRAIN: "Terrain",
  IMMEUBLE: "Immeuble",
  AUTRE: "Autre",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  VENTE: "Vente murs commerciaux",
  LOCATION: "Location pure",
  CESSION_BAIL: "Cession de bail",
  FOND_DE_COMMERCE: "Fond de commerce",
};

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  BROUILLON: "Brouillon",
  ACTIF: "Actif",
  EN_NEGOCIATION: "En négociation",
  PRENEUR_TROUVE: "Preneur trouvé",
  SOUS_COMPROMIS: "Sous compromis",
  VENDU: "Vendu",
  LOUE: "Loué",
  RETIRE: "Retiré",
  ARCHIVE: "Archivé",
};

export const DEAL_STAGE_LABELS: Record<string, string> = {
  PROSPECT: "Prospect",
  DECOUVERTE: "Découverte",
  VISITE: "Visite",
  NEGOCIATION: "Négociation",
  OFFRE: "Offre",
  COMPROMIS: "Compromis",
  ACTE: "Acte",
  CLOTURE: "Clôture",
  PERDU: "Perdu",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

export const INTERACTION_TYPE_LABELS: Record<string, string> = {
  APPEL_ENTRANT: "Appel entrant",
  APPEL_SORTANT: "Appel sortant",
  EMAIL_ENTRANT: "Email entrant",
  EMAIL_SORTANT: "Email sortant",
  VISITE: "Visite",
  REUNION: "Réunion",
  NOTE: "Note",
  SMS: "SMS",
  COURRIER: "Courrier",
  AUTRE: "Autre",
};

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  PROPRIETAIRE: "Propriétaire",
  LOCATAIRE: "Locataire",
  ACQUEREUR: "Acquéreur",
  BAILLEUR: "Bailleur",
  APPORTEUR: "Apporteur",
  ENSEIGNE: "Enseigne",
  MANDATAIRE: "Mandataire",
  NOTAIRE: "Notaire",
  ARCHITECTE: "Architecte",
  AUTRE: "Autre",
};

export const SEARCH_REQUEST_STATUS_LABELS: Record<string, string> = {
  NOUVELLE: "Nouvelle",
  QUALIFIEE: "Qualifiée",
  EN_COURS: "En cours",
  EN_PAUSE: "En pause",
  SATISFAITE: "Satisfaite",
  ABANDONNEE: "Abandonnée",
  ARCHIVEE: "Archivée",
};

export const FIELD_SPOTTING_STATUS_LABELS: Record<string, string> = {
  REPERE: "Repéré",
  APPELE: "Appelé",
  EN_ATTENTE_RETOUR: "En attente de retour",
  A_QUALIFIER: "À qualifier",
  QUALIFIE: "Qualifié",
  CONVERTI: "Converti",
  REJETE: "Rejeté",
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  VISITE: "Visite",
  REUNION: "Réunion",
  RELANCE: "Relance",
  SIGNATURE: "Signature",
  AUTRE: "Autre",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  DIRIGEANT: "Dirigeant",
  ASSOCIE: "Associé",
  MANAGER: "Manager",
  AGENT: "Agent",
  ASSISTANT: "Assistant",
  CLIENT: "Client",
};

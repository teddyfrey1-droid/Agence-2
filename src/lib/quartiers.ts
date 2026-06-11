/**
 * Editorial quartier pages — SEO landing pages for local searches
 * ("local commercial Le Marais", "boutique à louer Grands Boulevards"…).
 * `arrondissements` must match the PARIS_DISTRICTS strings used on properties.
 */

export interface Quartier {
  slug: string;
  name: string;
  tagline: string;
  arrondissements: string[];
  description: string[];
  strengths: { title: string; description: string }[];
}

export const QUARTIERS: Quartier[] = [
  {
    slug: "grands-boulevards",
    name: "Grands Boulevards",
    tagline: "Le flux parisien à l'état pur",
    arrondissements: ["2e arrondissement", "9e arrondissement", "10e arrondissement"],
    description: [
      "Des Galeries Lafayette à la porte Saint-Denis, les Grands Boulevards concentrent l'un des flux piétons les plus denses d'Europe. Restauration rapide premium, flagship stores et concepts food y trouvent une clientèle de bureaux le midi et de loisirs le soir.",
      "Les linéaires commerciaux y sont recherchés et les cessions de bail s'y négocient vite : être alerté tôt fait souvent la différence.",
    ],
    strengths: [
      { title: "Flux maximal", description: "Plus de 100 000 passages quotidiens sur certains tronçons." },
      { title: "Double clientèle", description: "Bureaux en semaine, loisirs et tourisme le week-end." },
      { title: "Visibilité", description: "Façades larges et emplacements n°1 historiques." },
    ],
  },
  {
    slug: "le-marais",
    name: "Le Marais",
    tagline: "L'adresse des concepts et des créateurs",
    arrondissements: ["3e arrondissement", "4e arrondissement"],
    description: [
      "Entre la rue des Francs-Bourgeois et la rue de Bretagne, le Marais reste le laboratoire du retail parisien : marques émergentes, pop-up stores, galeries et flagship mode s'y disputent des boutiques de caractère.",
      "Le bâti ancien impose une lecture fine des baux et des surfaces — notre connaissance des immeubles du quartier sécurise chaque dossier.",
    ],
    strengths: [
      { title: "Image de marque", description: "Le quartier le plus prescripteur pour les enseignes lifestyle." },
      { title: "Tourisme 7j/7", description: "Ouverture dominicale et clientèle internationale." },
      { title: "Boutiques de caractère", description: "Pierres apparentes, vitrines anciennes, surfaces atypiques." },
    ],
  },
  {
    slug: "saint-germain-des-pres",
    name: "Saint-Germain-des-Prés",
    tagline: "Le luxe rive gauche",
    arrondissements: ["6e arrondissement", "7e arrondissement"],
    description: [
      "Maisons de luxe, galeries d'art, librairies historiques et tables gastronomiques : Saint-Germain conjugue patrimoine et pouvoir d'achat. Les valeurs locatives y sont parmi les plus stables de Paris.",
      "Les opportunités s'y transmettent souvent en off-market, entre propriétaires historiques — exactement le terrain de jeu de notre réseau.",
    ],
    strengths: [
      { title: "Clientèle premium", description: "Pouvoir d'achat résident et touristique élevé." },
      { title: "Valeurs stables", description: "Un marché de rareté qui résiste aux cycles." },
      { title: "Off-market", description: "Beaucoup de transactions sans publicité." },
    ],
  },
  {
    slug: "champs-elysees",
    name: "Champs-Élysées & Triangle d'Or",
    tagline: "La vitrine mondiale",
    arrondissements: ["8e arrondissement"],
    description: [
      "De l'avenue Montaigne au Faubourg Saint-Honoré, le Triangle d'Or accueille les flagships internationaux et les maisons de luxe. Les Champs-Élysées, en pleine renaissance, attirent à nouveau les concepts d'envergure mondiale.",
      "Ici, chaque transaction est un projet d'entreprise : montage, négociation et discrétion absolue sont la norme.",
    ],
    strengths: [
      { title: "Rayonnement mondial", description: "La plus forte exposition de marque possible en Europe." },
      { title: "Tourisme massif", description: "Des dizaines de millions de visiteurs par an." },
      { title: "Adresses de prestige", description: "Montaigne, George V, Faubourg Saint-Honoré." },
    ],
  },
  {
    slug: "opera-vendome",
    name: "Opéra & Vendôme",
    tagline: "Affaires, joaillerie et grands magasins",
    arrondissements: ["1er arrondissement", "2e arrondissement", "9e arrondissement"],
    description: [
      "Autour de la place Vendôme et de l'avenue de l'Opéra, le quartier mêle sièges sociaux, joailliers, hôtels 5 étoiles et grands magasins. Une clientèle d'affaires solvable et continue toute l'année.",
      "Bureaux de standing, boutiques de prestige et restaurants d'affaires y composent un marché exigeant que nous suivons immeuble par immeuble.",
    ],
    strengths: [
      { title: "Quartier d'affaires", description: "Une densité de sièges et de bureaux unique au centre de Paris." },
      { title: "Haute joaillerie", description: "L'adresse mondiale de la place Vendôme." },
      { title: "Hôtellerie de luxe", description: "Une clientèle internationale à fort pouvoir d'achat." },
    ],
  },
  {
    slug: "montorgueil",
    name: "Montorgueil & Sentier",
    tagline: "Food, tech et vie de quartier",
    arrondissements: ["1er arrondissement", "2e arrondissement"],
    description: [
      "La rue Montorgueil reste la grande rue commerçante piétonne du centre, portée par les métiers de bouche et les concepts food. Le Sentier voisin, devenu le cœur de la tech parisienne, irrigue le quartier d'une clientèle jeune et dépensière.",
      "Les locaux y sont rares et les fonds de commerce s'y valorisent bien — un marché de transmission que nous connaissons finement.",
    ],
    strengths: [
      { title: "Piétonnier", description: "Un flux continu de résidents et d'actifs, 7 jours sur 7." },
      { title: "Food & bouche", description: "L'épicentre parisien des concepts culinaires." },
      { title: "Clientèle tech", description: "Les start-ups du Sentier font vivre le quartier midi et soir." },
    ],
  },
  {
    slug: "bastille-charonne",
    name: "Bastille & Charonne",
    tagline: "L'Est festif et créatif",
    arrondissements: ["11e arrondissement", "12e arrondissement"],
    description: [
      "De la rue de la Roquette à la rue de Charonne, l'Est parisien cultive bars, restaurants, ateliers et boutiques indépendantes. Les loyers plus accessibles en font la porte d'entrée idéale des jeunes enseignes.",
      "Le quartier se valorise rapidement : sécuriser un bail aujourd'hui, c'est capter la croissance de demain.",
    ],
    strengths: [
      { title: "Loyers accessibles", description: "Le meilleur rapport visibilité/loyer de Paris intra-muros." },
      { title: "Vie nocturne", description: "Une destination festive établie qui dope la restauration." },
      { title: "Quartier qui monte", description: "Valorisation continue depuis dix ans." },
    ],
  },
  {
    slug: "batignolles",
    name: "Batignolles",
    tagline: "Le village familial du 17e",
    arrondissements: ["17e arrondissement"],
    description: [
      "Autour de la rue de Lévis et du square des Batignolles, le quartier vit comme un village : commerces de bouche, cafés de quartier et boutiques familiales. L'arrivée du tribunal et de l'éco-quartier Clichy-Batignolles a amené des milliers d'actifs.",
      "Un marché résidentiel solide, idéal pour les commerces de proximité et les concepts de quartier.",
    ],
    strengths: [
      { title: "Clientèle fidèle", description: "Des résidents CSP+ attachés à leurs commerçants." },
      { title: "Nouveaux actifs", description: "L'éco-quartier et la cité judiciaire ont transformé la demande." },
      { title: "Commerce de proximité", description: "Bouche, services et restauration de quartier." },
    ],
  },
  {
    slug: "canal-saint-martin",
    name: "Canal Saint-Martin",
    tagline: "Le repaire des marques indépendantes",
    arrondissements: ["10e arrondissement"],
    description: [
      "Le long du canal et de la rue de Marseille, cafés de spécialité, marques DNVB et concept stores ont fait du quartier la vitrine du commerce indépendant parisien.",
      "Les surfaces y sont petites, les baux convoités : la réactivité est décisive pour s'y implanter.",
    ],
    strengths: [
      { title: "Image branchée", description: "Le quartier prescripteur des nouvelles marques." },
      { title: "Clientèle jeune", description: "Créatifs et actifs du nord-est parisien." },
      { title: "Week-ends animés", description: "Les berges du canal, destination de promenade." },
    ],
  },
  {
    slug: "rive-gauche",
    name: "Rive Gauche",
    tagline: "Commerces de quartier et pouvoir d'achat",
    arrondissements: ["5e arrondissement", "13e arrondissement", "14e arrondissement", "15e arrondissement"],
    description: [
      "Du Quartier latin à la rue du Commerce, la rive gauche aligne des artères commerçantes de quartier au pouvoir d'achat solide : rue Mouffetard, rue Daguerre, rue de Vaugirard.",
      "Un terrain idéal pour les enseignes de proximité, la santé, les services et la restauration familiale.",
    ],
    strengths: [
      { title: "Artères établies", description: "Des rues commerçantes historiques à la fréquentation fidèle." },
      { title: "Résidentiel dense", description: "Une clientèle locale présente toute l'année." },
      { title: "Diversité d'usages", description: "Proximité, santé, services, restauration." },
    ],
  },
];

export function findQuartier(slug: string): Quartier | undefined {
  return QUARTIERS.find((q) => q.slug === slug);
}

# Agence Immobilière — PropTech SaaS

Plateforme métier complète pour agence immobilière spécialisée en immobilier commercial et professionnel à Paris.

## Stack technique

- **Framework**: Next.js 15+ (App Router)
- **Langage**: TypeScript (strict)
- **Base de données**: PostgreSQL + Prisma ORM
- **UI**: Tailwind CSS
- **Authentification**: JWT (jose) + cookies httpOnly
- **Carte**: Mapbox GL
- **Validation**: Zod
- **Déploiement**: Vercel-ready

## Structure du projet

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Site public (accueil, biens, contact, etc.)
│   ├── (dashboard)/        # Back-office protégé
│   ├── api/                # API routes
│   ├── login/              # Page de connexion
│   └── layout.tsx          # Layout racine
├── components/
│   ├── ui/                 # Composants UI réutilisables
│   ├── layout/             # Header, Footer, Sidebar
│   └── forms/              # Composants formulaire
├── lib/
│   ├── prisma.ts           # Client Prisma singleton
│   ├── auth.ts             # Gestion JWT / sessions
│   ├── permissions.ts      # RBAC
│   ├── utils.ts            # Utilitaires
│   └── constants.ts        # Labels, constantes métier
├── modules/                # Modules métier
│   ├── properties/         # Biens
│   ├── contacts/           # Contacts
│   ├── search-requests/    # Demandes de recherche
│   ├── deals/              # Dossiers
│   ├── tasks/              # Tâches
│   ├── interactions/       # Interactions
│   ├── field-spotting/     # Repérage terrain
│   ├── matching/           # Matching bien ↔ demande
│   └── users/              # Utilisateurs
├── middleware.ts            # Auth middleware
prisma/
├── schema.prisma           # Schéma de données complet
└── seed.ts                 # Données initiales
```

## Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd agence-2

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos valeurs (DATABASE_URL, JWT_SECRET, etc.)

# 4. Initialiser la base de données
npx prisma db push
npm run db:seed

# 5. Lancer le serveur de développement
npm run dev
```

## Comptes par défaut (seed)

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | admin@agence-immo.fr | admin123 |
| Agent | agent@agence-immo.fr | agent123 |

## Fonctionnalités

### Site public
- Page d'accueil avec présentation
- Catalogue de biens publiés
- Fiche détail de bien
- Formulaire de recherche de local
- Formulaire de proposition de bien
- Formulaire de contact
- Anti-spam (honeypot)
- Déduplication contacts

### Back-office
- **Biens**: CRUD complet, publication, galerie médias, matching
- **Demandes**: gestion des demandes de recherche, critères structurés
- **Contacts**: CRM avec historique interactions, demandes liées
- **Terrain**: repérage terrain mobile-friendly
- **Dossiers**: suivi de transactions par étapes (kanban)
- **Tâches**: gestion avec priorité, échéance, assignation
- **Interactions**: timeline complète (appels, emails, visites, notes)
- **Matching**: algorithme bien ↔ demande avec score et raisons
- **Carte**: Mapbox avec biens géolocalisés
- **Performance**: KPIs et statistiques
- **Admin**: utilisateurs, rôles, journal d'activité

### Rôles & permissions
- Super Admin, Dirigeant, Associé, Manager, Agent, Assistant
- Contrôle côté serveur (middleware + API)
- RBAC complet par ressource et action

## Déploiement Vercel

1. Push le projet sur GitHub
2. Connecter le repo dans Vercel
3. Configurer les variables d'environnement :
   - `DATABASE_URL` (PostgreSQL — ex: Neon, Supabase)
   - `JWT_SECRET` (chaîne aléatoire 32+ caractères)
   - `NEXT_PUBLIC_MAPBOX_TOKEN` (optionnel, pour la carte)
   - `NEXT_PUBLIC_APP_URL` (URL de production)
4. Déployer

## Design

Direction artistique premium parisienne :
- Palette : ivoire, pierre, anthracite, champagne, bronze doux
- Typographie : serif élégante (titres) + sans-serif propre (interface)
- Composants : cartes premium, badges soignés, ombres subtiles
- Mobile responsive

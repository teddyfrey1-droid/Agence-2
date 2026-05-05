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

# 4. Initialiser la base de données (dev)
npx prisma migrate deploy
SEED_ADMIN_PASSWORD='<choisir un mdp fort>' \
SEED_AGENT_PASSWORD='<choisir un mdp fort>' \
  npm run db:seed

# 5. Lancer le serveur de développement
npm run dev
```

## Comptes par défaut (seed — dev uniquement)

Le seed est **désactivé en production** (`NODE_ENV=production`) sauf si
`FORCE_SEED=true` est explicitement fourni.

Les emails par défaut sont `admin@agence-immo.fr` et `agent@agence-immo.fr`,
**modifiables** via les variables `SEED_ADMIN_EMAIL` et `SEED_AGENT_EMAIL`.

Les mots de passe **ne sont plus définis en clair** : si
`SEED_ADMIN_PASSWORD` / `SEED_AGENT_PASSWORD` ne sont pas fournis, un mot de
passe aléatoire est généré à chaque seed et imprimé une seule fois dans la
console — note-le immédiatement. Pour un environnement reproductible, fixe
ces variables (≥ 12 caractères, mix majuscule/minuscule/chiffre).

Pour le bootstrap de la production, n'utilise **pas** le seed : passe par
l'endpoint sécurisé `POST /api/setup` (header `x-setup-token` =
`SETUP_SECRET_TOKEN`, body avec admin email + password fort).

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
   - `DIRECT_URL` (connexion non-poolée, requise par Prisma migrate)
   - `JWT_SECRET` (chaîne aléatoire 32+ caractères)
   - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (rate-limiting prod)
   - `NEXT_PUBLIC_APP_URL` (URL de production)
4. Déployer

### Migration depuis un déploiement initial via `prisma db push`

Le script `build` utilise `prisma migrate deploy`. Si la base de prod
existe déjà (créée précédemment par `db push`), il faut **baseline** la
migration `0_init` une seule fois :

```bash
DATABASE_URL='...' npx prisma migrate resolve --applied 0_init
```

Vérifier ensuite avec `npx prisma migrate status`.

Sur une base vierge, aucune action manuelle requise — `migrate deploy`
appliquera `0_init` directement.

## Design

Direction artistique premium parisienne :
- Palette : ivoire, pierre, anthracite, champagne, bronze doux
- Typographie : serif élégante (titres) + sans-serif propre (interface)
- Composants : cartes premium, badges soignés, ombres subtiles
- Mobile responsive

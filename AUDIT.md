# Audit de Code Complet — Agence-2 (CRM Immobilier)

**Date :** 2026-05-24
**Stack :** Next.js 15 / React 19 / Prisma / PostgreSQL / Supabase Storage / Vercel

---

## Synthese des Problemes Identifies

| Severite | Compte | Themes Cles |
|----------|--------|-------------|
| CRITIQUE | 5 | Contournement d'autorisation, fuite de donnees, fiabilite des taches de fond |
| HAUTE | 10 | Rate-limiting defaillant, requetes non-bornees, fuites d'erreurs, uploads |
| MOYENNE | 12 | Enumeration email, CSRF, validation inconsistante, duplication de code |
| BASSE | 8 | Type safety, complexite mot de passe, code mort, organisation |

---

## CRITIQUE

### 1. IDOR — Absence de verification de permission sur GET /api/contacts
**Fichier :** `src/app/api/contacts/route.ts:8-12`
**Probleme :** Le handler GET verifie l'authentification mais jamais `hasPermission(session.role, "contact", "read")`. Tout utilisateur authentifie peut lister l'integralite des contacts.
**Correction :** Ajouter le controle de permission comme sur la route `[id]`.

### 2. IDOR — Absence de verification de permission sur GET /api/properties (authentifie)
**Fichier :** `src/app/api/properties/route.ts:28-42`
**Probleme :** Le chemin authentifie ne verifie pas `hasPermission` pour la lecture. Les proprietes CONFIDENTIEL sont visibles par tous.
**Correction :** Ajouter le controle de permission + filtre de confidentialite.

### 3. Fire-and-forget en serverless (perte de donnees)
**Fichiers :** `src/app/api/properties/route.ts:72-74`, `src/app/api/search-requests/route.ts:60-91`
**Probleme :** Les promesses de matching sont lancees avec `.catch(console.error)` sans `waitUntil()`. Sur Vercel, le runtime peut geler le processus apres la reponse, tuant le matching en cours.
**Correction :** Utiliser `waitUntil()` de Next.js 15 ou une file d'attente (Inngest, QStash).

### 4. Rate limiter qui fail-open sur erreur Redis
**Fichier :** `src/lib/rate-limit.ts:78-81`
**Probleme :** Quand Upstash retourne une erreur, le limiter autorise la requete. Un attaquant qui provoque des erreurs Redis contourne tout le rate limiting.
**Correction :** Fail-closed sur les chemins d'authentification critiques.

### 5. Absence de rate-limiting sur /api/auth/reset-password et /api/auth/activate
**Fichiers :** `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/activate/route.ts`
**Probleme :** Ces endpoints sensibles n'ont aucun rate limiting.
**Correction :** Appliquer le meme pattern que sur /login.

---

## HAUTE

### 6. Rate-limit uniquement par IP, pas par compte cible
**Fichier :** `src/app/api/auth/login/route.ts:16`
**Probleme :** Un botnet distribue peut tenter 5 mots de passe/IP/15min sur le meme compte sans limite.
**Correction :** Ajouter un rate-limit secondaire par email.

### 7. Upload utilise le Content-Type declare par l'utilisateur
**Fichier :** `src/app/api/upload/route.ts:76`
**Probleme :** Apres validation magic-bytes, le `file.type` (controlable par l'utilisateur) est passe a Supabase Storage. Un JPEG avec `contentType: image/svg+xml` pourrait permettre du XSS.
**Correction :** Utiliser le type detecte, pas celui declare.

### 8. Upload sans verification d'appartenance au bien
**Fichier :** `src/app/api/upload/route.ts:26-43`
**Probleme :** Tout utilisateur avec permission "property:update" peut uploader sur N'IMPORTE quelle propriete.
**Correction :** Verifier `property.assignedToId === session.userId` ou role MANAGER+.

### 9. Matching engine charge TOUTES les proprietes/demandes en memoire
**Fichier :** `src/modules/matching/matching.service.ts:324-329, 413-415`
**Probleme :** Pas de pagination. A l'echelle, OOM ou timeout garanti.
**Correction :** Traiter par batches de 100-200 avec cursor-based pagination.

### 10. Transaction Prisma avec nombre illimite d'upserts
**Fichier :** `src/modules/matching/matching.service.ts:233-307`
**Probleme :** Une seule transaction avec potentiellement des milliers d'upserts. Timeout Prisma a 5s par defaut.
**Correction :** Battre les upserts en chunks de 50.

### 11. Fuite de messages d'erreur internes vers les clients
**Fichiers :** `src/app/api/properties/route.ts:79`, `src/app/api/contacts/route.ts:33`, `src/app/api/deals/route.ts:51`
**Probleme :** `err.message` expose les details Prisma (noms de contraintes, schema DB).
**Correction :** Logger l'erreur complete cote serveur, retourner un message generique au client.

### 12. Hard-delete des contacts/deals sans gestion des orphelins
**Fichiers :** `src/app/api/contacts/[id]/route.ts:72`, `src/app/api/deals/[id]/route.ts:81`
**Probleme :** Les suppressions dures peuvent violer les FK ou detruire l'historique d'audit.
**Correction :** Soft-delete (isArchived) ou verifier les dependances avant suppression.

### 13. Race condition sur le matching concurrent
**Fichier :** `src/modules/matching/matching.service.ts:312-401`
**Probleme :** Deux appels simultanes sur la meme propriete : deleteMany + upserts en conflit.
**Correction :** Advisory lock ou upsert idempotent sans deleteMany prealable.

### 14. Event-bus in-memory incompatible avec le serverless
**Fichier :** `src/lib/event-bus.ts`
**Probleme :** Le commentaire dit "fits Vercel serverless" mais c'est faux. Chaque requete SSE est une nouvelle lambda ; la Map `listeners` n'est pas partagee.
**Correction :** Utiliser Redis Pub/Sub ou Upstash pour les notifications cross-invocation.

### 15. In-memory rate limiter reinitialise a chaque cold start
**Fichier :** `src/lib/rate-limit.ts:110-138`
**Probleme :** Sans Redis, le rate limiting est essentiellement inexistant en serverless.
**Correction :** Rendre Redis obligatoire en production.

---

## MOYENNE

### 16. Enumeration d'emails via /api/auth/register
**Fichier :** `src/app/api/auth/register/route.ts:36`
**Probleme :** HTTP 409 revele qu'un email est deja enregistre.
**Correction :** Retourner un succes generique + email de verification.

### 17. Middleware — prefix matching trop large
**Fichier :** `middleware.ts:54`
**Probleme :** `pathname.startsWith("/api/property-shares/")` rend public tout sous-chemin futur.
**Correction :** Utiliser une regex ou un matching exact.

### 18. Pas de validation CSRF (Origin header)
**Fichier :** `middleware.ts`
**Probleme :** Aucune verification de l'en-tete Origin sur les mutations POST/PUT/DELETE.
**Correction :** Valider Origin contre une whitelist en middleware.

### 19. Middleware ne verifie pas tokenVersion/isActive
**Fichier :** `middleware.ts:94`
**Probleme :** Un utilisateur desactive garde un JWT valide au niveau middleware pendant 4h.
**Correction :** Acceptable si TOUS les handlers utilisent `getActiveSession()`, mais risque de regression.

### 20. `page` parameter non valide sur les routes paginees
**Fichier :** `src/app/api/properties/route.ts:10`
**Probleme :** `page=0`, `page=-5`, ou `page=abc` cause des erreurs Prisma.
**Correction :** `Math.max(1, parseInt(…) || 1)`.

### 21. Filtres enum non valides sur contacts repository
**Fichier :** `src/modules/contacts/contacts.repository.ts:18-19`
**Probleme :** Cast direct vers enum Prisma sans validation, contrairement au properties repository.
**Correction :** Valider contre les valeurs enum avant de passer a Prisma.

### 22. Search endpoint sans limite de longueur sur le terme
**Fichier :** `src/app/api/search/route.ts:25-61`
**Probleme :** Pas de longueur max — un terme tres long cause des ILIKE lourds.
**Correction :** `q.slice(0, 100)` ou validation Zod `.max(100)`.

### 23. PATCH /api/properties/[id] bypass le service layer
**Fichier :** `src/app/api/properties/[id]/route.ts:91`
**Probleme :** Appelle directement `updateProperty()` du repository, contournant `updateExistingProperty()` qui calcule `pricePerSqm`.
**Correction :** Utiliser la fonction service-layer.

### 24. Confidentialite inconsistante entre search et list
**Fichiers :** `src/app/api/search/route.ts:31` vs `src/app/api/properties/route.ts:33-39`
**Probleme :** Le search filtre les biens CONFIDENTIEL, la liste non.
**Correction :** Appliquer le meme filtre partout.

### 25. Pas de rate-limiting sur les endpoints publics
**Fichiers :** `src/app/api/properties/route.ts` (published), `src/app/api/search/route.ts`
**Probleme :** Scraping illimite possible.
**Correction :** Rate limit genereux mais present (100 req/min/IP).

### 26. `as never` type casts suppriment le type-checking
**Fichiers :** `src/app/api/deals/route.ts:33`, `src/app/api/properties/[id]/route.ts:91`
**Probleme :** Masque les incompatibilites entre schema Zod et types Prisma.
**Correction :** Mapper explicitement les champs ou corriger les types.

### 27. AI prompts injectables via le champ `notes`
**Fichier :** `src/lib/ai.ts:106-112`
**Probleme :** Le champ `notes` (max 1000 chars) est interpole directement dans le prompt. Un utilisateur malveillant peut manipuler la sortie IA.
**Correction :** Encadrer le user-input avec des delimiteurs XML ou utiliser le role `user` separe du `system`.

---

## BASSE

### 28. Duplication src/ui/ vs src/components/ui/ (DIVERGENT)
**Probleme :** Les deux repertoires existent avec des implementations DIFFERENTES (styling divergent sur Button). Seul `src/components/ui/` est importe.
**Correction :** Supprimer `src/ui/` et `src/layout/` (dead code).

### 29. Fichier src/layout.tsx orphelin
**Fichier :** `src/layout.tsx`
**Probleme :** Next.js utilise `src/app/layout.tsx`. Ce fichier semble etre un vestige.
**Correction :** Verifier s'il est importe, sinon supprimer.

### 30. PII dans le JWT (email, prenom, nom)
**Fichier :** `src/lib/auth.ts:17-26`
**Probleme :** Donnees personnelles accessibles a quiconque decode le JWT (pas chiffre).
**Correction :** Minimiser les claims a `userId`, `role`, `agencyId`, `tv`.

### 31. Math.random() pour les chemins de fichiers upload
**Fichier :** `src/app/api/upload/route.ts:67`
**Probleme :** Predictible (non-crypto).
**Correction :** `crypto.randomBytes(8).toString('hex')`.

### 32. Complexite de mot de passe insuffisante
**Fichiers :** `src/app/api/auth/register/route.ts:14`, `src/app/api/auth/reset-password/route.ts:8`
**Probleme :** Seul `.min(8)` est verifie.
**Correction :** Ajouter une regex ou zxcvbn pour un minimum de complexite.

### 33. Champ `company` parse mais jamais stocke a l'inscription
**Fichier :** `src/app/api/auth/register/route.ts:31,41`
**Probleme :** Dead code.
**Correction :** Retirer du schema ou stocker.

### 34. Console.error peut fuiter des infos sensibles
**Fichiers :** `src/app/api/upload/route.ts:139`, `src/app/api/upload/[id]/route.ts:64`
**Probleme :** Stack traces avec chemins internes et donnees utilisateur.
**Correction :** Utiliser le logger structure existant (`src/lib/logger.ts`).

### 35. Contact dedup race condition sur les formulaires publics
**Fichier :** `src/modules/contacts/contacts.service.ts:17`
**Probleme :** `findFirst({ email })` sans index unique — deux soumissions simultanees creent des doublons.
**Correction :** Ajouter un `@@unique([email])` conditionnel ou un `upsert`.

---

## Recommandations Architecturales

1. **Background Jobs** : Migrer vers Inngest ou QStash pour les taches de fond (matching, emails, cron) au lieu du fire-and-forget.
2. **Redis obligatoire** : Rendre Upstash obligatoire en production pour le rate-limiting et l'event-bus (SSE).
3. **Soft-delete partout** : Remplacer les hard-deletes par des flags `archivedAt` pour preserver l'audit trail.
4. **Tests** : Aucun test n'existe dans le projet. Ajouter au minimum des tests d'integration sur les routes critiques (auth, permissions).
5. **Nettoyage structure** : Supprimer `src/ui/`, `src/layout/`, `src/layout.tsx` (tous inutilises, divergents avec `src/components/`).
6. **CSP nonce** : Remplacer `'unsafe-inline'` sur script-src par des nonces via middleware pour une CSP stricte.
7. **Monitoring** : Ajouter Sentry ou equivalent pour capturer les erreurs au lieu de `console.error`.

---

## Priorisations

**Semaine 1 (Securite critique) :**
- Fix #1, #2 (permissions manquantes)
- Fix #4, #5 (rate limiting)
- Fix #7, #8 (upload security)
- Fix #11 (fuite d'erreurs)

**Semaine 2 (Fiabilite) :**
- Fix #3 (waitUntil)
- Fix #9, #10 (matching batching)
- Fix #14, #15 (event-bus + rate-limit en prod)

**Semaine 3 (Hardening) :**
- Fix #16-#18 (enumeration, CSRF, middleware)
- Fix #23, #24 (business logic)
- Fix #27 (prompt injection)
- Fix #28 (dead code cleanup)

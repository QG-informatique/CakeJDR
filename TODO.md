# TODO

## Plan 1.0 — décisions
- [x] Base de données : Neon Postgres (offre gratuite, intégration Vercel native)
- [x] Authentification : Clerk via la Marketplace Vercel, plutôt qu'Auth.js — identifiants OAuth partagés en développement, donc aucune application Discord/Google à créer pour démarrer
- [x] Mode visiteur : retenu, sous forme de room de démonstration pré-remplie (revient sur la recommandation initiale de ne pas en faire)
- [ ] Trancher : mot de passe de table **et** invitations, ou invitations seules
- [ ] Trancher : modèles de fiche liés à la table, ou bibliothèque réutilisable entre tables

## Phase 1 — identité (Clerk + Neon)
- [x] Créer la base Neon et reporter `DATABASE_URL` dans `.env.local`
- [x] Installer Clerk depuis Vercel → Marketplace
- [ ] Activer Discord, Google et email dans le tableau de bord Clerk (sans quoi la fenêtre d'inscription reste vide)
- [x] Cabler Clerk : `proxy.ts`, `ClerkProvider`, boutons de connexion, CSP élargie
- [ ] Propager le `userId` Clerk jusqu'à `/api/liveblocks-auth` (fin du `randomUUID()`)
- [ ] Écrire le schéma de base (comptes, tables, membres, fiches) et le pousser sur Neon
- [ ] Migrer la propriete des rooms de `ownerHash` (secret navigateur) vers `ownerId` (compte)
- [ ] Rattacher les fiches de personnage au compte plutot qu'au `localStorage`
- [ ] Faire du MJ le createur de la table, verifie serveur, au lieu d'un booleen client
- [ ] Remplacer l'acces admin par mot de passe par un role sur le compte
- [ ] Ajouter le bouton « Visiter sans compte » sur l'ecran de connexion

## Phase 2 — room de démonstration
- [ ] Creer la room de demonstration pre-remplie (fiches d'exemple, dessin, messages, musique) et son bandeau « session de demonstration »
- [ ] Reinitialiser la room de demonstration toutes les heures via une tache planifiee Vercel
- [ ] Interdire au visiteur : creer une table, sauvegarder dans le cloud, acceder a l'admin

## Mise en ligne — à faire avant le premier deploiement en production
- [ ] Creer l'application OAuth Discord et renseigner ses identifiants dans Clerk (obligatoire : l'instance de production n'utilise pas les identifiants partages)
- [ ] Creer l'application OAuth Google et renseigner ses identifiants dans Clerk
- [ ] Prevenir les testeurs que les comptes crees en preproduction ne sont pas transferes en production

## Sécurité — à faire avant toute mise en ligne publique
- [ ] Définir un vrai `ADMIN_PASSWORD` dans `.env.local` (encore au placeholder `REMPLACE_MOI`) et sur Vercel avant tout déploiement — sans ça `/admin` reste inutilisable en prod
- [x] Authentifier `/api/roomstorage` (GET/POST/DELETE) via un jeton d'accès à la room
- [x] Contraindre `/api/blob` (préfixe `FichePerso/` imposé, JSON seul, 256 Ko max, débit limité) et supprimer `/api/blop/delete`
- [x] Limiter le débit de `/api/cloudinary/signature` et `/api/cloudinary`, retirer le SVG des formats acceptés
- [x] Remplacer le hash SHA-256 nu des mots de passe de room par scrypt salé, avec migration transparente
- [x] Ajouter du rate-limit sur `/api/rooms/verify` (8 essais / 15 min / IP+room)

## Issu de la phase 0 — à finir plus tard
- [x] Ajouter le crédit QG Informatique, absent du projet (règle `C:\DEV\CLAUDE.md`) — footer fixe rendu par `ClientLayout`
- [ ] Corriger les 58 avertissements `react-hooks` (`purity`, `set-state-in-effect`, `refs`) concentrés dans les fonds animés, puis repasser ces trois règles en erreur dans `eslint.config.mjs` — phase 4
- [ ] Restreindre les paramètres signés de `/api/cloudinary/signature` (formats, taille) après vérification de la doc Cloudinary — seule la limite de débit est en place
- [ ] Donner une propriété par utilisateur aux fiches stockées dans Blob — aujourd'hui contraintes mais pas rattachées à un compte (phase 1)
- [ ] Remplacer le jeton d'accès à la room par la session utilisateur une fois l'auth en place (phase 1)

## Qualité / outillage
- [x] Réparer `npm run lint` et le crash ESLint — flat config native, `FlatCompat` supprimé
- [x] Mettre en place une CI GitHub Actions (typecheck, lint, audit, build)
- [ ] Ajouter des tests e2e Playwright : rendu des pages, join room (avec et sans mot de passe), upload image, lancer de dé, import/export personnage
- [x] Traiter les vulnérabilités `npm audit` (0 restante, `@vercel/blob` monté en v2)
- [ ] Nettoyer types résiduels `any` si possible sans rigidifier les structures Lson

## Nettoyage repo
- [x] Retirer `tmp/` du suivi git (1963 fichiers, dont `node.exe` ~71 Mo, versionnés par erreur)
- [ ] Purger `node.exe` et `node.zip` de l'historique git (`git filter-repo`) — retirés du contenu actuel mais toujours dans l'historique, `.git` pèse ~70 Mo ; réécrit tous les SHA, à faire à un moment calme
- [ ] Supprimer le code mort : `components/rooms/RoomJoinGuard.tsx` et `components/rooms/RoomSelector.tsx` (plus importés nulle part)
- [ ] Migrer le rate-limit du login admin (`lib/rateLimit.ts`, en mémoire) vers Vercel KV/Redis pour un vrai quota en serverless

## Rooms / Auth
- [x] Hasher le mot de passe de room côté serveur (`metadata.passwordHash`) et ne plus exposer le mot de passe en clair
- [x] Corriger le flux de connexion aux rooms protégées (le token d'accès n'était pas mémorisé, rendant ces rooms inaccessibles)
- [x] Empêcher la suppression/renommage d'une room par un tiers (système de secret de propriété + accès admin)
- [ ] Ajouter un petit loader « jeu vidéo » lors de la vérification du mot de passe (indicateur minimal déjà présent, à améliorer via framer-motion)

## Canvas & temps réel
- [ ] Throttler les segments de trait pour réduire le trafic Liveblocks lors de dessins rapides (coalescer via requestAnimationFrame)
- [ ] Déplacer l'aperçu d'image en attente sur un calque dédié avec indicateur de progression

## Personnages / Cloud
- [ ] Ajouter confirmation et gestion des erreurs détaillées pour la suppression cloud
- [ ] Ajouter un bouton « Cloud » principal avec modal centralisée (pagination Blob si la liste dépasse 100 items)

## Dés 3D
- [ ] Implémenter une file d'attente par joueur (limiter à 1 lancer actif/joueur) au-delà du cooldown local
- [ ] Ajouter une version cube simulé D20/D6/D4/D100 avec orientation finale selon le résultat

## Musique YouTube
- [ ] Synchroniser proprement le `playing` post-initialisation sans reprise automatique au premier chargement
- [ ] Mémoriser une préférence de volume locale par room

## Session Summary / Lexical
- [ ] Vérifier le provider Liveblocks/Lexical sur plusieurs rooms (éviter un second RoomProvider caché)
- [ ] Envisager une persistance Blob debouncée (60–120s) pour les snapshots de session

# TODO

## Plan 1.0 — décisions
- [x] Base de données : Neon Postgres (offre gratuite, intégration Vercel native)
- [x] Authentification : Clerk via la Marketplace Vercel, plutôt qu'Auth.js — identifiants OAuth partagés en développement, donc aucune application Discord/Google à créer pour démarrer
- [x] Authentification revue : Auth.js (Google et Discord) à la place de Clerk, pour rester sur l'adresse `.vercel.app` sans nom de domaine ; connexion par email abandonnée
- [x] Mode visiteur : retenu, sous forme de room de démonstration pré-remplie (revient sur la recommandation initiale de ne pas en faire)
- [ ] Trancher : mot de passe de table **et** invitations, ou invitations seules
- [ ] Trancher : modèles de fiche liés à la table, ou bibliothèque réutilisable entre tables

## Phase 1 — identité (Clerk + Neon)
- [x] Créer la base Neon et reporter `DATABASE_URL` dans `.env.local`
- [x] Installer Clerk depuis Vercel → Marketplace
- [x] Activer Google et email dans le tableau de bord Clerk — inscription verifiee dans le navigateur
- [x] Cabler Clerk : `proxy.ts`, `ClerkProvider`, boutons de connexion, CSP élargie
- [x] Propager le `userId` Clerk jusqu'à `/api/liveblocks-auth` (fin du `randomUUID()`)
- [x] Écrire le schéma de base et le pousser sur Neon
- [x] Migrer la propriete des rooms vers `ownerId` (secret navigateur garde en secours)
- [x] Remplacer le pseudo local par le compte Clerk dans toute l'application
- [x] Remplacer la sauvegarde cloud (Vercel Blob, ouverte a tous) par des fiches rattachees au compte
- [x] Faire de la liste de fiches du menu une liste du compte, et non plus d'abord du navigateur (l'envoi vers le compte est aujourd'hui manuel)
- [x] Supprimer la bascule « mode MJ » cochable par n'importe qui
- [x] Brancher le role de MJ sur `room_members.role`, fixe par le serveur dans la session Liveblocks
- [x] Reserver l'acces aux tables a leurs membres : l'adresse seule ne suffit plus
- [ ] Tester avec un second compte : invitation par code, couronne de MJ dans le chat, fiche imposee par le MJ
- [x] Aligner l'indicateur de MJ du menu sur le role par table (il reflete encore le role administrateur)
- [x] Accepter un role admin sur le compte, en plus du mot de passe
- [x] Ajouter le bouton « Visiter sans compte » sur l'ecran de connexion

## Phase 2 — accès aux tables
- [x] Supprimer l'annuaire public : une table ne se voit que si on en est membre
- [x] Ajouter un code d'invitation par table et la route pour rejoindre
- [x] Afficher un panneau de connexion au lieu du menu quand on n'a pas de compte
- [ ] Afficher dans le panel admin qui a accès à chaque table
- [x] Nettoyer les tables antérieures : cinq supprimées, `cakroom` gardée comme salle de démonstration

## Page d'accueil
- [x] Remettre le dé en page d'accueil : lancer automatique, attrapable et lançable sur tout l'écran
- [x] Vérifier à l'œil que le dé revient bien à sa place après un lancer
- [x] Valider à l'œil les coins roses du dé et sa nouvelle prise en main (soulevé, sans rouler)

## Phase 2 — room de démonstration
- [x] Creer la room de demonstration pre-remplie avec une fiche complete
- [x] Restaurer la salle de demonstration a l'arrivee d'un visiteur quand elle est vide
- [x] Ajouter le bandeau « session de demonstration » dans la salle
- [x] Copier `CRON_SECRET` (déjà généré dans `.env.local`) dans Vercel → Settings → Environment Variables, environnement Production
- [x] Interdire la creation de table sans compte
- [x] Interdire au visiteur la sauvegarde cloud des fiches

## Mise en ligne — à faire avant le premier deploiement en production
- [ ] Créer l'application OAuth Google (Google Cloud Console) et renseigner `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` dans `.env.local` et dans Vercel
- [ ] Créer l'application OAuth Discord (Discord Developer Portal) et renseigner `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` dans `.env.local` et dans Vercel
- [ ] Copier `AUTH_SECRET` (déjà généré dans `.env.local`) dans Vercel, environnement Production
- [ ] Après la première connexion, transférer la salle démo et le rôle admin vers le nouveau compte (`scripts/transfer-account.mjs`)
- [ ] Retirer l'intégration Clerk de Vercel, avec ses variables `CLERK_*` et `NEXT_PUBLIC_CLERK_*`
- [x] Réécrire `MANUAL_TEST_PLAN.md` pour les comptes, les invitations, les rôles, la salle de démonstration et les fiches du compte
- [ ] Publier les commits locaux : la version en ligne date du 30 août et n'a aucune des protections de la phase 0 (suppression de tables ouverte à tous, notamment)

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
- [x] Donner une propriété par utilisateur aux fiches (Blob remplacé par la base)
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

## Interface — langue
- [x] Traduire les textes ajoutés récemment (panneau de connexion, bandeau de démo, invitation par code), écrits en dur en français et qui ne suivent pas la bascule de langue
- [x] Passer l'application en français par défaut

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

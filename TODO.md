# TODO

## Plan 1.0 — décisions
- [x] Base de données : Neon Postgres (offre gratuite, intégration Vercel native)
- [x] Authentification : Clerk via la Marketplace Vercel, plutôt qu'Auth.js — identifiants OAuth partagés en développement, donc aucune application Discord/Google à créer pour démarrer
- [x] Authentification revue : Auth.js (Google et Discord) à la place de Clerk, pour rester sur l'adresse `.vercel.app` sans nom de domaine ; connexion par email abandonnée
- [x] Mode visiteur : retenu, sous forme de room de démonstration pré-remplie (revient sur la recommandation initiale de ne pas en faire)
- [x] Accès aux tables : invitations seules, le mot de passe de table est retiré
- [x] Modèles de fiche : bibliothèque du MJ réutilisable entre tables (chantier pour plus tard)
- [x] Tables inactives : supprimées après 6 mois sans visite, MJ prévenu dans le menu à 5 mois, salle de démo exclue

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
- [x] Afficher dans le panel admin qui a accès à chaque table
- [x] Noter la dernière ouverture de chaque table (`rooms.last_active_at`, mis à jour à l'entrée)
- [x] Nettoyer automatiquement les tables inactives (`/api/cron/cleanup-rooms`, chaque jour à 4 h 30), en excluant la salle de démonstration
- [ ] Vérifier dans les logs Vercel que la tâche `cleanup-rooms` tourne chaque nuit sans erreur (`wouldDelete` visible avec `?dry=1` en admin)
- [ ] Supprimer la colonne `rooms.password_hash`, devenue inutile (migration Neon, avec accord)
- [ ] Transformer les modèles de fiche en bibliothèque du MJ, réutilisable d'une table à l'autre
- [x] Nettoyer les tables antérieures : cinq supprimées, `cakroom` gardée comme salle de démonstration

## Phase 3 — robustesse
- [x] Supprimer `GET /api/rooms`, qui listait toutes les tables à n'importe qui
- [x] Rattacher la gestion d'une table (renommer, supprimer) au compte du MJ, au lieu d'un secret gardé dans le navigateur qui l'a créée
- [x] Afficher un bandeau quand la connexion temps réel se coupe (reconnexion, puis bouton « Recharger » si elle échoue) et prévenir avant de fermer l'onglet avec des modifications non envoyées
- [x] Envoyer les traits du canevas par paquets, une fois par image, au lieu d'un message réseau par mouvement de souris
- [x] Charger les fonds d'écran à la demande (un seul téléchargé au lieu des dix)
- [x] Réécrire les tests Playwright : contrat API d'un visiteur, menu, crédit, pages légales, salle de démonstration (`npx playwright test`, Chrome du poste)
- [x] Rendre la table utilisable sur téléphone : sous ~1000 px de large, seule la fiche s'affiche, sans canevas, dés ni chat (constaté sur la démo) — premier chantier de la phase 4
- [x] Ne plus ouvrir une connexion Liveblocks par table affichée dans le menu : le nombre de personnes en ligne vient du serveur
- [x] Compter réellement les personnes présentes dans une table (`usersCount` n'existe pas chez Liveblocks : la démo se réinitialisait sous les pieds des joueurs, la colonne « Connectés » de l'admin restait à 0)
- [ ] Essayer la table sur un vrai téléphone (iPhone et Android) après la mise en ligne de la phase 4
- [x] Limiter côté serveur le nombre de tables qu'un compte peut créer (le garde-fou actuel est dans le navigateur) — phase 5

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
- [x] Ajouter le sous-domaine dans Vercel (Settings → Domains), créer le CNAME correspondant dans la zone DNS OVH de `qg-informatique.fr`, attendre « Valid Configuration »
- [x] Ajouter les redirections Discord `http://localhost:3000/api/auth/callback/discord` et `https://<sous-domaine>/api/auth/callback/discord`
- [x] Créer l'application OAuth Google (Google Cloud Console) et renseigner `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` dans `.env.local`
- [x] Renseigner `AUTH_GOOGLE_ID` et `AUTH_GOOGLE_SECRET` dans Vercel, environnement Production
- [x] Créer l'application OAuth Discord et renseigner `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` dans `.env.local`
- [x] Renseigner `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` dans Vercel, environnement Production
- [x] Créer l'application Google : compléter le Branding (accueil, `/confidentialite`, `/conditions`, domaine `qg-informatique.fr`), publier, créer le client Web
- [x] Relire `app/confidentialite` et `app/conditions` (nom, email de contact, hébergeur) avant la mise en ligne
- [ ] Compléter les mentions légales (`app/conditions`) avec l'adresse et le SIRET de QG Informatique, obligatoires pour un éditeur professionnel
- [x] Rendre les pseudos uniques (sans tenir compte des majuscules) : suffixe automatique à la première connexion si le nom est pris, refus au changement de pseudo
- [ ] Tester l'écran « Choisis ton pseudo » avec le compte Google de test (CakeSama-2), pseudo libre puis pseudo déjà pris
- [x] Identifier le propriétaire d'une fiche par l'identifiant du compte et non par le pseudo (`c.owner === profile.pseudo` dans `HomePageInner.tsx` et `MenuAccueil.tsx`)
- [x] Ajouter un bouton « Supprimer mon compte » (aujourd'hui la suppression se demande par email)
- [ ] Tester « Supprimer mon compte » avec un compte jetable ayant une table : la table doit disparaître pour ses joueurs
- [x] Supprimer aussi les images Cloudinary d'un compte supprimé (aujourd'hui elles ne sont rattachées à aucun compte)
- [x] Supprimer aussi chez Cloudinary une image retirée du plateau (aujourd'hui seule la suppression de la table entière l'efface)
- [ ] Tester avec un compte jetable qu'une table supprimée emporte ses images sur Cloudinary (`lib/cloudinaryCleanup.ts`)
- [ ] Vérifier en ligne qu'une image téléversée puis retirée du plateau disparaît de la médiathèque Cloudinary (`app/api/cloudinary/remove/route.ts`)
- [x] Effacer chez Cloudinary les images que les visiteurs ajoutent à la salle de démo, perdues à sa remise à zéro (`lib/demoRoom.ts`)
- [x] Copier `AUTH_SECRET` (déjà généré dans `.env.local`) dans Vercel, environnement Production
- [x] Après la première connexion, transférer la salle démo et le rôle admin vers le nouveau compte (`scripts/transfer-account.mjs`)
- [x] Retirer l'intégration Clerk de Vercel, avec ses variables `CLERK_*` et `NEXT_PUBLIC_CLERK_*`
- [ ] Traiter les variables marquées « Needs attention » dans Vercel (les passer en « Sensitive », en régénérant la valeur si Vercel le demande)
- [ ] Après la mise en ligne, supprimer `BLOB_READ_WRITE_TOKEN` et le store Vercel Blob (plus utilisés par le code), après avoir vérifié qu'aucune ancienne fiche n'y reste à récupérer
- [x] Réécrire `MANUAL_TEST_PLAN.md` pour les comptes, les invitations, les rôles, la salle de démonstration et les fiches du compte
- [x] Publier les commits locaux : la version en ligne date du 30 août et n'a aucune des protections de la phase 0 (suppression de tables ouverte à tous, notamment)

## Sécurité — à faire avant toute mise en ligne publique
- [x] Définir un vrai `ADMIN_PASSWORD` dans `.env.local` (encore au placeholder `REMPLACE_MOI`) et sur Vercel avant tout déploiement — sans ça `/admin` reste inutilisable en prod (remplacé : les droits admin viennent du compte, `users.is_admin`)
- [ ] Supprimer `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` des variables Vercel s'ils y sont
- [x] Authentifier `/api/roomstorage` (GET/POST/DELETE) via un jeton d'accès à la room
- [x] Contraindre `/api/blob` (préfixe `FichePerso/` imposé, JSON seul, 256 Ko max, débit limité) et supprimer `/api/blop/delete`
- [x] Limiter le débit de `/api/cloudinary/signature` et `/api/cloudinary`, retirer le SVG des formats acceptés
- [x] Remplacer le hash SHA-256 nu des mots de passe de room par scrypt salé, avec migration transparente
- [x] Ajouter du rate-limit sur `/api/rooms/verify` (8 essais / 15 min / IP+room)

## Issu de la phase 0 — à finir plus tard
- [x] Ajouter le crédit QG Informatique, absent du projet (règle `C:\DEV\CLAUDE.md`) — footer fixe rendu par `ClientLayout`
- [ ] Corriger les 58 avertissements `react-hooks` (`purity`, `set-state-in-effect`, `refs`) concentrés dans les fonds animés, puis repasser ces trois règles en erreur dans `eslint.config.mjs` — phase 4
- [x] Restreindre les paramètres signés de `/api/cloudinary/signature` (formats, taille) après vérification de la doc Cloudinary — formats signés et compte requis ; Cloudinary n'a pas de paramètre de taille
- [x] Donner une propriété par utilisateur aux fiches (Blob remplacé par la base)
- [x] Remplacer le jeton d'accès à la room par la session utilisateur une fois l'auth en place (phase 1) — le jeton reste, mais n'est remis qu'aux membres reconnus par leur session

## Qualité / outillage
- [x] Réparer `npm run lint` et le crash ESLint — flat config native, `FlatCompat` supprimé
- [x] Mettre en place une CI GitHub Actions (typecheck, lint, audit, build)
- [ ] Ajouter les tests e2e avec compte : rejoindre une table par code d'invitation, upload image, lancer de dé, import/export personnage (demande un compte de test et une session simulée)
- [x] Traiter les vulnérabilités `npm audit` (0 restante, `@vercel/blob` monté en v2)
- [ ] Nettoyer types résiduels `any` si possible sans rigidifier les structures Lson

## Nettoyage repo
- [x] Retirer `tmp/` du suivi git (1963 fichiers, dont `node.exe` ~71 Mo, versionnés par erreur)
- [ ] Purger `node.exe` et `node.zip` de l'historique git (`git filter-repo`) — retirés du contenu actuel mais toujours dans l'historique, `.git` pèse ~70 Mo ; réécrit tous les SHA, à faire à un moment calme
- [x] Supprimer le code mort : `components/rooms/RoomJoinGuard.tsx` et `components/rooms/RoomSelector.tsx` (plus importés nulle part) — avec `MusicPanel`, `OnlineProfiles`, `useOnlineStatus`, `/api/timestamp` et 13 paquets npm inutilisés
- [ ] Migrer le rate-limit du login admin (`lib/rateLimit.ts`, en mémoire) vers Vercel KV/Redis pour un vrai quota en serverless

## Rooms / Auth
- [x] Hasher le mot de passe de room côté serveur (`metadata.passwordHash`) et ne plus exposer le mot de passe en clair
- [x] Corriger le flux de connexion aux rooms protégées (le token d'accès n'était pas mémorisé, rendant ces rooms inaccessibles)
- [x] Empêcher la suppression/renommage d'une room par un tiers (système de secret de propriété + accès admin)

## Interface — langue
- [x] Traduire les textes ajoutés récemment (panneau de connexion, bandeau de démo, invitation par code), écrits en dur en français et qui ne suivent pas la bascule de langue
- [x] Passer l'application en français par défaut

## Canvas & temps réel
- [ ] Proposer un fond fixe (et respecter `prefers-reduced-motion`) : le fond aux dés saccade sur un navigateur sans accélération matérielle (constaté sur Firefox)
- [x] Throttler les segments de trait pour réduire le trafic Liveblocks lors de dessins rapides (coalescer via requestAnimationFrame)
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

## Ordre validé (2026-10-04) : débug → refonte en thème → bibliothèque → public → autres thèmes

## Débug — fin de phase 3
- [x] Revoir le dessin sur le canevas (outils, gomme, images, calques) et corriger ce qui casse
- [x] Revoir les dés 3D (lancers, résultats partagés, historique)
- [x] Revoir le chat (envoi, couronne du MJ, messages longs)
- [x] Revoir les fiches de personnage (édition, fiche imposée par le MJ, sauvegarde du compte)
- [x] Revoir la musique YouTube synchronisée
- [x] Revoir le résumé de session (éditeur Lexical)
- [x] Revoir l'import/export de personnages
- [x] Limiter la taille des données d'une table (traits et images accumulés sans fin)
- [ ] Tester avec deux comptes la fiche d'un joueur ouverte et modifiée par le MJ, puis le retour à « Ma fiche »
- [ ] Passer le résumé de session en vraie co-édition (plugin Lexical de Liveblocks) : aujourd'hui, si deux personnes écrivent en même temps, la dernière gagne
- [ ] Tirer les dés côté serveur : le résultat est calculé dans le navigateur, donc falsifiable
- [ ] Caler la position de la musique pour un joueur qui arrive en cours de morceau
- [ ] Ne pas perdre la modification du MJ quand le joueur est lui-même en train d'éditer sa fiche

## Refonte et thèmes — phase 4 puis 6
- [x] Concevoir la refonte graphique comme thème n°1 : couleurs, images et disposition des panneaux réunies dans un thème, pour en brancher d'autres ensuite
- [x] Poser le socle des thèmes : couleurs nommées (`app/themes.css`), liste et disposition (`lib/themes.ts`), choix gardé par joueur
- [x] Choisir la direction du thème n°1 (Ardoise retenu) puis remplir ses couleurs
- [x] Brancher les fonds animés et les couleurs d'accent (bleu, violet, rose en dur) sur le thème
- [x] Ajouter un sélecteur de thème dans l'interface (choix par joueur, gardé dans le navigateur)
- [x] Ajouter le bouton de thème dans la table elle-même (aujourd'hui seulement sur l'accueil)
- [x] Retravailler l'interface du menu et de la table dans le style Ardoise (panneaux, boutons, onglets communs)
- [ ] Faire relire la nouvelle interface (menu connecté, table, téléphone) par Quentin, puis la mettre en ligne
- [ ] Faire relire Ardoise par Quentin sur un vrai écran et un téléphone, ajuster les couleurs si besoin
- [ ] Faire de la maquette V2 un second thème (phase 6)
- [ ] Faire du pack « Papier & Sauge » (thème clair, accent vert sauge) un thème : maquettes et couleurs dans `C:\DEV\CakeJDR-themes\CakeJDR-theme-papier-sauge`

## Bibliothèque partagée — avant le public
- [x] Créer une bibliothèque de départ (cartes, monstres, PNJ, images) utilisable par tous les MJ, en plus de leurs propres images — uniquement des images dont on a les droits
- [ ] Ajouter des monstres et des PNJ à la bibliothèque (seulement 3 rencontres pour l'instant) : WebP + miniature dans `public/bibliotheque/`, puis une ligne dans `lib/library.ts`
- [ ] Proposer les portraits de la bibliothèque comme image de fiche de personnage
- [ ] Vérifier sur le site en ligne qu'on reste connecté d'un jour à l'autre (session de 30 jours dans `auth.ts`)

## Maquette V2 (ChatGPT) — après le rework
- [x] Copier la maquette V2 hors du dossier caché de Codex — copiée dans `C:\DEV\CakeJDR-V2` le 2026-10-04
- [ ] Trier avec Quentin ce qu'on garde de la V2 (bibliothèque de visuels, pions détourés sur la carte, barre de PV, menu en liste, style sobre)
- [x] Convertir en WebP les visuels V2 retenus (PNG de ~2,5 Mo chacun, 53 Mo au total) avant de les intégrer

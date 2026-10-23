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
- [x] Retirer `rooms.password_hash` du code (`lib/db/schema.ts`)
- [ ] Après la prochaine mise en ligne, supprimer la colonne `rooms.password_hash` dans Neon : `node --env-file=.env.local scripts/drop-room-password-hash.mjs` (pas avant : le site en ligne la lit encore)
- [x] Transformer les modèles de fiche en bibliothèque du MJ, réutilisable d'une table à l'autre (fait par les systèmes de l'atelier, `/atelier`)
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
- [x] Rendre au dé de l'accueil son roulement libre d'origine (il tourne dans tous les sens au lieu de basculer d'arête en arête)
- [x] Donner au dé de l'accueil une vraie physique (cannon-es, comme les dés 3D de la table) avec son dessin d'origine
- [ ] Faire juger à Quentin le lancer du dé de l'accueil (rebonds, temps avant de se poser, hauteur des sauts)
- [ ] Essayer sur téléphone le lancer au doigt du dé de l'accueil (il doit rouler, rebondir puis rentrer à sa place)

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
- [x] Compléter les mentions légales (`app/conditions`) avec l'adresse et le SIRET de QG Informatique, obligatoires pour un éditeur professionnel
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
- [ ] Après la mise en ligne, supprimer (Quentin, dans Vercel) `BLOB_READ_WRITE_TOKEN` et le store Vercel Blob (plus utilisés par le code), après avoir vérifié qu'aucune ancienne fiche n'y reste à récupérer
- [x] Réécrire `MANUAL_TEST_PLAN.md` pour les comptes, les invitations, les rôles, la salle de démonstration et les fiches du compte
- [x] Publier les commits locaux : la version en ligne date du 30 août et n'a aucune des protections de la phase 0 (suppression de tables ouverte à tous, notamment)

## Sécurité — à faire avant toute mise en ligne publique
- [x] Définir un vrai `ADMIN_PASSWORD` dans `.env.local` (encore au placeholder `REMPLACE_MOI`) et sur Vercel avant tout déploiement — sans ça `/admin` reste inutilisable en prod (remplacé : les droits admin viennent du compte, `users.is_admin`)
- [ ] Supprimer `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` des variables Vercel s'ils y sont (Quentin, dans Vercel → Settings → Environment Variables : le code ne les lit plus, vérifié le 2026-10-23 ; la CLI Vercel n'est pas connectée sur ce PC)
- [x] Authentifier `/api/roomstorage` (GET/POST/DELETE) via un jeton d'accès à la room
- [x] Contraindre `/api/blob` (préfixe `FichePerso/` imposé, JSON seul, 256 Ko max, débit limité) et supprimer `/api/blop/delete`
- [x] Limiter le débit de `/api/cloudinary/signature` et `/api/cloudinary`, retirer le SVG des formats acceptés
- [x] Remplacer le hash SHA-256 nu des mots de passe de room par scrypt salé, avec migration transparente
- [x] Ajouter du rate-limit sur `/api/rooms/verify` (8 essais / 15 min / IP+room)

## Issu de la phase 0 — à finir plus tard
- [x] Ajouter le crédit QG Informatique, absent du projet (règle `C:\DEV\CLAUDE.md`) — footer fixe rendu par `ClientLayout`
- [x] Corriger les 58 avertissements `react-hooks` (`purity`, `set-state-in-effect`, `refs`) concentrés dans les fonds animés, puis repasser ces trois règles en erreur dans `eslint.config.mjs` — phase 4
- [x] Corriger les 16 avertissements d'accessibilité `jsx-a11y` restants (fonds de fenêtre et blocs cliquables dans `InteractiveCanvas`, `ImportExportMenu`, `RoomCreateModal`, `RoomList`), puis passer ces règles en erreur
- [x] Restreindre les paramètres signés de `/api/cloudinary/signature` (formats, taille) après vérification de la doc Cloudinary — formats signés et compte requis ; Cloudinary n'a pas de paramètre de taille
- [x] Donner une propriété par utilisateur aux fiches (Blob remplacé par la base)
- [x] Remplacer le jeton d'accès à la room par la session utilisateur une fois l'auth en place (phase 1) — le jeton reste, mais n'est remis qu'aux membres reconnus par leur session

## Qualité / outillage
- [x] Réparer `npm run lint` et le crash ESLint — flat config native, `FlatCompat` supprimé
- [x] Mettre en place une CI GitHub Actions (typecheck, lint, audit, build)
- [ ] Ajouter les tests e2e avec compte : rejoindre une table par code d'invitation, upload image, lancer de dé, import/export personnage (demande un compte de test et une session simulée)
- [x] Traiter les vulnérabilités `npm audit` (0 restante, `@vercel/blob` monté en v2)
- [x] Nettoyer types résiduels `any` si possible sans rigidifier les structures Lson — plus aucun

## Nettoyage repo
- [x] Retirer `tmp/` du suivi git (1963 fichiers, dont `node.exe` ~71 Mo, versionnés par erreur)
- [x] Purger `node.exe` et `node.zip` de l'historique git local (fait le 2026-10-23 par `git filter-branch`, sauvegarde dans `C:\DEV\_sauvegardes\CakeJDR-git-avant-purge-2026-10-23`)
- [ ] À la prochaine mise en ligne, envoyer l'historique réécrit sans fetch avant : `git push --force-with-lease=main:d59361a0d34c4a45d36845d0cff3843a36eb7e9f origin main`, puis forcer aussi la branche `codex/plan-app-debug-fixes` et le tag `avant-maj-next`
- [ ] Supprimer l'ancien dossier de travail Codex `C:\Users\Cake\.codex\worktrees\c811` une fois la maquette V2 triée : il garde l'ancien historique (et `node.exe`) dans `.git`, ~114 Mo
- [x] Supprimer le code mort : `components/rooms/RoomJoinGuard.tsx` et `components/rooms/RoomSelector.tsx` (plus importés nulle part) — avec `MusicPanel`, `OnlineProfiles`, `useOnlineStatus`, `/api/timestamp` et 13 paquets npm inutilisés
- [x] Migrer le rate-limit du login admin (`lib/rateLimit.ts`, en mémoire) vers Vercel KV/Redis pour un vrai quota en serverless — décidé : non, le login admin n'existe plus et la limite en mémoire suffit (raison dans `lib/rateLimit.ts`)

## Rooms / Auth
- [x] Hasher le mot de passe de room côté serveur (`metadata.passwordHash`) et ne plus exposer le mot de passe en clair
- [x] Corriger le flux de connexion aux rooms protégées (le token d'accès n'était pas mémorisé, rendant ces rooms inaccessibles)
- [x] Empêcher la suppression/renommage d'une room par un tiers (système de secret de propriété + accès admin)

## Interface — langue
- [x] Traduire les textes ajoutés récemment (panneau de connexion, bandeau de démo, invitation par code), écrits en dur en français et qui ne suivent pas la bascule de langue
- [x] Passer l'application en français par défaut

## Canvas & temps réel
- [x] Proposer un fond fixe (et respecter `prefers-reduced-motion`) : le fond aux dés saccade sur un navigateur sans accélération matérielle (constaté sur Firefox)
- [ ] Vérifier sur Firefox que le fond aux dés du thème Classique ne saccade plus (`will-change` ajouté dans `components/ui/RpgBackground.tsx`)
- [x] Throttler les segments de trait pour réduire le trafic Liveblocks lors de dessins rapides (coalescer via requestAnimationFrame)
- [x] Déplacer l'aperçu d'image en attente sur un calque dédié avec indicateur de progression — fait dans la bibliothèque : vignette de l'image et pourcentage

## Personnages / Cloud
- [x] Ajouter confirmation et gestion des erreurs détaillées pour la suppression cloud
- [x] Ajouter un bouton « Cloud » principal avec modal centralisée (pagination Blob si la liste dépasse 100 items) — la fenêtre existe ; fiches en base, plus de Blob à paginer

## Dés 3D
- [x] Implémenter une file d'attente par joueur (limiter à 1 lancer actif/joueur) au-delà du cooldown local — déjà couvert : un lancer à la fois chez soi, limite du serveur, file bornée chez les autres
- [x] Ajouter une version cube simulé D20/D6/D4/D100 avec orientation finale selon le résultat — sans objet : remplacé par Dice Box
- [x] Remplacer les dés de la table par Dice Box : tous les types de dés, plusieurs et mélangés par lancer, départ d'un bord au hasard, vus par toute la table
- [x] Décider s'il faut un contrôle anti-triche des lancers : la face vient du navigateur du lanceur, le serveur ne fait que la vérifier et la signer (décidé le 2026-10-23 : rien, jeu entre amis)
- [x] Faire passer les dés au-dessus du portrait en bas à droite du plateau (ils roulent dessous) — déjà le cas avec Dice Box : la couche des dés est au-dessus des images du plateau
- [x] Rendre le bouton « Lancer » 0,4 s après l'arrêt de mes dés au lieu de ~4 s ; un nouveau lancer efface les dés encore posés
- [ ] Vérifier en ligne avec un second joueur que deux lancers rapprochés du même joueur se rejouent bien chez l'autre, l'un après l'autre

## Musique YouTube
- [x] Synchroniser proprement le `playing` post-initialisation sans reprise automatique au premier chargement — pas de reprise au chargement ; le bouton signale que la table écoute
- [x] Mémoriser une préférence de volume locale par room

## Session Summary / Lexical
- [x] Vérifier le provider Liveblocks/Lexical sur plusieurs rooms (éviter un second RoomProvider caché) — un seul RoomProvider (`app/Room.tsx`)
- [x] Envisager une persistance Blob debouncée (60–120s) pour les snapshots de session — sans objet : Liveblocks garde le texte, Blob abandonné

## Refonte d'octobre 2026 — détail dans `PLAN-REFONTE.md`
- [x] Phase A : garder deux thèmes (Ardoise fixe, Classique aux dés roses), ranger les autres fonds, `/` pour la connexion et `/salles` pour les salles, retirer l'indicateur de MJ du menu
- [x] Phase B : refaire l'écran de création et de modification de fiche (un seul écran, sections qui défilent, plus de chevauchement des compétences)
- [x] Phase C : refaire la fiche en partie (portrait choisi dans la bibliothèque, barre de PV, affichage compact ou complet, bouton Modifier sur la fiche, sans sélecteur de personnage ni menu import/export)
- [x] Phase D : faire de la bibliothèque le seul moyen d'ajouter une image (envoi par « + », carte en fond plein plateau, pions alliés et ennemis posés et retirés d'un clic, onglet Outils renommé Dessin)
- [x] Phase E : simplifier la barre du bas (dés, musique lecture/pause + volume avec options repliées, joueurs en ligne y compris soi)
- [x] Phase F : créer le panneau du MJ de la salle (joueurs et fiches en temps réel, droits de modification des fiches, droits de dessin)
- [x] Mettre la barre du bas sur une seule ligne : musique à gauche, dé en menu déroulant et « Lancer » au centre, joueurs à droite
- [x] Faire générer le pack d'images n° 2 par ChatGPT avec `PROMPT-PACK-IMAGES.md` (Quentin), puis le rapporter en zip
- [x] Intégrer le pack n° 2 : convertir en webp avec miniatures dans `public/bibliotheque/`, déclarer les images dans `lib/library.ts`
- [x] Une fois le site en ligne, installer le set « Cake » dans la salle de démo : `DEMO_ROOM_ID=cakroom-1753530709704 node --env-file=.env.local scripts/install-demo-cake.mjs`, vérifier la salle, puis figer avec `scripts/capture-demo-snapshot.mjs`
- [ ] Vérifier les boutons import, export et cloud des fiches sur la page des salles (possible en local avec « Connexion locale (admin) » ; attention, c'est la vraie base)
- [x] Retirer le mode édition devenu inutile des panneaux de fiche (`StatsPanel`, `EquipPanel`, `DescriptionPanel`, `CompetencesPanel`) en refaisant la fiche en partie (phase C)
- [ ] Envoyer une vraie image par le « + » de la bibliothèque, la poser, puis la supprimer, pour vérifier l'envoi et l'effacement chez Cloudinary (avec l'accord de Quentin)
- [ ] Essayer les réglages du panneau du MJ avec un vrai compte joueur : fiche verrouillée par le MJ, dessin retiré, dessin autorisé joueur par joueur
- [ ] Protéger côté serveur les réglages du MJ (fiches, dessin) et la suppression d'images de la bibliothèque, aujourd'hui bloqués dans l'interface seulement, si une table publique en a besoin

## Sécurité
- [x] Mettre en ligne la montée de Next.js 16.3.8, puis vérifier que la CI repasse au vert et faire un tour rapide du site (connexion, salle, dés, démo) ; en cas de souci, revenir au tag git `avant-maj-next`
- [x] Monter Next.js en 16.3.7 ou plus (faille critique GHSA-vcvr-r3jv-pc5j dans `next/og`, que le site n'utilise pas) et `baseline-browser-mapping` : la vérification `npm audit` de la CI échoue depuis le 4 octobre

## Campagnes, bibliothèque du MJ, systèmes de jeu — détail dans `PLAN-CAMPAGNES.md`
- [x] Démo solo : donner à chaque visiteur sa propre partie de démo (une salle Liveblocks par visiteur, `lib/demoCopy.ts`)
- [ ] Vérifier en ligne qu'un visiteur sans compte reçoit sa propre démo et la retrouve en revenant, puis, le lendemain d'une semaine sans visite, qu'elle a disparu (`demoCopiesDeleted` dans la tâche `cleanup-rooms`)
- [ ] Surveiller dans Liveblocks le nombre de salles actives par mois (une par visiteur de la démo) par rapport au forfait gratuit
- [x] Démo solo : écrire la petite aventure de Cake (Mila, pâtisserie, cave, levains, Golem de Mie Brûlée, fins selon les choix) avec le set « Cake »
- [x] Démo solo : créer le MJ automatique (raconte, pose carte, pions et musique, demande des jets et lit le résultat, propose des réponses en boutons, passe à la scène suivante)
- [x] Démo solo : ajouter le bouton « Voir côté MJ » (carnet, secrets, choix à venir, bibliothèque) et le retour au côté joueur
- [x] Démo solo : ajouter l'écran de fin (chemin parcouru, « Crée ta table », « Rejoue autrement »)
- [ ] Faire tester par Quentin le MJ automatique dans la salle de démo en ligne (vote à plusieurs, égalité tranchée au Charisme, jets, dégâts, les quatre fins)
- [x] MJ automatique : laisser le MJ humain trancher les égalités de vote dans les tables normales — mode « Je mène » lancé depuis le panneau du MJ
- [ ] Tester le mode « Je mène » avec deux comptes joueurs et un MJ : égalité tranchée par le MJ, le MJ ne vote pas et ne lance pas les jets du groupe
- [x] MJ automatique : traduire en anglais le texte de l'aventure « La fournée maudite » (`lib/autoGm/cakeDemo.ts`)
- [x] MJ automatique : le proposer hors de la salle de démo (bouton dans le panneau MJ, choix de l'aventure)
- [x] Phase H : proposer « avec MJ » ou « MJ automatique » pour les campagnes toutes prêtes, en réutilisant le moteur de la démo
- [x] Campagne automatique complète : écrire une campagne jouable sans MJ avec le moteur de la démo (`lib/autoGm/`), plusieurs branches et tirages au hasard pour qu'elle ne se joue jamais deux fois pareil
- [x] Campagne automatique complète : faire toutes ses images (cartes, PNJ, rencontres) et demander à Quentin l'accord pour les envoyer sur Cloudinary — sans objet : toutes déjà dans le pack n° 2 (`public/bibliotheque`), rien à envoyer
- [x] Campagne automatique complète : estimer et afficher sa durée en heures (par branche et en moyenne)
- [x] Proposer au début d'une partie une petite sélection de personnages tout faits, au choix — huit héros du pack (`lib/premadeHeroes.ts`), proposés dans le panneau du MJ automatique au joueur sans fiche
- [ ] Tester le choix d'un héros tout prêt avec un compte joueur neuf (fiche vide) : la fiche est remplie, portrait et pion posés, enregistrée sur le compte
- [x] Traduire en anglais les huit héros tout prêts (`lib/premadeHeroes.ts`)
- [x] Créer son personnage guidé par le MJ automatique : il pose les questions et fait tirer les dés des caractéristiques — bouton « Ou crée le tien avec le MJ, aux dés » sous les héros tout prêts (`components/autogm/GuidedHeroCreator.tsx`, `lib/heroCreation.ts`)
- [ ] Tester la création guidée de bout en bout avec un compte joueur neuf : nom, peuple, classe, tous les dés lancés sur la table, portrait, fiche enregistrée avec les bons PV
- [x] Corriger la création guidée dans une salle déjà en cours (retour de Quentin, 2026-10-10) : la demande de jet a échoué (« réessayer »), puis plus de bouton pour lancer, et un dé lancé à la main (d20 ou d6) n'a rien fait
- [x] Afficher en permanence dans la création guidée quels dés lancer (nombre et type), avec un bouton pour les lancer, même après un échec de la demande
- [x] Vérifier ce qui s'affiche quand on revient dans une salle où une aventure automatique est en cours (panneau du MJ automatique, héros tout prêts) et le rendre clair pour le joueur — encadré « en cours : scène » et groupe déjà là
- [ ] Revenir avec un compte joueur dans une salle où une aventure tourne et vérifier que l'encadré « … est en cours » s'affiche au-dessus des héros tout prêts
- [x] Traduire en anglais les peuples et les classes de la création guidée (`lib/heroCreation.ts`)
- [x] Traduire en anglais toutes les aventures automatiques une fois la campagne complète écrite
- [ ] Faire relire par un anglophone la traduction de « La Flamme sous la montagne » et de « La fournée maudite » (`lib/autoGm/en/`)
- [x] Écrire la version anglaise de chaque nouvelle aventure dans `lib/autoGm/en/` (sinon elle reste en français pour les tables anglaises) — désormais vérifié par `npm run check:en`, qui échoue s'il manque un texte
- [x] Effacer les trois croix dessinées pour l'ancienne carte dans la salle de démo (liste `strokes` de Liveblocks), puis refiger avec `scripts/capture-demo-snapshot.mjs`
- [x] Phase G : ajouter des pions simples de couleur (rond avec initiale, une couleur par joueur) pour les scènes tactiques, générés par le code, en plus des pions illustrés vus de face
- [x] Phase G : réserver la bibliothèque au MJ (le joueur ne pose que le pion de son personnage, choisi dans sa fiche)
- [x] Phase G : ajouter recherche et filtres à la bibliothèque (type, faction, acte, troupe/élite/boss/allié/PNJ)
- [x] Phase G : ajouter « Poser le pion » sur les rencontres qui ont un pion assorti, et « Montrer » une rencontre en grand à tous les joueurs
- [x] Phase G (décidé le 2026-10-08 : mis de côté, repris par la tâche « Protéger côté serveur les réglages du MJ » si une table publique en a besoin) : décider avec Quentin de la protection côté serveur — Liveblocks ne donne des droits que par salle entière : il faudrait passer les joueurs en lecture seule et faire passer toutes leurs écritures (fiche, chat, dessin, pion, résumé) par des routes API ; aujourd'hui la règle « bibliothèque au MJ, un joueur ne déplace que son pion » n'est tenue que dans l'interface
- [x] Phase H : définir le format d'une campagne (scènes, déroulé du MJ, part des joueurs, mise en place, boutons de choix vers la scène suivante)
- [x] Phase H : créer le carnet de campagne du MJ (scène en cours, « Préparer la scène », choix validés, chemin parcouru, saut de scène)
- [x] Phase H : créer le journal des joueurs (résumé et indices révélés par le MJ)
- [x] Phase H : écrire la campagne du dragon du pack n° 2, avec ses pistes — « La Flamme sous la montagne » (`lib/autoGm/dragonCampaign.ts`)
- [ ] Faire relire par Quentin la campagne « La Flamme sous la montagne » (textes, difficulté des jets, cinq fins)
- [ ] Jouer une partie entière de « La Flamme sous la montagne » à plusieurs et corriger l'estimation de durée (1 h 15 annoncée)
- [ ] Vérifier qu'un jet du MJ automatique (DD de 11 à 15) reste juste en Fantasy 5E et en Enquête d100 (le DD devient-il un seuil en % ?)
- [x] Phase H : proposer « Partie libre » ou une campagne toute prête à la création d'une table
- [x] Phase H : à la création d'une table, choisir « MJ humain » ou « MJ automatique »
- [x] Phase H : à la création d'une table en MJ automatique, choisir la campagne (la démo ou « La Flamme sous la montagne ») et arriver directement au début de l'aventure
- [x] Phase H : dans une salle déjà créée, activer ou couper le MJ automatique depuis un interrupteur visible — bouton « MJ auto » dans la barre du plateau (`AutoGmSwitch.tsx`)
- [x] Phase H : en arrivant dans une aventure avec une fiche faite ailleurs, proposer « Créer un héros pour cette histoire » ou « Choisir un de mes personnages » au lieu de garder d'office la fiche sélectionnée — onglet Héros avec « Ou garde une de tes fiches »
- [x] Permettre de désélectionner son personnage (fiches) pour entrer dans une salle sans personnage
- [x] Phase H : en MJ automatique, cacher au créateur de la table tout le côté MJ (notes secrètes, scènes à venir, fins) : il joue comme les autres joueurs — bouton « Côté MJ » réservé au MJ humain
- [x] Phase H : donner au créateur d'une table en MJ automatique un menu de secours qui ne révèle pas l'histoire (relancer la scène, annuler un jet bloqué, passer à la suite, reprendre la main en MJ humain) — menu « Secours » sous la scène (`RescueMenu.tsx`)
- [ ] Essayer chaque bouton du menu « Secours » pendant une vraie partie (rejouer la scène, annuler un jet, passer à la suite, reprendre la main, arrêter)
- [ ] Phase H : vérifier qu'une campagne entière se joue en MJ automatique sans aucun MJ humain dans la salle (votes, égalités, jets, dégâts, création des héros)
- [x] Phase I : décrire la fiche de personnage comme un système (caractéristiques, ressources, compétences, dés, niveaux) et en faire le preset « Narratif CakeJDR »
- [x] Phase I : faire lire au système toute la fiche (ressources, montée de niveau, champs d'identité et d'histoire), pas seulement caractéristiques, attaques et types de compétences (`lib/gameSystems.ts`)
- [x] Phase I : choisir deux ou trois autres presets, en vérifiant la licence de toute règle reprise — « Fantasy 5E » (SRD 5.2.1, CC-BY-4.0) et « Enquête d100 » (BRP UGE, ORC), mentions dans `app/conditions/page.tsx`
- [x] Phase I : choisir le système à la création d'une table — rangé dans les réglages Liveblocks de la salle (`settings.system`), sans colonne en base ; le MJ peut le changer dans son panneau
- [x] Phase I : ajouter au système d100 ses ressources propres (points de magie, santé mentale) et les afficher sur la fiche
- [ ] Vérifier sur une table d100 neuve les barres Points de magie et Santé mentale sous les PV, et leurs valeurs de départ (Pouvoir, Pouvoir × 5)
- [x] Phase I : afficher « — » plutôt que « 0 % » pour Corpulence et Pouvoir tant que la fiche d100 ne les a pas remplis
- [ ] Tester les trois systèmes avec un second compte joueur : fiche, test du MJ (seuil d100 caché), montée de niveau Fantasy 5E (un seul dé de vie)
- [x] Phase J : créer l'éditeur de système (partir d'un preset, aperçu de la fiche en direct) — atelier du MJ (`/atelier`)
- [x] Phase J : à la création d'une table, ajouter « Créer mon système » à côté des systèmes proposés — systèmes et campagnes de l'atelier listés dans la fenêtre, lien vers l'atelier
- [x] Phase J : ajouter une entrée « Systèmes de jeu » dans le menu principal, à côté des salles et des personnages — lien « Atelier du MJ » dans la barre du profil
- [x] Phase J : créer l'éditeur de campagne (scènes reliées, images, boutons de choix), rangé dans le compte du MJ (tables en base, avec accord)
- [x] Phase J : à la création d'une table en MJ automatique, choisir une campagne toute prête ou une campagne créée dans l'éditeur, jouée par le MJ automatique
- [x] Phase J : exporter et importer une campagne en fichier, puis permettre le partage entre MJ
- [ ] Ajouter à l'éditeur de campagne les étapes combat et tirage au hasard (aujourd'hui gardées seulement si elles viennent d'un fichier importé)
- [ ] Supprimer de Cloudinary les images d'une campagne quand le MJ la supprime ou change d'image (aujourd'hui protégées, donc jamais nettoyées)
- [ ] Tester l'atelier avec un second compte : lien de partage, « Copier dans mon atelier », table créée avec le système et la campagne d'un autre MJ
- [ ] Tester « Charger une de mes campagnes » dans le panneau MJ sur une table sans aventure en cours, en MJ humain puis en MJ automatique
- [ ] Décider quoi faire d'un test d'aventure sur une caractéristique que le système perso a décochée (aujourd'hui le test reste proposé)

## Retours de Quentin sur la version en ligne (2026-10-05) — tests, niveaux, dés
- [x] Retirer le bouton « D6 montée de niveau » de la fiche du joueur (panneau de gauche) — gardé pour le MJ seulement, en attendant mieux
- [x] Laisser le MJ choisir comment se passe une montée de niveau : jets de dés qui donnent des points, ou caractéristiques augmentées directement par le MJ
- [x] Permettre au MJ de demander plusieurs jets d'un coup à un joueur (par exemple 6 D6, un par caractéristique, pour une montée de niveau), lancés en une seule fois
- [x] Créer les tests demandés par le MJ : il choisit le joueur, la caractéristique et la difficulté (par exemple Force contre 10), sans forcément l'annoncer au joueur
- [x] Définir avec Quentin le calcul d'un test (résultat du dé + modificateur de la caractéristique, comparé à la difficulté) et l'expliquer dans l'interface — validé : D20 + modificateur, réussi si le total atteint la difficulté
- [x] Afficher le résultat d'un test à toute la table (« Cake a réussi son test de Force »), avec réglages du MJ (difficulté visible ou cachée, texte)
- [ ] Tester un test du MJ avec un second compte joueur : vérifier que le joueur ne voit jamais la difficulté cachée, ni sur sa carte, ni dans le chat, ni dans le bandeau
- [ ] Tester une montée de niveau « Le joueur lance » avec un second compte joueur, fiches réservées au MJ : les gains doivent arriver sur la fiche du joueur et sur son compte
- [ ] Vérifier avec un second compte joueur que le lancer des dés sur la table apparaît chez lui au même moment et sur le même résultat
- [x] Garder les gains de la montée de niveau du MJ s'il ouvre la fiche d'un joueur pendant l'animation de ses dés (mis de côté, appliqués à son retour sur sa fiche)
- [ ] Vérifier avec un second compte joueur que les gains du MJ arrivent bien quand il revient sur sa fiche après en avoir ouvert une autre pendant ses dés
- [x] Rendre visible d'où vient un modificateur de caractéristique (par exemple Force 8 donne −1) : règle ou équipement — bulle au survol, règle calculée + bonus d'équipement (`lib/modifiers.ts`)
- [ ] Vérifier sur téléphone que la bulle d'origine des modificateurs s'ouvre au toucher et se referme
- [x] Tester le dé pris en main avec un second compte joueur et sur téléphone (doigt), en conditions réelles de latence — sans objet : plus de prise en main avec Dice Box
- [x] Réduire les lancers lents où le lanceur voit le chiffre du dé changer en fin de course (`steerLabels`, `lib/diceThrow.ts`) — résolu par le tirage d'avance (`lib/diceDraw.ts`)
- [x] Vérifier en ligne le délai du tirage d'avance (`/api/dice` avec `peek`) : sous ~300 ms, le chiffre est déjà sur le dé au lâcher — sans objet : plus de tirage d'avance
- [ ] Vérifier sur téléphone que les dés Dice Box se chargent et restent fluides avec 8 dés mélangés
- [x] Faire venir la règle des modificateurs du système de jeu de la table (narratif : pas de règle, système perso : règles du créateur) — brancher `RULES` de `lib/modifiers.ts` sur le système choisi à la création de la table (Phase I)
- [x] Ne colorer le dé (jaune pour un critique, etc.) qu'au moment où le résultat apparaît, pas dès le début du lancer
- [x] Remplacer le dé actuel de la table par un vrai dé physique comme celui de la page d'accueil (rebonds sur les bords), synchronisé chez tous les joueurs : tout le monde voit le lancer et le résultat, qui reste tiré par le serveur

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
- [x] Passer le résumé de session en vraie co-édition (plugin Lexical de Liveblocks) : aujourd'hui, si deux personnes écrivent en même temps, la dernière gagne — fait avec `@liveblocks/yjs`, une page = un texte Yjs
- [ ] Vérifier la co-édition du Résumé avec deux vrais comptes sur deux appareils (testé avec deux onglets du même compte)
- [x] Remettre aussi le Résumé (pages et textes Yjs) à zéro avec la salle de démo, sinon ce qu'y écrit un visiteur reste (`lib/demoRoom.ts`) — remis avec deux pages d'exemple (« À quoi sert ce Résumé », « Séance 1 »)
- [ ] Vérifier en ligne, à la prochaine remise à zéro de la salle de démo, que le Résumé montre bien ses deux pages d'exemple
- [x] Tirer les dés côté serveur : le résultat est calculé dans le navigateur, donc falsifiable
- [x] Vérifier en ligne qu'un lancer de dé s'affiche chez tous les joueurs avec le bouclier « Lancé par le serveur » — bouclier retiré le 2026-10-08, l'affichage chez l'autre joueur reste vérifié par la ligne « second compte joueur » des dés
- [x] Caler la position de la musique pour un joueur qui arrive en cours de morceau (position partagée `pos`/`at`, curseur déplacé suivi par toute la table)
- [ ] Vérifier à deux joueurs que la musique tombe au même endroit chez celui qui arrive, et que le curseur déplacé par l'un recale l'autre
- [x] Ne pas perdre la modification du MJ quand le joueur est lui-même en train d'éditer sa fiche (à l'enregistrement, seuls les champs modifiés par le joueur remplacent la fiche)
- [ ] Vérifier avec un second compte : le MJ retire des PV pendant que le joueur a l'écran « Modifier la fiche » ouvert, le joueur enregistre, les PV retirés restent

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
- [x] Faire de la maquette V2 un second thème (phase 6) — thème « Nocturne », couleurs de la V2
- [ ] Faire relire le thème « Nocturne » (couleurs de la V2) par Quentin et dire s'il remplace Classique
- [x] Faire du pack « Papier & Sauge » (thème clair, accent vert sauge) un thème : maquettes et couleurs dans `C:\DEV\CakeJDR-themes\CakeJDR-theme-papier-sauge` (fait : `app/themes.css`, choix « Papier & Sauge » du sélecteur)
- [ ] Faire relire le thème clair « Papier & Sauge » par Quentin (menu, table, téléphone)

## Bibliothèque partagée — avant le public
- [x] Créer une bibliothèque de départ (cartes, monstres, PNJ, images) utilisable par tous les MJ, en plus de leurs propres images — uniquement des images dont on a les droits
- [ ] Dessiner les images de nouveaux monstres et PNJ (Quentin) : WebP + miniature `-mini` dans `public/bibliotheque/rencontres/`, puis Claude ajoute une ligne par image dans `lib/library.ts`
- [ ] Vérifier sur le site en ligne qu'on reste connecté d'un jour à l'autre (session de 30 jours dans `auth.ts`)

## Maquette V2 (ChatGPT) — après le rework
- [x] Copier la maquette V2 hors du dossier caché de Codex — copiée dans `C:\DEV\CakeJDR-V2` le 2026-10-04
- [ ] Trier avec Quentin ce qu'on garde de la V2 (bibliothèque de visuels, pions détourés sur la carte, barre de PV, menu en liste, style sobre)
- [x] Convertir en WebP les visuels V2 retenus (PNG de ~2,5 Mo chacun, 53 Mo au total) avant de les intégrer

## Retours de Quentin après les tests en ligne (2026-10-08)
- [x] Rendre moins transparent le panneau qui s'ouvre au bouton des dés (choix des dés, `components/dice/DiceRoller.tsx`) : fond à ~50 % d'opacité au moins, texte et cases bien lisibles — à confirmer avec Quentin que c'est bien ce panneau
- [x] Renommer « Règles du narrateur » dans la bulle des modificateurs : la règle (10 donne +0, ±1 tous les 2 points) est celle de D&D, pas un choix du narrateur — trouver un nom honnête (« Règle de base », « Règle D&D ») ou laisser le MJ choisir la règle
- [x] Décider s'il faut garder la limite de 20 dés par lancer (`POOL_MAX`, `lib/dicePool.ts`) — gardée pour l'instant, « largement suffisant » (Quentin, 2026-10-08)
- [x] Ajouter au dessin un sélecteur de couleur libre, avec 3 à 5 emplacements de couleurs perso enregistrés dans la barre du haut ; la barre garde toujours la même taille
- [x] Refaire complètement le Résumé de partie : plus simple, plus clair, au style de la nouvelle interface (revoir les boutons importer, exporter, supprimer)
- [x] Écrire un résumé d'histoire d'exemple pour la salle de test (pourquoi Cake est là, pourquoi il se bat contre ces monstres, où il en est), une demi-page au plus
- [x] Proposer d'autres statistiques de dés en plus des taux d'échecs et de critiques — retenus : chance de chaque joueur (barre, 50 % = moyenne), le plus chanceux de la table, dé le plus lancé
- [ ] Vérifier à deux joueurs la ligne « Le plus chanceux de la table » dans les statistiques des dés
- [x] Dans le chat, toujours afficher le nom du lanceur en entier ; c'est la liste des dés qui se coupe quand elle est trop longue
- [x] Expliquer ou retirer le petit bouclier à côté des lancers dans le chat (il veut dire « Lancer enregistré par le serveur », mais personne ne le comprend sans survol)
- [x] Musique : garder les liens YouTube pour l'instant ; Spotify demanderait que chaque joueur relie son compte (abonnement, autorisations), écarté pour la 1.0
- [ ] Vérifier sur téléphone les emplacements de couleur du dessin et le nouveau Résumé (onglets, importer, exporter)

## Retours de Quentin après les tests en ligne (2026-10-10) — chargement
- [x] Ne plus montrer la page de connexion une fraction de seconde en entrant dans une salle : afficher un écran de chargement tant que la session n'est pas vérifiée
- [x] Afficher un écran de chargement à l'arrivée dans une salle (fond, carte, panneaux) avec une barre simple qui monte, au lieu d'un fond vide qui se remplit petit à petit

## Retours de Quentin (2026-10-12) — choix du héros et ambiance (décisions du 2026-10-12)
- [x] Phase H : à la création d'une salle, choisir MJ humain ou MJ automatique, et réglage « Nouveau héros pour cette aventure » coché d'office (les fiches déjà faites sont refusées, pour éviter un niveau 5 dans une campagne niveau 1) ; décochable dans les options de la salle
- [x] Phase H : à l'arrivée dans une aventure, proposer « Créer mon héros avec le MJ » (aux dés) et « Prendre un héros tout prêt » ; « Une de mes fiches » seulement si la salle l'autorise
- [ ] Tester avec un compte joueur dans une salle « Fiches existantes acceptées » : arrivée dans l'aventure, « Ou garde une de tes fiches », la fiche gardée revient au rechargement
- [x] Phase H : quand la salle autorise les fiches déjà faites, faire valider chaque fiche par le MJ, ou par le créateur de la salle en MJ automatique (niveau de départ, caractéristiques pas trop hautes)
- [x] Phase H : arrêter de recopier toute la narration du MJ automatique dans le chat (elle est déjà dans le panneau de gauche) : n'y mettre que les choses importantes, indices et petits détails — titre de la scène et choix du groupe seulement
- [x] Phase H : dans une salle « Nouveau héros » en MJ humain sans aventure lancée, proposer aussi le choix du héros (aujourd'hui : fiche vierge seulement) — en haut de la fiche vierge
- [ ] Tester avec un compte joueur dans une salle « Nouveau héros » en MJ humain : choix du héros en haut de la fiche, création aux dés sans aventure lancée
- [x] Phase H : marquer « Choix du groupe » avec un indice ou un petit détail de la scène quand l'aventure en prévoit (champ à ajouter aux scènes) — champ `note` des choix, traduit dans `notes`, exemples dans « La fournée maudite »
- [ ] Ajouter des détails `note` aux choix de « La Flamme sous la montagne » (FR et EN)
- [ ] Écrire les indices (`clues`) de « La Flamme sous la montagne » (FR et EN), pour son journal des joueurs
- [ ] Essayer en mode « Je mène » le carnet de campagne (révéler un indice, aller à une scène) et le journal côté joueur
- [ ] Essayer la validation des fiches gardées avec un vrai compte joueur : attente, refus, acceptation, fiche modifiée après accord
- [ ] Décider si la validation du MJ doit aussi s'appliquer hors aventure (table d'un MJ humain qui accepte les fiches existantes)
- [x] Accueil : faire disparaître le bouton « Entrer dans <salle> » quand on supprime la salle choisie (il reste jusqu'au rechargement)
- [ ] Tester en ligne la création d'une salle en MJ automatique (campagne, arrivée directe, fiche vierge, choix du héros)
- [x] Phase Ambiance : trouver des sons d'interface libres de droits (licence CC0 de préférence) et les ajouter discrètement, ambiance JDR (clic, panneau, demande de jet, réussite, échec), avec un réglage pour les couper
- [x] Phase Ambiance : trouver des musiques libres de droits, une par type d'ambiance (taverne, voyage, forêt, donjon, combat, mystère, victoire…), licence vérifiée et notée pour chacune ; le MJ automatique change de musique quand le lieu ou l'humeur change
- [ ] Phase Ambiance : voix de narrateur grave qui lit la narration des scènes, uniquement si une solution 100 % gratuite et libre suffit (voix du navigateur, ou voix libre type Piper pré-enregistrée, licence de la voix à vérifier) ; sinon abandonner — bouton pour l'activer ou la couper, texte qui défile sous l'image agrandie, voix coupée à la fermeture de l'image, bouton « Réécouter », seule la musique reste après
- [x] Mettre à jour le README du dépôt public GitHub (inchangé depuis août 2025) : ce que fait CakeJDR, comment l'installer, services gratuits utilisés

## Retours de Quentin (2026-10-12) — suppression, image de scène, création de héros
- [x] Confirmer la suppression d'une salle par une fenêtre Oui/Non, sans suppression sur double-clic
- [x] Afficher le texte de la scène (chapitre, titre, narration) lisiblement sur l'image agrandie du MJ automatique
- [x] Création de héros : six jets placés par le MJ selon les caractéristiques de la classe, échange possible, dés écartés barrés
- [x] Bloquer le bouton de lancer pendant le jet pour qu'un double clic ne fasse pas un jet perdu
- [x] Ajouter le genre et l'historique (bonus +2 aux actions de son domaine) à la création de héros
- [x] Trier les portraits par classe, genre et peuple, et permettre d'importer son image
- [x] Produire des portraits et pions libres de droits pour chaque peuple × classe × genre (aujourd'hui 15 portraits, surtout humains) : prompt prêt dans `PROMPT-PACK-IMAGES-3.md`, à passer dans ChatGPT
- [x] Intégrer le pack d'images n° 3 reçu de ChatGPT : conversion webp + miniatures, entrées dans `lib/library.ts`, tags peuple/classe/genre dans `PORTRAIT_TAGS` (`lib/heroCreation.ts`)
- [ ] Ajouter des filtres peuple et classe dans la bibliothèque si la grille des pions (130) devient trop longue à parcourir
- [x] Donner un historique aux héros tout prêts (`lib/premadeHeroes.ts`)
- [ ] Tester l'import d'une image perso dans la création de héros (envoi Cloudinary, portrait sur la fiche, pion de couleur)
- [x] Remplacer le `window.confirm` de la page admin par la fenêtre de confirmation de l'app (`app/admin/page.tsx`)
- [x] Ajouter une barre d'XP (MJ humain et automatique) : XP pour les jets réussis et les situations réglées, plus pour quêtes et monstres
- [x] Sortir la montée de niveau de la fiche du joueur vers le MJ : édition à la main ou fenêtre qui fait lancer les dés au joueur ; automatique avec le MJ automatique quand la barre est pleine, hors combat
- [ ] Tester l'XP avec un second compte joueur : XP donnée par le MJ, XP d'un test, « Niveau prêt » puis montée par dés et à la main, montée automatique avec le MJ automatique
- [ ] (Important, demandé par Quentin) Tester la montée de niveau automatique quand le meneur du MJ automatique n'est pas MJ de la table (le serveur réserve les demandes de jets au MJ)
- [ ] Régler les montants d'XP (`lib/xp.ts`) après une vraie partie : viser environ un niveau par aventure courte
- [x] Rallonger « La Flamme sous la montagne » (2 à 3 h en séances) : combats au tour par tour, voyages, décisions en plusieurs jets, niveau 4 ou 5 à la fin
- [ ] Jouer une séance de « La Flamme sous la montagne » à plusieurs : noter la durée réelle et les combats trop durs ou trop faciles (simulation : vampire et dragon gagnés une fois sur deux)
- [x] Campagne : objets utilisables en combat, plus de combats (3 au moins avant le roi gobelin), chemins en plus, type de jet annoncé sous chaque choix, récit et combat dans le panneau de droite
- [ ] Jouer « La Flamme sous la montagne » en vraie partie après le rallongement du 2026-10-22 : mesurer la durée et noter les combats trop durs ou trop faciles
- [x] Ajouter en fin de campagne un bouton « Rejouer » (même aventure, mêmes héros) et un bouton « Quitter »
- [x] Proposer en fin de campagne de rejouer avec de nouveaux héros niveau 1 (aujourd'hui « Rejouer » garde les héros et leur niveau)
- [x] (Retour de Quentin, 2026-10-22) Épreuves en plusieurs jets : une réussite partielle (1 sur 2, 2 sur 3) doit donner une suite moins bonne (moins d'infos, moins de butin) au lieu d'un échec complet
- [x] (Retour de Quentin, 2026-10-22) Affaiblir la boule de feu du mage : en solo, elle tue tous les ennemis d'un coup (2d6 à tous, une fois par combat)
- [x] (Retour de Quentin, 2026-10-22) Musiques d'ambiance du MJ automatique (Kevin MacLeod, CC BY 4.0, crédit visible obligatoire) : passe-partout, taverne, forêt, combat, donjon, boss, victoire
- [x] (Retour de Quentin, 2026-10-22) Tester une voix par PNJ avec une synthèse vocale gratuite et libre (Piper, sur le PC)
- [x] (2026-10-22) Écouter les essais Chatterbox de `C:\DEV\_outils\chatterbox\essais` (Piper jugé trop robotique) : moins robotique, manque d'intonation, Quentin enregistrera sa voix pour le narrateur
- [ ] Enregistrer la voix de Quentin dans l'Atelier des voix (`C:\DEV\_outils\chatterbox\Atelier des voix.bat`) : calme, tendu, épique
- [ ] Choisir les réglages Chatterbox du narrateur d'après `C:\DEV\_outils\chatterbox\essais\atelier\retenus.csv`, puis faire lire à Quentin les vrais textes et réécouter
- [ ] Trouver des voix libres de droits (ou de personnes d'accord) pour les PNJ, dont au moins une voix féminine
- [ ] Pré-générer la narration et les répliques des PNJ des campagnes, et les héberger gratuitement
- [ ] Lire la voix dans le jeu : bouton pour l'activer ou la couper, « Réécouter », voix coupée à la fermeture de l'image
- [ ] Tester à deux navigateurs le salon d'attente du MJ automatique : chacun « Prêt », départ quand tous le sont, départ si celui qui n'était pas prêt s'en va
- [x] Ajouter des sons par type d'action en combat (attaque au corps à corps, sort, défense), en plus des sons des boutons
- [ ] Écouter les sons de combat pendant une vraie partie et ajuster leur volume par rapport à la musique
- [x] Passer en 1.0 et réécrire le README du GitHub pour qu'il corresponde à l'état réel du projet (2026-10-23)
- [ ] Suivre `MANUAL_TEST_PLAN.md` en entier sur la 1.0 avant de l'annoncer
- [x] Afficher dans le récit le butin gagné à la fin d'une scène (potions, objets ajoutés au sac)
- [ ] Jouer seul le début de « La Flamme sous la montagne » en ligne et noter ce qui va et ce qui ne va pas (création, votes, tests, rythme)
- [ ] Vérifier la reprise d'une campagne : quitter la salle après la création du héros, choisir une autre fiche dans le menu, revenir et retrouver le même héros au même endroit de l'aventure
- [x] Accepter tous les pseudos dans l'enregistrement des fiches d'une salle : un pseudo avec un symbole ou un emoji est refusé sans message par `/api/roomstorage` (`SAFE_ID`), la fiche n'est alors gardée que dans le navigateur et sur le compte
- [x] Laisser voter sans fermer l'image montée par une scène : aujourd'hui l'image affichée cache les choix du vote tant qu'on n'a pas cliqué « Fermer »
- [ ] Si la barre du bas affiche encore une erreur en ligne, relever le message affiché (capture) et corriger la cause
- [ ] Tester à deux navigateurs le nouveau salon : réglages en lecture seule pour le joueur, « Tester le son » de chaque côté, musique lancée chez tous après le dernier « Prêt »
- [ ] Ajuster la force des dés selon l'avis des joueurs (`THROW_MIN`, `THROW_MAX`, `WILD_CHANCE`, `WILD_BOOST`, écart de départ `SPAWN_GAP` dans `components/dice/DiceBoxTable.tsx`)

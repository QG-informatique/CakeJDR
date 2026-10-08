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
- [x] Corriger les 58 avertissements `react-hooks` (`purity`, `set-state-in-effect`, `refs`) concentrés dans les fonds animés, puis repasser ces trois règles en erreur dans `eslint.config.mjs` — phase 4
- [ ] Corriger les 16 avertissements d'accessibilité `jsx-a11y` restants (fonds de fenêtre et blocs cliquables dans `InteractiveCanvas`, `ImportExportMenu`, `RoomCreateModal`, `RoomList`), puis passer ces règles en erreur
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
- [x] Proposer un fond fixe (et respecter `prefers-reduced-motion`) : le fond aux dés saccade sur un navigateur sans accélération matérielle (constaté sur Firefox)
- [ ] Vérifier sur Firefox que le fond aux dés du thème Classique ne saccade plus (`will-change` ajouté dans `components/ui/RpgBackground.tsx`)
- [x] Throttler les segments de trait pour réduire le trafic Liveblocks lors de dessins rapides (coalescer via requestAnimationFrame)
- [ ] Déplacer l'aperçu d'image en attente sur un calque dédié avec indicateur de progression

## Personnages / Cloud
- [ ] Ajouter confirmation et gestion des erreurs détaillées pour la suppression cloud
- [ ] Ajouter un bouton « Cloud » principal avec modal centralisée (pagination Blob si la liste dépasse 100 items)

## Dés 3D
- [ ] Implémenter une file d'attente par joueur (limiter à 1 lancer actif/joueur) au-delà du cooldown local
- [x] Ajouter une version cube simulé D20/D6/D4/D100 avec orientation finale selon le résultat — sans objet : remplacé par Dice Box
- [x] Remplacer les dés de la table par Dice Box : tous les types de dés, plusieurs et mélangés par lancer, départ d'un bord au hasard, vus par toute la table
- [ ] Décider s'il faut un contrôle anti-triche des lancers : la face vient du navigateur du lanceur, le serveur ne fait que la vérifier et la signer
- [x] Faire passer les dés au-dessus du portrait en bas à droite du plateau (ils roulent dessous) — déjà le cas avec Dice Box : la couche des dés est au-dessus des images du plateau
- [x] Rendre le bouton « Lancer » 0,4 s après l'arrêt de mes dés au lieu de ~4 s ; un nouveau lancer efface les dés encore posés
- [ ] Vérifier en ligne avec un second joueur que deux lancers rapprochés du même joueur se rejouent bien chez l'autre, l'un après l'autre

## Musique YouTube
- [ ] Synchroniser proprement le `playing` post-initialisation sans reprise automatique au premier chargement
- [ ] Mémoriser une préférence de volume locale par room

## Session Summary / Lexical
- [ ] Vérifier le provider Liveblocks/Lexical sur plusieurs rooms (éviter un second RoomProvider caché)
- [ ] Envisager une persistance Blob debouncée (60–120s) pour les snapshots de session

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
- [ ] Démo solo : donner à chaque visiteur sa propre partie de démo (choisir entre une salle Liveblocks par visiteur et une démo sans temps réel)
- [x] Démo solo : écrire la petite aventure de Cake (Mila, pâtisserie, cave, levains, Golem de Mie Brûlée, fins selon les choix) avec le set « Cake »
- [x] Démo solo : créer le MJ automatique (raconte, pose carte, pions et musique, demande des jets et lit le résultat, propose des réponses en boutons, passe à la scène suivante)
- [x] Démo solo : ajouter le bouton « Voir côté MJ » (carnet, secrets, choix à venir, bibliothèque) et le retour au côté joueur
- [x] Démo solo : ajouter l'écran de fin (chemin parcouru, « Crée ta table », « Rejoue autrement »)
- [ ] Faire tester par Quentin le MJ automatique dans la salle de démo en ligne (vote à plusieurs, égalité tranchée au Charisme, jets, dégâts, les quatre fins)
- [ ] MJ automatique : laisser le MJ humain trancher les égalités de vote dans les tables normales (aujourd'hui le meilleur Charisme tranche)
- [ ] MJ automatique : traduire en anglais le texte de l'aventure « La fournée maudite » (`lib/autoGm/cakeDemo.ts`)
- [ ] MJ automatique : le proposer hors de la salle de démo (bouton dans le panneau MJ, choix de l'aventure)
- [ ] Phase H : proposer « avec MJ » ou « MJ automatique » pour les campagnes toutes prêtes, en réutilisant le moteur de la démo
- [x] Effacer les trois croix dessinées pour l'ancienne carte dans la salle de démo (liste `strokes` de Liveblocks), puis refiger avec `scripts/capture-demo-snapshot.mjs`
- [x] Phase G : ajouter des pions simples de couleur (rond avec initiale, une couleur par joueur) pour les scènes tactiques, générés par le code, en plus des pions illustrés vus de face
- [x] Phase G : réserver la bibliothèque au MJ (le joueur ne pose que le pion de son personnage, choisi dans sa fiche)
- [x] Phase G : ajouter recherche et filtres à la bibliothèque (type, faction, acte, troupe/élite/boss/allié/PNJ)
- [x] Phase G : ajouter « Poser le pion » sur les rencontres qui ont un pion assorti, et « Montrer » une rencontre en grand à tous les joueurs
- [x] Phase G (décidé le 2026-10-08 : mis de côté, repris par la tâche « Protéger côté serveur les réglages du MJ » si une table publique en a besoin) : décider avec Quentin de la protection côté serveur — Liveblocks ne donne des droits que par salle entière : il faudrait passer les joueurs en lecture seule et faire passer toutes leurs écritures (fiche, chat, dessin, pion, résumé) par des routes API ; aujourd'hui la règle « bibliothèque au MJ, un joueur ne déplace que son pion » n'est tenue que dans l'interface
- [ ] Phase H : définir le format d'une campagne (scènes, déroulé du MJ, part des joueurs, mise en place, boutons de choix vers la scène suivante)
- [ ] Phase H : créer le carnet de campagne du MJ (scène en cours, « Préparer la scène », choix validés, chemin parcouru, saut de scène)
- [ ] Phase H : créer le journal des joueurs (résumé et indices révélés par le MJ)
- [ ] Phase H : écrire la campagne du dragon du pack n° 2, avec ses pistes, et la faire relire par Quentin
- [ ] Phase H : proposer « Partie libre » ou une campagne toute prête à la création d'une table
- [x] Phase I : décrire la fiche de personnage comme un système (caractéristiques, ressources, compétences, dés, niveaux) et en faire le preset « Narratif CakeJDR »
- [ ] Phase I : faire lire au système toute la fiche (ressources, montée de niveau, champs d'identité et d'histoire), pas seulement caractéristiques, attaques et types de compétences (`lib/gameSystems.ts`)
- [ ] Phase I : choisir avec Quentin deux ou trois autres presets, en vérifiant la licence de toute règle reprise
- [ ] Phase I : choisir le système à la création d'une table (colonne en base, avec accord)
- [ ] Phase J : créer l'éditeur de système (partir d'un preset, aperçu de la fiche en direct)
- [ ] Phase J : créer l'éditeur de campagne (scènes reliées, images, boutons de choix), rangé dans le compte du MJ (tables en base, avec accord)
- [ ] Phase J : exporter et importer une campagne en fichier, puis permettre le partage entre MJ

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
- [ ] Faire venir la règle des modificateurs du système de jeu de la table (narratif : pas de règle, système perso : règles du créateur) — brancher `RULES` de `lib/modifiers.ts` sur le système choisi à la création de la table (Phase I)
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
- [ ] Faire de la maquette V2 un second thème (phase 6)
- [ ] Faire du pack « Papier & Sauge » (thème clair, accent vert sauge) un thème : maquettes et couleurs dans `C:\DEV\CakeJDR-themes\CakeJDR-theme-papier-sauge`

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

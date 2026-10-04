# Journal

## 2026-10-04 — Démo solo avec MJ automatique ajoutée au plan
- `PLAN-CAMPAGNES.md` : nouvelle étape « Démo solo ». Un visiteur seul joue la petite aventure de Cake, menée par un MJ automatique (récit, jets demandés, réponses en boutons). Un bouton « Voir côté MJ » lui montre l'envers du décor.
- MJ automatique scripté plutôt qu'une IA : fiable, gratuit, toujours propre pour une vitrine.
- Ordre revu : ce qui est en attente sur la refonte d'abord, puis la démo solo, puis G et la 1.0. Le mode « MJ automatique » des campagnes viendra avec la phase H.
- La tâche « Refaire la salle de démo avec le set Cake » est remplacée par les tâches de la démo solo.
Reste ouvert : une salle par visiteur ou une démo sans temps réel, à trancher au démarrage.

## 2026-10-04 — Plan des campagnes, de la bibliothèque du MJ et des systèmes de jeu
- `PLAN-CAMPAGNES.md` : phase G (bibliothèque réservée au MJ, filtres, paires rencontre-pion), H (campagne toute prête avec carnet du MJ, choix qui mènent aux scènes suivantes, journal des joueurs), I (systèmes de jeu en presets, « Narratif CakeJDR » en base), J (créateurs de système et de campagne).
- Ordre proposé : pack n° 2 et démo, phase G, mise en ligne 1.0, puis H, I, J. La phase G passe avant le public pour que les joueurs ne voient pas toute la bibliothèque.
- Les campagnes toutes prêtes vivent d'abord en fichiers dans le projet, pour ne pas toucher à la base. Les systèmes par table et les créations des MJ demanderont des changements en base, avec accord.

## 2026-10-04 — Prompt du pack n° 2 refait pour une campagne complète
- Revirement : Quentin veut un pack complet plutôt que court, pour ne pas en refaire un autre de longtemps. `PROMPT-PACK-IMAGES.md` passe à 97 entrées, environ 129 images.
- Un monde cohérent : royaume bleu et or, culte, vampire, dragon ; trois actes et un final ; huit factions ennemies avec leurs couleurs, chacune avec troupes, élite et boss.
- Les alliés du royaume (roi, gardes, héroïne…) ont rencontre et pion ; les PNJ pacifiques ont leur rencontre. Livraison en un zip par partie, pour ne rien perdre si ChatGPT s'arrête.

## 2026-10-04 — Prompt du pack n° 2 raccourci
- `PROMPT-PACK-IMAGES.md` ramené de 66 à 38 images, sans images modèles à joindre (ChatGPT a fait le premier pack dans la même conversation) et sans génération une par une : tout d'affilée, puis un zip.
- Ajout de deux pions boss (liche, chef orc, assortis à leur rencontre) en plus du troll, devenu boss : 40 images.
- Six ennemis en double, rencontre et pion du même personnage (golem, liche, chef orc, dragon, vampire, sorcière) : le MJ montre la rencontre, puis pose le pion si ça tourne mal. 43 images.

## 2026-10-04 — Barre du bas sur une ligne, prompt du pack d'images n° 2
- Barre du bas en trois zones sur une seule ligne : musique à gauche, choix du dé en menu déroulant et « Lancer » au centre, joueurs en ligne à droite (`components/dice/DiceRoller.tsx`).
- Quand la barre est étroite, le titre du morceau se cache et le volume passe dans le menu « ⋯ » (`components/music/MusicPlayer.tsx`), pour ne jamais passer sur deux lignes.
- `PROMPT-PACK-IMAGES.md` : prompt ChatGPT pour 66 images dans le style du premier pack (cartes vue de dessus, pions alliés et ennemis, rencontres) et un set « Cake » pour la démo : pion, portrait, rencontre, sa pâtisserie, le Golem de Mie Brûlée et ses levains.

Reste ouvert : intégrer le pack quand Quentin le rapporte, puis refaire la salle de démo avec.

## 2026-10-04 — Refonte, phase F : panneau du MJ
- Bouton « MJ » sur le plateau, visible du seul MJ (`components/gm/GMPanel.tsx`) : joueurs connectés avec leur personnage, niveau et PV ; « Ouvrir la fiche » la passe dans la fiche du MJ, qui la modifie, et le joueur voit le changement en direct. Bandeau « Tu modifies la fiche de… » avec retour à sa fiche.
- Réglages partagés de la table (`lib/roomSettings.ts`, clé `settings` dans Liveblocks) : qui modifie les fiches (chacun la sienne par défaut, ou le MJ seulement : fiche en lecture, sans « Modifier », portrait ni montée de niveau) ; qui dessine (tout le monde par défaut, le MJ, ou au choix joueur par joueur).
- Ces verrous sont dans l'interface seulement, comme prévu au plan : suffisant entre amis, contournable par un joueur qui bidouille. L'ancien `GMCharacterSelector`, inutilisé, est supprimé.

Reste ouvert : essayer les verrous avec un vrai compte joueur (testé seulement côté MJ).

## 2026-10-04 — Refonte, phase E : barre du bas
- Musique sur une ligne : lecture/pause, titre, volume ; « ⋯ » ouvre le lien YouTube, la position dans le morceau et la file d'attente, et se ferme au clic ailleurs ou avec Échap (`components/music/MusicPlayer.tsx`).
- Joueurs en ligne à droite, soi compris, initiale dans un rond, nom au survol, MJ couronné (`components/chat/LiveAvatarStack.tsx`). La rangée de dés D4 à D100 et « Lancer » restent telles quelles.

## 2026-10-04 — Refonte, phase D : la bibliothèque remplace l'outil Images
- Catégories Cartes, Pions alliés, Pions ennemis, Rencontres (`lib/library.ts`) ; une carte devient le fond plein plateau, un pion se pose ou se retire d'un clic (`components/canvas/LibraryPanel.tsx`, `InteractiveCanvas.tsx`).
- « + Ajouter une image » dans chaque catégorie : l'image est gardée pour toute la salle (clé `library`), supprimable par son auteur ou le MJ. Retirer du plateau n'efface plus rien chez Cloudinary ; seul « Supprimer » le fait.
- Onglet « Anciennes images » pour retirer ce qui avait été posé avant. « Outils » devient « Dessin » (crayon, gomme, effacer tout). La démo remet aussi la bibliothèque à zéro.

Reste ouvert : envoi d'image jamais essayé pour de vrai (pas d'envoi sur le Cloudinary de Quentin sans son accord).

## 2026-10-04 — Refonte, phase C : la fiche en partie
- Haut de fiche : portrait cliquable, nom, classe, niveau, « Modifier », barre de PV colorée ; onglets et choix compact ou complet (`components/character/CharacterSheetHeader.tsx`).
- Portrait choisi dans la bibliothèque (`components/sheet/PortraitPicker.tsx`). Les panneaux de fiche ne sont plus qu'en lecture : on modifie dans l'écran d'édition.
- Le menu import/export et le sélecteur de fiche du MJ quittent la fiche.

## 2026-10-04 — Salles : cartes agrandies, Ardoise translucide
- Cartes de salle plus grandes avec membres et présence ; pastille « C » du compte retirée ; panneaux du thème Ardoise translucides.

## 2026-10-04 — Connexion locale en un clic, sans Discord ni Google
- Bouton « Connexion locale (admin) » sur la page d'accueil, qui connecte au premier compte administrateur (`auth.ts`, `components/auth/SignInButtons.tsx`).
- N'existe qu'avec `npm run dev` et depuis localhost : vérifié absent du site construit pour la mise en ligne. Demandé par Quentin, dont le compte Discord n'est pas enregistré dans le navigateur intégré.
- En local, la base est la vraie : ce qu'on modifie connecté change les vraies fiches et salles.

Reste ouvert : phases C à F de la refonte.

## 2026-10-04 — Refonte, phase B : un seul écran pour créer et modifier une fiche
- Nouvel écran `components/character/CharacterEditor.tsx` : portrait et identité à gauche, onglets Caractéristiques, Combat, Compétences, Équipement, Histoire à droite ; chaque zone défile seule, Annuler et Enregistrer restent visibles. Remplace `CharacterModal` (supprimé).
- Compétences ajoutées et modifiées directement dans la liste, sans fenêtre par-dessus : c'est ce qui créait les chevauchements.
- Le bouton « Modifier » de la fiche en partie ouvre le même écran ; la fiche n'est plus modifiable sur place (`CharacterSheet.tsx`). Échap ferme, en demandant si des modifications seraient perdues.
- Champ `portrait` ajouté à la fiche (`types/character.ts`), affiché dans la case du portrait ; le choix de l'image vient en phase C.

Reste ouvert : import, export et cloud à vérifier par Quentin, connecté ; phases C à F.

## 2026-10-04 — Refonte, phase A : deux thèmes, nouvelles adresses
- Plan de refonte en six phases écrit après le test en ligne de Quentin (`PLAN-REFONTE.md`).
- Deux thèmes seulement : Ardoise (fond fixe) et Classique (dés roses). Les neuf autres fonds animés et le clic sur le gâteau qui les faisait tourner sont retirés : c'est ce clic qui mettait un fond de Classique dans Ardoise. Fonds rangés dans `C:\DEV\CakeJDR-themesonds-archives`.
- `/` est la page de connexion, `/salles` la page des salles et des fiches ; `/menu` et `/menu-accueil` y redirigent (`next.config.ts`). Plus d'écran de connexion qui clignote en revenant d'une table.
- Bouton « ← Salles » à la place du gâteau dans la table ; indicateur couronne du menu retiré (on est MJ d'une salle parce qu'on l'a créée).

Reste ouvert : phases B à F du plan.

## 2026-10-04 — Mise en ligne des dés serveur et des correctifs React
- Commits `dc35ce3` à `a0e9248` publiés sur `cakejdr.qg-informatique.fr` : déploiement Vercel réussi, 15 tests e2e OK sur le site en ligne, clé publique des dés servie par `/api/dice/key`.

Reste ouvert : images de monstres et PNJ à dessiner ; 16 avertissements `jsx-a11y`.

## 2026-10-04 — Alertes techniques React corrigées
- Les 58 avertissements `react-hooks` (`purity`, `set-state-in-effect`, `refs`) sont corrigés, et ces trois règles repassent en erreur (`eslint.config.mjs`).
- Fonds animés : tirage au sort fait une seule fois au montage, identifiants SVG stables (`useId`). Ailleurs : valeurs déduites au lieu d'être recopiées (`HomePageInner`, `GMCharacterSelector`, `BackgroundWrapper`), langue lue via `useSyncExternalStore` (`LanguageContext`).
- Les effets qui se calent vraiment sur le navigateur ou Liveblocks gardent une exception commentée, ligne par ligne, avec sa raison.
- Table de démo vérifiée à la main, build et 15 tests e2e OK.

Reste ouvert : 16 avertissements d'accessibilité `jsx-a11y` ; images de monstres et PNJ à dessiner ; pas encore en ligne.

## 2026-10-04 — Dés tirés par le serveur, mentions légales complètes
- Le dé de la table est tiré par le serveur (`app/api/dice/route.ts`) : il tire, signe, inscrit le lancer dans le chat de la table, puis répond. Le joueur ne peut plus choisir son résultat ni relancer en douce.
- Chaque navigateur vérifie la signature (`components/chat/useDiceVerification.ts`) : bouclier « Lancé par le serveur », ou alerte orange pour un lancer écrit à la main. Clé dérivée de `AUTH_SECRET` (`lib/diceSigning.ts`), aucune variable Vercel à ajouter.
- Le résultat reste caché dans le chat pendant les 3 s de l'animation. Testé sur la démo en local, lancer de test retiré ensuite.
- Restent tirés dans le navigateur : jets de la fiche (la fiche appartient au joueur) et dés décoratifs.
- `app/conditions/page.tsx` : adresse, SIRET et directeur de publication, repris du site QG Informatique. Build et 15 tests e2e OK.

Reste ouvert : pas encore en ligne.

## 2026-10-04 — Fond animé : respect de « réduire les animations »
- `components/ui/BackgroundWrapper.tsx` : si le système demande moins d'animations, le fond uni du thème remplace le fond choisi. Vérifié dans Chrome simulé : 40 dés sans le réglage, 0 avec.
- `components/ui/RpgBackground.tsx` : `will-change: transform` sur les dés, pour aider les navigateurs qui saccadaient (Firefox). Pas vérifié sur Firefox.
- Le fond fixe existait déjà : « fond uni » dans la rotation du gâteau, et par défaut sur Ardoise.

Reste ouvert : essai sur Firefox ; pas encore en ligne.

## 2026-10-04 — Salle de démo : images des visiteurs effacées à la remise à zéro
- `restoreSnapshot` (`lib/demoRoom.ts`) relève les images Cloudinary de la salle avant de la remettre à zéro, puis efface celles qui ne sont pas dans l'état de référence.
- Vérifié en lecture seule : les 2 images actuelles de la démo sont dans l'état de référence, donc épargnées.
- Un échec côté Cloudinary n'empêche pas la remise à zéro. Build et 15 tests e2e OK.

Reste ouvert : pas encore en ligne.

## 2026-10-04 — Image retirée du plateau effacée chez Cloudinary
- Retirer une image téléversée (bouton ou touche Suppr) l'efface aussi chez Cloudinary : route `app/api/cloudinary/remove/route.ts`, appelée par `components/canvas/InteractiveCanvas.tsx`.
- Garde-fous : compte connecté, accès à la table, image plus présente sur la table (revérifiée 1,5 s plus tard), dossier `cakejdr/` seulement, jamais une image de la salle de démo, 60 retraits par 10 min.
- Images de la bibliothèque non concernées : elles sont servies par le site.
- Build et 15 tests e2e OK ; route testée sans compte (refus 401). Pas testé avec un vrai envoi Cloudinary.

Reste ouvert : essai réel en ligne avec un compte ; pas encore en ligne.

## 2026-10-04 — Ouverture au public : premiers garde-fous
- Images Cloudinary supprimées avec leur table, quelle que soit la cause (MJ, compte supprimé, ménage des tables abandonnées) : `lib/cloudinaryCleanup.ts`, appelé par `deleteRoom`. Seulement le dossier `cakejdr/`, jamais une image de la salle de démo.
- Limite de 5 tables par compte vérifiée par le serveur (`app/api/rooms/route.ts`), nom de table coupé à 60 caractères ; l'ancienne limite à 1 table par navigateur est retirée. 5 choisi par défaut, à ajuster si Quentin veut autre chose.
- Pages légales relues : connexion de 30 jours, thème, images supprimées avec la table, adresse de l'hébergeur, droits sur les images de la bibliothèque.

Reste ouvert : adresse et SIRET dans les mentions légales (Quentin) ; test de suppression avec un compte jetable ; rien n'est encore en ligne.

## 2026-10-04 — Connexion gardée 30 jours
- Session de connexion portée de 7 à 30 jours, prolongée à chaque visite (`auth.ts`) : Quentin ne veut pas repasser par Google ou Discord à chaque venue.
- Les 7 jours d'avant étaient déjà prolongés à chaque visite ; si la connexion saute encore, chercher du côté du navigateur (navigation privée, cookies effacés, panneau de l'app Claude).

Reste ouvert : vérifier en ligne, après une mise en ligne, qu'on reste connecté d'un jour à l'autre.

## 2026-10-04 — Bibliothèque de départ sur la table
- 21 images du pack de Quentin (V2) converties en WebP avec miniatures dans `public/bibliotheque/` (2,4 Mo) : 2 cartes, 8 pions détourés, 8 portraits, 3 rencontres.
- Liste et tailles dans `lib/library.ts` ; panneau `components/canvas/LibraryPanel.tsx` ouvert par un bouton « Bibliothèque » à côté de « Outils ».
- Un clic pose l'image au centre du plateau, un glisser la pose où on la lâche ; taille d'arrivée selon le type (carte grande, pion petit).
- Images servies par le site lui-même, pas par Cloudinary : rien à envoyer, rien à payer, et toujours disponibles.
- Build et 15 tests e2e OK ; essai dans la salle de démo, pion retiré après.

Reste ouvert : relecture par Quentin ; pas encore en ligne.

## 2026-10-04 — Interface retravaillée façon Ardoise (menu et table)
- Panneaux, boutons, champs et onglets communs (`ui-panel`, `ui-btn`, `ui-seg`…) dans `app/globals.css`, avec un fond et un flou par thème (`app/themes.css`) : aplats nets en Ardoise, voiles translucides en Classique.
- Table : trois panneaux espacés ; fiche avec en-tête collant (retour à l'accueil, thème, repli) et stats en cases ; chat, barre de dés, outils du plateau, notes et onglets du téléphone redessinés ; bandeau de démo déplacé en bas du plateau pour ne plus cacher les outils.
- Menu : barre de profil avec un grand bouton « Entrer dans … », tables et fiches côte à côte sur grand écran, textes anglais restants traduits, en-tête réduit.
- Build et 15 tests e2e OK (le test « fiche » vise désormais l'onglet, plus un bouton).

Reste ouvert : relecture par Quentin sur écran et téléphone ; pas encore en ligne.

## 2026-10-04 — Ardoise mis en ligne
- Thème Ardoise poussé en production (commit 4f8da8c) ; le site sert bien `data-theme="ardoise"`, 15 tests e2e OK sur le site en ligne.

Reste ouvert : relecture d'Ardoise par Quentin sur écran et téléphone, bouton de thème dans la table.

## 2026-10-04 — Thème n°1 « Ardoise » (choisi par Quentin)
- Ardoise devient le thème par défaut : gris ardoise, accent turquoise, couleur du MJ et du logo corail, police Geist, fond uni quadrillé (`app/themes.css`, `lib/themes.ts`). Classique reste disponible.
- Bleus, violets et roses en dur remplacés par l'accent et la couleur du MJ du thème dans 22 composants ; vert (validé), rouge (danger) et ambre (MJ dans le chat) gardés, ils ont un sens.
- Fond choisi gardé par thème ; le clic sur le gâteau fait toujours défiler les fonds animés (`BackgroundContext.tsx`).
- Bouton de thème à côté de la langue sur l'accueil (`components/ui/ThemeSwitcher.tsx`). Build et 15 tests e2e OK.

Reste ouvert : pas encore en ligne ; pas de bouton de thème dans la table elle-même.

## 2026-10-04 — Refonte lancée : socle des thèmes
- Couleurs de l'interface passées en noms de thème (`bg-surface`, `text-ink/60`…) dans 45 composants ; valeurs dans `app/themes.css`, liste et disposition des panneaux dans `lib/themes.ts`.
- Choix du thème gardé par joueur dans son navigateur (`components/context/ThemeContext.tsx`), appliqué avant l'affichage pour éviter un flash (`app/layout.tsx`).
- Thème « Classique » = l'apparence actuelle, à l'identique. Build et 15 tests e2e OK.

Reste ouvert : direction du thème n°1 à choisir (Taverne, Nuit arcane ou Ardoise), fonds animés et couleurs d'accent encore en dur.

## 2026-10-04 — Débug de fin de phase 3
- Résumé de session : il n'était jamais partagé en ligne (lecture fautive du stockage Liveblocks, boucle, bascule en local) ; corrigé, plus les lignes vides doublées et l'écrasement au clic (`components/chat/SessionSummary.tsx`).
- Fiches : les modifications en cours ne sont plus écrasées ; le MJ peut ouvrir, modifier et rendre la fiche d'un joueur, puis revenir à la sienne (`HomePageInner.tsx`, `GMCharacterSelector.tsx`, `CharacterSheet.tsx`).
- Canevas, dés, chat, musique, import/export corrigés ; traits et historique plafonnés pour qu'une table ne grossisse pas sans fin.
- Pack de thème « Papier & Sauge » reçu, rangé dans `C:\DEV\CakeJDR-themes` pour la phase des thèmes.

Reste ouvert : co-édition réelle du résumé, dés tirés côté serveur, test du MJ à deux comptes.

## 2026-10-04 — Maquette V2 de ChatGPT repérée

- Trouvée hors du projet, dans un dossier caché de Codex (chemin dans `TODO.md`). Même socle technique (Next 16, React 19, Tailwind 4) mais interface autonome : données dans le navigateur, sans temps réel, comptes ni base.
- Décidé : finir d'abord le rework prévu, puis reprendre les idées et les visuels de la V2, pas son code tel quel.

Reste ouvert : copier la V2 à l'abri, trier ce qu'on garde.

## 2026-10-04 — Plan revu : débug, refonte en thème, bibliothèque
- V2 copiée dans `C:\DEV\CakeJDR-V2` (hors du dossier caché de Codex, sans `node_modules`).
- Ordre validé par Quentin : débug de chaque fonction (fin de phase 3) → refonte graphique conçue comme thème n°1 (phase 4) → bibliothèque partagée de départ → public (phase 5) → autres thèmes dont la V2 (phase 6).
- Pourquoi la refonte en thème : les thèmes changeront aussi la disposition, pas seulement les couleurs ; la construire ainsi évite de la refaire.

## 2026-10-03 — Phase 4 en ligne

- Phase 4 publiée ; les 15 tests Playwright passent sur le site en ligne, dont le parcours téléphone.

Reste ouvert : essai de Quentin sur un vrai téléphone, avertissements `react-hooks` des fonds animés.

## 2026-10-03 — Phase 4 : table sur téléphone, compteur de présence

- Téléphone et tablette (< 1024 px) : un panneau à la fois (Fiche / Table / Chat) avec une barre d'onglets en bas, point rouge sur Chat quand un message arrive (`components/app/MobileTabBar.tsx`, `HomePageInner.tsx`, `lib/useIsDesktop.ts`). L'affichage ordinateur est inchangé.
- Le menu n'ouvre plus une connexion temps réel par table : il affiche « N en ligne » calculé par le serveur (`RoomList.tsx`, `RoomAvatarStack.tsx` supprimé).
- Bug trouvé : le nombre de connectés lu chez Liveblocks n'existait pas, donc toujours 0. La démo était remise à zéro à chaque entrée, même avec des joueurs dedans. Corrigé par `countActiveUsers` (`lib/liveRooms.ts`, `app/api/rooms/verify/route.ts`). Si Liveblocks ne répond pas, on suppose la démo occupée et on n'efface rien.
- 15 tests Playwright au vert, dont un nouveau parcours téléphone.

Reste ouvert : essai sur un vrai téléphone, avertissements `react-hooks` des fonds animés.

## 2026-10-03 — Phase 3 en ligne

- Phase 3 publiée ; les 14 tests Playwright passent sur le site en ligne (`E2E_BASE_URL=https://cakejdr.qg-informatique.fr npx playwright test`, `playwright.config.ts`).
- Démo vérifiée : correcte sur ordinateur, inutilisable sur téléphone (seule la fiche s'affiche). Décidé de traiter le téléphone en premier en phase 4, après les tests manuels de Quentin.

Reste ouvert : tests manuels de la phase 3 avec compte (coupure réseau, gestion de table depuis un autre appareil, dessin à deux).

## 2026-10-03 — Phase 3 : revue, code mort, coupures réseau, performance, tests

- Revue de sécurité : `GET /api/rooms` (liste publique de toutes les tables) supprimé ; renommer ou supprimer une table dépend du compte du MJ, plus d'un secret rangé dans le navigateur qui l'avait créée (`app/api/rooms/route.ts`, `lib/liveRooms.ts`). Deux MJ peuvent désormais donner le même nom à leur table.
- Code mort retiré : `MusicPanel`, `OnlineProfiles`, `useOnlineStatus`, `/api/timestamp`, helpers inutilisés, 13 paquets npm.
- Coupure réseau : bandeau « connexion perdue / rétablie / recharger » dans la table (`components/rooms/ConnectionBanner.tsx`), alerte avant de fermer l'onglet si des modifications ne sont pas parties. Testé en coupant la connexion à la main.
- Performance : traits du canevas envoyés par paquets (54 segments en 1 message au lieu de 54), fonds d'écran chargés à la demande.
- Tests Playwright réécrits, 14 au vert sur le Chrome du poste (Edge absent de la machine).

Reste ouvert : tests e2e avec compte, canevas à 0 px de haut sous ~1000 px de large (phase 4).

## 2026-10-03 — Phase 2 : tables sur invitation seule, nettoyage des tables abandonnées

- Mot de passe de table retiré partout : création, entrée, panneau admin. On entre sur invitation seule ; le jeton d'accès aux fiches reste, réservé aux membres (`app/api/rooms/verify`, `lib/roomAuth.ts`). Page `/rooms`, `RoomJoinGuard` et `RoomSelector`, inutilisés, supprimés.
- Une table où personne n'est entré depuis 6 mois est supprimée chaque nuit (`app/api/cron/cleanup-rooms`, `vercel.json`). Le MJ voit une alerte dans le menu à 5 mois (`lib/roomLifecycle.ts`). La démo n'est jamais concernée. Choisi pour ne pas garder indéfiniment des parties mortes, sans surprendre un MJ actif.
- Modèles de fiche : on en fera une bibliothèque du MJ, plus tard. Page confidentialité mise à jour.

Reste ouvert : colonne `password_hash` encore en base (Neon non touché), alerte d'inactivité non testée avec un vrai compte MJ.

## 2026-10-03 — Phase 2 : accès aux tables dans le panneau admin

- `/admin` montre qui a accès à chaque table (MJ couronné, joueurs, code d'invitation), la dernière activité et un badge démo ; filtre par pseudo (`listAllRoomAccess` dans `lib/db/rooms.ts`).
- La date de dernière activité d'une table est enfin mise à jour, à l'entrée d'un joueur (`touchRoom`, une écriture par heure au plus) : elle servira au nettoyage des tables abandonnées.
- Corrigé : une table supprimée depuis `/admin` restait en base et donc listée chez ses joueurs ; le renommage admin n'était pas reporté en base non plus.

Reste ouvert : délai de nettoyage des tables inactives, mot de passe de table, modèles de fiche — à trancher.

## 2026-10-03 — Sous-domaine OVH plutôt que l'adresse Vercel

- Revirement : le site passera sur un sous-domaine de `qg-informatique.fr` (zone DNS chez OVH), relié à Vercel par un enregistrement CNAME.
- On garde Auth.js : il ne dépend pas du domaine, et revenir à Clerk ajouterait cinq enregistrements DNS et un service de plus. Aucune adresse n'est écrite en dur dans le code, donc rien à modifier.
- Application Discord créée. Ses redirections et celles de Google pointeront vers le sous-domaine ; l'adresse `.vercel.app` reste déclarée en secours.

- Sous-domaine `cakejdr.qg-informatique.fr` en place ; l'adresse `.vercel.app` retirée plutôt que redirigée (aucun trafic dessus).
- Connexion Discord vérifiée en local ; compte admin, pseudo et salle démo transférés vers `discord:…` (`scripts/transfer-account.mjs`). Icône animée de l'application : `public/cakejdr-icon.gif`.
- Pages `/confidentialite` et `/conditions` (`components/legal/LegalPage.tsx`), liées dans le pied de page à côté du crédit : Google les exige pour publier l'application de connexion, et le RGPD pour un site à comptes.

- Application Google créée (Branding, publication, client Web) ; clés dans `.env.local`. Le bouton Google mène bien à l'écran « Accéder à l'application CakeJDR », sans erreur de redirection.
- Connexion Google vérifiée. Pseudos uniques sans tenir compte des majuscules (index `users_pseudo_lower_idx`) ; à la première connexion, écran « Choisis ton pseudo » avec disponibilité affichée pendant la frappe (`components/auth/PseudoPicker.tsx`, `app/api/me/pseudo`).
- Plus de mot de passe admin : les droits viennent du compte (`users.is_admin`, `lib/adminAuth.ts`), la route `api/admin/login` est supprimée.
- Upload d'images réservé aux comptes connectés, formats autorisés signés auprès de Cloudinary (un SVG est refusé, vérifié).
- Fiches reconnues par l'identifiant du compte (`ownerId`, `isOwnedBy` dans `types/character.ts`) et non plus par le pseudo : changer de pseudo ne fait plus perdre ses fiches.

- Mise en ligne sur `cakejdr.qg-informatique.fr` : connexions Google et Discord actives, base Neon branchée en production.
- Bouton « Supprimer mon compte » en bas du menu (`components/auth/DeleteAccount.tsx`, `DELETE /api/me`) : les tables dont le joueur est MJ partent avec son compte, pour tous leurs joueurs (choix de Quentin). Le compte admin ne peut pas se supprimer ainsi.

Reste ouvert : tester l'écran de pseudo et la suppression de compte en ligne, puis la phase 2.

## 2026-09-12 — Clerk remplacé par Auth.js (Google et Discord)

- Revirement sur la décision du 2026-09-06 : Clerk exige en production un nom de domaine à soi, et ni achat ni sous-domaine ne sont voulus. Auth.js fonctionne sur l'adresse `.vercel.app` : `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, page `app/connexion`, `components/auth/SignInButtons.tsx`.
- Connexion par email abandonnée : l'envoi des liens demanderait lui aussi un domaine vérifié. Pas d'inscription séparée, le compte est créé à la première connexion.
- Identifiant de compte `google:…` ou `discord:…`, sessions en jeton signé de 7 jours : aucune table de plus. Un service sans identifiants n'est pas proposé (sinon le clic se perdait chez Discord). `proxy.ts` supprimé, CSP débarrassée des origines Clerk.
- `scripts/transfer-account.mjs` reporte la salle démo, le pseudo et le rôle admin de l'ancien compte Clerk vers le nouveau.
- Vérifié : types, lint, accueil, `/connexion`, session vide, message d'erreur, salle démo en invité. Connexion réelle non testée : les applications Google et Discord n'existent pas encore.

Reste ouvert : créer les deux applications OAuth, copier `AUTH_SECRET` dans Vercel, transférer le compte admin après la première connexion.


## 2026-09-10 (suite 6) — Fiches du menu synchronisées avec le compte

- La liste de fiches du menu suit le compte : à l'ouverture, les fiches du compte redescendent (la plus récente l'emporte) et celles du joueur qui n'existaient que dans ce navigateur montent une fois ; chaque ajout, modification ou suppression est ensuite répercuté. En jeu, les modifications de sa fiche sont enregistrées, regroupées sur deux secondes et envoyées aussi en quittant la table.
- Piège évité : la liste locale contient aussi les fiches des autres joueurs, récupérées en passant dans leurs tables, et la fiche de démonstration. Seules les fiches dont le joueur est propriétaire vont sur son compte.
- Indicateur de MJ du menu aligné sur le rôle dans la table sélectionnée ; `MANUAL_TEST_PLAN.md` réécrit en français pour les comptes, invitations, rôles et fiches (il parlait encore de Blob et d'un mot de passe mémorisé supprimé).
- Vérifié : compilation, lint, build. Le parcours connecté n'a pas pu être testé faute de session de test : il est couvert par le plan de test.

Reste ouvert : pour la mise en ligne, Clerk exige en production un domaine à soi (les adresses `.vercel.app` sont refusées) — vérifié dans la documentation Clerk.


## 2026-09-10 (suite 5) — Role de MJ par table, acces reserve aux membres

- Le role de MJ est fixe par le serveur, table par table, dans les infos de session Liveblocks : MJ si l'on est inscrit comme tel dans la table, si l'on est administrateur, ou dans la salle de demonstration. La couronne du chat vient du role de l'expediteur et non plus de ce qu'annonce le message ; un evenement « MJ » qui impose une fiche est refuse s'il ne vient pas d'un MJ (un evenement fabrique a la main le permettait) ; le selecteur de fiche du MJ n'apparait qu'aux MJ.
- Acces aux tables reserve aux membres (`lib/db/roomAccess.ts`) : connaitre l'adresse d'une table suffisait pour y entrer, malgre la fin de l'annuaire public. La connexion Liveblocks et la verification des tables refusent desormais un non-membre, sauf salle de demonstration et administrateur.
- Ecran « Acces refuse » qui explique quoi faire (se connecter, demander le code, passer par l'accueil pour une table a mot de passe) : un refus laissait la salle sur « Loading... » indefiniment.
- Verifie : visiteur refuse sur une table sans membre (403), jeton de la salle de demo portant le role MJ, ecran de refus affiche, salle de demo intacte. Le parcours MJ avec deux vrais comptes (couronne, fiche imposee a un joueur) n'a pas pu etre teste faute de session de test.

Reste ouvert : l'indicateur de MJ du menu reflete encore le role administrateur, pas le role par table.


## 2026-09-10 (suite 4) — Fiches de personnage rattachees au compte

- La sauvegarde cloud des fiches passe de Vercel Blob a la base : nouvelle route `/api/characters` (lecture, enregistrement, suppression), qui exige un compte et ne montre a chacun que ses fiches. Blob exposait les fiches de tous a tous, meme sans compte. La cle en base combine le compte et l'identifiant de la fiche, pour que deux joueurs qui importent le meme fichier ne s'ecrasent pas.
- Les deux ecrans cloud (fenetre du menu, menu import/export de la salle) sont reecrits sur cette route ; un visiteur n'y voit plus les boutons cloud. Blob est retire : route, dependance, mentions dans la CSP et la configuration.
- Verifie : sans compte, lecture, enregistrement et suppression renvoient 401, l'ancienne route renvoie 404, et le menu de la salle de demo n'affiche plus le cloud a un visiteur. Le chemin connecte (enregistrer, lister, supprimer) n'a pas pu etre teste faute de session de test.

Reste ouvert : la liste de fiches du menu reste d'abord locale (navigateur) ; l'envoi vers le compte est manuel.


## 2026-09-10 (suite 3) — Vrai roulement du de, francais par defaut

- Retour a l'arrondi d'origine du de (14 px, sommets ouverts) : l'arrondi reduit paraissait trop carre.
- Roulement refait sur le modele d'un vrai cube : il bascule par-dessus ses aretes, un quart de tour a la fois, dans le sens du lancer ; faute d'elan il retombe du cote ou il penchait, puis oscille avant de s'arreter. L'orientation est tenue en matrice dans le repere de la table : les angles d'Euler cumules tournaient dans le repere du de, d'ou un roulement de travers et un recalage parfois en arriere. Verifie par simulation de 5 000 bascules : aucune position invalide, les 24 positions d'un cube atteintes. Le rendu a l'oeil n'a pas pu etre observe (navigateur de test masque).
- Francais par defaut, et 19 textes recents traduits (panneau de connexion, bandeau de demo, invitation, role de MJ). Bascule verifiee : francais, anglais, retour au francais.
- Constate : la version en ligne date du 30 aout (`2bae680`) et 14 commits ne sont que locaux — le site public ne beneficie encore d'aucune des protections de la phase 0.


## 2026-09-10 (suite 2) — Coins du de et bouton de langue

- Coins du de : le noyau rose ne bouchait les trous des sommets que sous certains angles, d'ou des coins tantot roses tantot vides. Retire au profit d'un arrondi des faces reduit de 14 a 6 px : le trou devient invisible sous tous les angles. Un de a la fois tres arrondi et sans trou n'est pas faisable proprement en CSS, qui ne manipule que des carres plats.
- Bouton de langue : il n'avait pas change depuis aout 2025, mais affichait des drapeaux en emoji, que Windows ne sait pas dessiner (il ecrit « GB » ou « FR »). Drapeaux redessines en SVG, code FR/EN ajoute, bouton reduit.
- Le bouton de langue et l'avatar etaient fixes chacun de leur cote et se chevauchaient une fois connecte : ils sont ranges dans une seule barre en haut a droite.

Reste ouvert : les textes ajoutes recemment (panneau de connexion, bandeau de demo, invitation) sont ecrits en dur en francais et ne suivent pas la bascule de langue, dont la valeur par defaut est l'anglais.


## 2026-09-10 (suite) — Finitions du de et CRON_SECRET

- Coins du de : les faces arrondies laissaient un trou a chaque sommet, on voyait le fond au travers. Ajout d'un noyau rose interieur (90 px, a 45 px du centre), visible uniquement par ces trous : les coins deviennent roses sans perdre l'arrondi. Taille choisie sous la limite (~46 px) au-dela de laquelle ses sommets depasseraient.
- Prise en main : le de ne roule plus quand on le tient — il se souleve, reste droit et penche seulement dans le sens du mouvement. Il ne tourne sur lui-meme qu'une fois lance.
- `CRON_SECRET` genere directement dans `.env.local` pour ne pas l'afficher dans la conversation. Verifie dans la doc Vercel que la plateforme envoie bien `Authorization: Bearer <CRON_SECRET>` a chaque execution — c'est ce que verifie `/api/demo/reset`.
- Verifie : structure du de rendue conforme (6 faces exterieures, 6 faces de noyau aux bonnes cotes). Aspect visuel non juge ici, le panneau du navigateur de test etant masqué.


## 2026-09-10 — Le de revient sur la page d'accueil

- Nouveau `components/ui/HeroDie.tsx` : le de roule tout seul dans son emplacement, et on peut l'attraper, le trainer sur tout l'ecran et le lancer — il glisse, rebondit sur les bords, se pose sur une face puis revient a sa place. Anime par refs et `requestAnimationFrame`, sans etat React par image ; immobile si le systeme demande de reduire les animations.
- Decision : cliquer sur le de ne lance **pas** la demonstration — genant pour les joueurs qui reviennent. La visite reste un bouton a part, renomme « Visiter en invite » avec une phrase qui precise que rien n'est conserve.
- Trouve en testant : `setPointerCapture` peut etre refuse par le navigateur, et l'exception empechait d'attraper le de. Capture rendue optionnelle, mouvements ecoutes sur la fenetre. `components/login/Login.tsx`, l'ancien ecran de pseudo, supprime faute d'appelant.
- Verifie dans le navigateur : placement exact sur l'emplacement, lancer automatique, lancer a la main avec rebond et ralentissement, aucune erreur console. Retour observe en cours de trajet ; l'arrivee n'a pas pu etre mesuree, le panneau du navigateur masque gelant l'animation.


## 2026-09-09 (suite 5) — Fin du double systeme d'identite

- `useProfile` lit desormais le compte Clerk et les preferences en base au lieu du `localStorage`. L'interface renvoyee est inchangee, si bien que les composants qui l'utilisent n'ont pas eu a bouger — un seul fichier a change pour basculer toute l'application.
- Nouvelles routes `/api/me` : lecture du profil, et modification du pseudo et de la couleur avec validation. Ces deux champs vivaient dans le navigateur, ou chacun pouvait se renommer, y compris en empruntant le nom d'un autre joueur.
- L'ecran de saisie de pseudo est remplace par un panneau de connexion (`SignedOutPanel`) qui propose creer un compte, se connecter, ou visiter sans compte. `/menu` n'a plus de contenu propre et renvoie vers l'accueil.
- La bascule « mode MJ » disparait : c'etait une case a cocher qui donnait les outils du MJ a n'importe qui. Le role decoule maintenant du compte, et decoulera de la table dont on est createur.
- Verifie dans le navigateur, sans compte : panneau de connexion affiche, aucune erreur console, `/api/me` renvoie `user: null` et refuse toute modification.

Reste ouvert : `isMJ` vaut aujourd'hui « est administrateur » ; le role de MJ par table reste a brancher sur `room_members.role`. Le visiteur peut encore sauvegarder une fiche dans le cloud.


## 2026-09-09 (suite 4) — Entree visiteur et correction du chargement des fiches

- Bouton « Visiter sans compte » sur l'ecran d'accueil, menant directement a la salle de demonstration, et bandeau dans la salle rappelant que rien n'y est conserve.
- Creer une table exige desormais un compte : sans cela la table serait invisible a son propre createur, puisque la liste passe par l'appartenance.
- **Bug de fond corrige** : une fiche chargee depuis le serveur etait recuperee puis jetee. L'effet de chargement s'annulait lui-meme quand le profil arrivait apres le montage, et le garde anti-double-appel empechait toute reprise. La fiche etait bien ecrite en cache local mais jamais affichee — un joueur retrouvait une fiche vide en entrant dans une salle. Trouve en testant le parcours visiteur, pas par lecture de code.
- Verifie de bout en bout dans le navigateur : un visiteur sans compte arrive dans la salle et voit la fiche complete, niveau 5, competences et modificateurs compris.


## 2026-09-09 (suite 3) — Salle de demonstration

- Cinq salles supprimees a la demande. `cakroom` conservee et adoptee comme salle de demonstration : proprietaire, drapeau `isDemo`, code d'invitation `5F3FCQ`. Choix verifie avant suppression en inspectant le contenu de chaque salle plutot qu'en se fiant au nom.
- Fiche « Cake » installee, volontairement exhaustive : caracteristiques, quatre competences, sept objets, description complete et cinq champs personnalises — pour qu'un visiteur voie d'un coup tout ce qu'une fiche peut contenir.
- Restauration automatique : un instantane de la salle sert d'etat de reference, et la salle y est ramenee quand un visiteur arrive alors qu'elle est vide. Declenchee a l'entree plutot que sur minuterie — c'est le seul moment ou l'on sait qu'un visiteur arrive, et restaurer une salle occupee effacerait le travail de ceux qui y sont. Tache quotidienne Vercel en filet de securite.
- Verifie en conditions reelles : salle videe entierement (0 image, 0 trait, 0 fiche), un visiteur entre, tout revient — 2 images, 364 traits, fiche complete.

Reste ouvert : le bouton « Visiter sans compte » n'existe pas encore, la salle de demonstration n'est donc pas atteignable sans son code. Menu toujours accessible sans etre connecte.


## 2026-09-09 (suite 2) — Fin de l'annuaire public, invitation par code

- Une table ne se voit plus que si on en est membre. `/api/rooms/list` renvoie une liste vide a un visiteur, les tables du joueur s'il est connecte, et tout a un administrateur pour la moderation. Il n'y a plus aucune table publique : c'est le fonctionnement voulu, on invite les gens qu'on veut.
- Ajout d'un code d'invitation par table (`rooms.joinCode`, six caracteres sans 0/O ni 1/I/L), affiche au MJ seul et copiable d'un clic. Nouvelle route `/api/rooms/join`, limitee en debit — un code court se devine sinon par force brute.
- Corrige le bouton « Entrer <nom> » qui proposait une table fantome : le menu affichait la derniere table memorisee dans le navigateur sans verifier qu'elle existait encore cote serveur.
- Compte `CakeSama` passe administrateur en base.

Reste ouvert : les six tables existantes sont anterieures a la base, donc sans proprietaire ni code — seul l'administrateur les voit. Le menu reste accessible sans etre connecte. Fiches de personnage pas encore rattachees au compte.


## 2026-09-09 (suite) — Identite serveur branchee sur Clerk

- Schema cree sur Neon (`users`, `rooms`, `room_members`, `characters`) et synchronisation paresseuse du compte Clerk a la premiere visite (`lib/db/users.ts`) — pas de webhook, qui exigerait une URL publique donc impossible en local.
- `/api/liveblocks-auth` emet desormais l'identifiant Clerk au lieu d'un `randomUUID()`, et pose pseudo et couleur **cote serveur** : un joueur ne peut plus se faire passer pour un autre en modifiant son `localStorage`.
- Propriete des tables rattachee au compte (`rooms.ownerId`), avec le secret navigateur conserve en secours pour les tables creees sans compte. L'acces admin accepte maintenant un role sur le compte en plus du mot de passe.
- Verifie sans compte connecte : liste, creation, suppression et connexion Liveblocks fonctionnent comme avant. La base reste vide tant que personne ne s'inscrit, ce qui est le comportement attendu.

Reste ouvert : le chemin connecte n'est pas encore teste faute de compte cree. Le pseudo local cohabite toujours avec Clerk. Bouton visiteur et room de demonstration pas commences.


## 2026-09-09 — Phase 1 : Clerk cable, base Neon creee

- Base Neon creee (region Francfort) et connexions ecrites dans `.env.local` ; Clerk installe depuis la Marketplace Vercel, instance de developpement `decent-roughy-8486`.
- Cablage : `proxy.ts` (Next 16 a renomme `middleware.ts`), `ClerkProvider` place dans `<body>` et non autour de `<html>`, `components/auth/AuthControls.tsx` monte dans le menu. CSP elargie aux origines Clerk, sans quoi rien ne se chargeait.
- React monte de 19.1.0 a 19.2.8 : Clerk 7 exige au moins 19.1.4, l'installation echouait sinon. Build et tests verts apres la montee.
- Deux erreurs trouvees seulement en testant dans le navigateur, ni le build ni TypeScript ne les voyaient : `<SignedIn>`/`<SignedOut>` n'existent plus dans Clerk 7 (remplaces par `<Show when=...>`), et la CSP bloquait les scripts Clerk.

Reste ouvert : la fenetre d'inscription ne s'ouvre pas encore — aucune methode de connexion n'est activee dans le tableau de bord Clerk. Schema de base de donnees pas encore ecrit.


## 2026-09-06 — Clerk retenu pour l'authentification, mode visiteur adopte

- Authentification : Clerk via la Marketplace Vercel plutot qu'Auth.js. Verifie avant de recommander : en developpement Clerk fournit ses propres identifiants OAuth partages, donc Discord et Google s'activent sans creer la moindre application ; en production il faut les siennes. Gratuit jusqu'a 50 000 utilisateurs par mois. Clerk ne remplace pas la base : Neon reste necessaire pour les tables, les membres et les fiches.
- Revirement assume sur le mode invite. Je le deconseillais parce qu'une identite invitee duplique tous les chemins de propriete ; la formulation retenue l'evite entierement — une room de demonstration pre-remplie, ou le visiteur ne possede rien, ne sauvegarde rien, et qui se reinitialise toute seule. L'objection ne s'appliquait pas a cette forme-la.
- Point de vigilance note pour la mise en ligne : les comptes crees sur l'instance de developpement Clerk (locale et preproduction) ne sont pas transferes vers la production, et celle-ci exige les identifiants OAuth Discord et Google — a faire avant le premier deploiement sur `main`, pas apres.


## 2026-09-05 — Phase 0 commitee et credit QG ajoute

- Phase 0 commitee (`04f0425`, 36 fichiers) : verrouillage des routes, scrypt, en-tetes de securite, ESLint repare, CI. Inclut le panel admin et la propriete des rooms, jusqu'ici non commites.
- Credit QG Informatique ajoute (`components/ui/CreditQG.tsx`, monte dans `ClientLayout`) : il manquait alors que la regle commune l'impose sur toute interface visible. Rendu en footer fixe, discret, sans intercepter les clics au-dessus du jeu.
- Verification dans le navigateur, pas seulement en curl : la CSP ne bloque rien (zero erreur console dans une room), et la chaine `liveblocks-auth` puis `rooms/verify` puis `roomstorage` avec jeton repond 200 depuis le vrai client. Constate au passage : afficher le menu declenche 12 connexions Liveblocks, une par carte de room — a corriger en phase 4.


## 2026-09-02 — Phase 0 : verrouillage des routes ouvertes

- Toutes les routes de donnees passent derriere un controle : `/api/roomstorage` et `/api/liveblocks-auth` exigent un jeton d'acces a la room (nouveau `lib/roomAuth.ts`, emis desormais pour les rooms ouvertes aussi), `/api/blob` impose un espace de noms et un type, `/api/cloudinary*` sont limites en debit et n'acceptent plus le SVG. `/api/blop/delete`, qui supprimait n'importe quel fichier sans controle et n'avait plus d'appelant, est supprimee.
- Mots de passe de room passes de SHA-256 nu a scrypt sale, avec migration a la premiere connexion reussie ; brute force limite a 8 essais par quart d'heure. Correction au passage d'un contournement : `liveblocks-auth` ne testait qu'un drapeau et laissait entrer sans mot de passe sur les rooms creees avant son introduction — le predicat est desormais partage.
- Chaine qualite remise en marche : `FlatCompat` supprime au profit du flat config natif (le linter ne demarrait plus depuis Next 16), `npm run lint` vert (0 erreur, 90 avertissements), 0 vulnerabilite npm apres montee de `@vercel/blob` en v2, en-tetes de securite dans `next.config.ts`, et une CI GitHub Actions qui rejoue typecheck + lint + audit + build.


## 2026-08-21 — Audit complet + panel admin avec ownership des rooms

- Audit technique complet (archi, securite, perf, a11y, dette) : bug bloquant trouve (rooms a mot de passe inaccessibles, le token n'etait jamais memorise) et confirmation par lecture de code que la plupart des routes API n'ont aucune authentification (`/api/rooms` DELETE/PATCH, `/api/roomstorage`, `/api/blob`).
- Implemente un acces admin (cookie HMAC signe httpOnly, rate-limit sur le login) avec panel `/admin` (lister/filtrer/supprimer en masse/renommer/retirer un mot de passe), et un systeme de propriete de room (secret genere a la creation, verifie sur DELETE/PATCH `/api/rooms`) ; corrige au passage le bug des rooms a mot de passe et supprime le stockage du mot de passe en clair en localStorage.
- Verifie de bout en bout (`npm run build`, `tsc --noEmit`, tests curl : login, rate-limit 429, delete refuse sans secret / accepte avec le bon) — non commite, `ADMIN_PASSWORD` encore au placeholder dans `.env.local`.
- Projet migre de `F:\DEV\CakeJDR` vers `C:\DEV\CakeJDR` (passage sur SSD) : `npm install` refait, build verifie depuis le nouvel emplacement, chemins `F:\DEV` corriges dans les deux `CLAUDE.md`.
- Nettoyage du depot avant les gros chantiers (commit `2bae680`, pousse) : la distribution Node.js v20 committee par erreur dans `tmp/` retiree du suivi git (1962 fichiers, 302 517 lignes, 97 Mo), `tmp/` ajoute au `.gitignore`, et `generate_app_summary_pdf.ps1` sauve dans `scripts/` avec son chemin de sortie corrige.

<!-- Les entrees sont ajoutees en haut de ce fichier par la commande /fin
     de Claude Code. Format lu par le script de recap, a ne pas modifier :

     ## AAAA-MM-JJ - Titre court de ce qui a ete fait

     Tu peux aussi ecrire une entree a la main en respectant ce format. -->

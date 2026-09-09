# Journal

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

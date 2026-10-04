# Plan — campagnes, bibliothèque du MJ, systèmes de jeu

But : qu'un MJ mène toute une partie sur le site, la voix mise à part. D'abord avec une campagne toute prête, ensuite avec ses propres règles et sa propre campagne.

Les phases suivent la refonte d'octobre 2026 (phases A à F, `PLAN-REFONTE.md`). Chaque phase se livre et se teste seule.

## Démo solo — le MJ automatique (priorité après ce qui est en attente)

But : un visiteur seul découvre CakeJDR en jouant une vraie petite partie, sans MJ et sans ami, et voit aussi l'envers du décor côté MJ. C'est la vitrine du site : elle doit être la plus propre possible.

- **Une partie à soi** : chaque visiteur a sa propre partie de démo. Il ne la partage pas avec les autres visiteurs et ne peut rien y abîmer.
- **La petite aventure de Cake** (10 à 15 minutes), avec le set « Cake » du pack n° 2 :
  - Mila appelle à l'aide ;
  - la pâtisserie ;
  - la cave et les levains affamés ;
  - le Golem de Mie Brûlée ;
  - une fin qui dépend des choix du joueur.
- **Le MJ automatique** mène la partie tout seul, en suivant un scénario écrit à l'avance (fiable, gratuit et toujours pareil, sans IA). Il :
  - raconte la scène ;
  - pose la carte et les pions ;
  - lance la musique ;
  - montre les rencontres ;
  - demande un jet (« Lance un D20 pour enfoncer la porte »), lit le résultat et enchaîne : réussite d'un côté, échec de l'autre ;
  - pose des questions avec des boutons de réponse (« Tu fouilles la cave ? Tu appelles Mila ? ») et passe à la scène qui correspond.
- **Le joueur** a un personnage prêt à jouer, sa fiche, ses PV qui bougent, ses dés. Il fait les jets et choisit les réponses.
- **« Voir côté MJ »** : un bouton bascule à tout moment vers ce que voit le MJ :
  - le carnet de campagne et la scène en cours avec ses secrets ;
  - les choix possibles et la suite selon chaque choix ;
  - la bibliothèque et le panneau du MJ.
  Le visiteur comprend ainsi ce qu'un vrai MJ aurait sous la main. Il revient au côté joueur d'un clic.
- **Fin de la démo** : un résumé du chemin parcouru, puis « Crée ta table » et « Rejoue en faisant d'autres choix ».
- La démo est la première aventure écrite dans le format de la phase H. Elle en pose donc la base : scènes, choix, mise en place, carnet du MJ, journal des joueurs.
- À choisir au moment de s'y mettre : une salle Liveblocks à part par visiteur (coût et nettoyage à vérifier), ou une démo qui tourne entièrement dans le navigateur, sans temps réel.

Plus tard, le même MJ automatique sert aux campagnes toutes prêtes : à la création d'une table, choisir « avec MJ » ou « MJ automatique » (voir phase H).

## Phase G — la bibliothèque devient l'outil du MJ

- Seul le MJ ouvre la bibliothèque. Un joueur ne voit que le pion de son personnage, qu'il pose ou retire lui-même.
- Le pion du personnage se choisit dans la fiche, comme le portrait (le portrait propose son pion assorti).
- Recherche par nom, et filtres : type (carte, pion, ennemi, rencontre), faction (gobelins, culte, morts-vivants…), acte, rôle (troupe, élite, boss, allié, PNJ).
- Paires rencontre ↔ pion : sur une rencontre, un bouton « Poser le pion » met l'ennemi ou l'allié sur le plateau.
- Rencontre montrée aux joueurs : le MJ la « montre », elle s'affiche en grand chez tout le monde, puis se ferme.
- Le pack n° 2 est intégré avec ces étiquettes.
- Protection côté serveur : un joueur ne peut ni ouvrir la bibliothèque ni poser une autre image en bidouillant son navigateur (permissions Liveblocks par rôle).

## Phase H — une campagne toute prête, jouable de bout en bout

**Format d'une campagne**, écrit d'abord en fichiers dans le projet, sans toucher à la base. C'est une suite de scènes reliées entre elles. Chaque scène a :

- le **déroulé du MJ** : ce qui se passe, les secrets, les jets à demander, les réactions des PNJ ;
- la **part des joueurs** : ce qu'ils savent ou découvrent (texte court, indices, image) ;
- sa **mise en place** : carte de fond, pions à poser, rencontres prêtes, musique proposée ;
- ses **sorties** : des boutons de choix (« Ils attaquent le camp », « Ils négocient », « Ils contournent ») qui mènent chacun à une scène. Une sortie peut ajouter une rencontre ou en sauter une.

**Pour le MJ, un « carnet de campagne »** dans la salle :

- la scène en cours, avec son déroulé ;
- « Préparer la scène » : la carte, les pions et la musique se mettent en place d'un clic ;
- les boutons de choix : le MJ valide ce qu'ont fait les joueurs, la campagne passe à la scène suivante ;
- le chemin déjà parcouru, et la possibilité de revenir en arrière ou d'aller à n'importe quelle scène.

**Pour les joueurs, un « journal »** : le résumé de l'aventure et les indices, révélés au fil de la partie par le MJ (bouton « Révéler » sur chaque indice). Les joueurs ne voient jamais le déroulé du MJ.

La progression est gardée dans la table. On peut arrêter et reprendre à la séance suivante.

**Écrire la campagne du dragon**, celle du pack n° 2 : trois actes et un final, avec des choix qui ouvrent des pistes. Claude écrit, Quentin relit et valide.

**Lancer une campagne** : à la création d'une table, choisir « Partie libre » ou une campagne toute prête. Pour une campagne toute prête, choisir aussi « avec MJ » ou « MJ automatique » (le moteur de la démo solo).

## Phase I — les systèmes de jeu (presets)

- La fiche de personnage devient la description d'un **système**, et plus du code figé :
  - caractéristiques ;
  - valeurs calculées (défense, modificateurs…) ;
  - ressources (PV, mana…) ;
  - types de compétences ;
  - dés utilisés ;
  - montée de niveau.
- **Preset de base : « Narratif CakeJDR »**, la fiche d'aujourd'hui, à l'identique. Les fiches existantes y sont rattachées sans rien perdre.
- **Deux ou trois autres presets** pour d'autres styles, à choisir ensemble. Par exemple :
  - un jeu tactique au d20 ;
  - un jeu d'enquête au d100 ;
  - un jeu ultra-léger à trois caractéristiques.
  - Avant de reprendre des règles existantes, vérifier leur licence, et seulement celle-ci.
- Le système se choisit à la création de la table. Les fiches et les dés s'y adaptent.
- Les fiches restent stockées comme aujourd'hui (champ `data` en JSON). Le choix du système par table demande d'ajouter une colonne en base, **avec l'accord de Quentin**.

## Phase J — les créateurs : son propre système, sa propre campagne

- **Créateur de système** : partir d'un preset, puis ajouter, retirer ou renommer des champs de fiche, des ressources, des dés, avec un aperçu de la fiche en direct.
- **Créateur de campagne** : les scènes en cartes reliées par des flèches. Chaque scène a :
  - son déroulé MJ et sa part des joueurs ;
  - ses images, venant de la bibliothèque ou envoyées par le MJ ;
  - ses boutons de choix vers les scènes suivantes.
- Systèmes et campagnes sont rangés dans le compte du MJ et réutilisables d'une table à l'autre. Cela demande de nouvelles tables en base, **avec l'accord de Quentin**.
- Plus tard : exporter et importer une campagne en fichier, puis partager ses campagnes avec d'autres MJ.

## Ordre proposé (revu le 2026-10-04)

1. Finir ce qui est en attente sur la refonte :
   - intégrer le pack n° 2 ;
   - faire les vérifications import/export, Cloudinary et compte joueur ;
   - protéger côté serveur les réglages du MJ ;
   - faire relire l'interface par Quentin.
2. Démo solo avec le MJ automatique, à soigner en priorité : c'est la vitrine.
3. Phase G : indispensable avant d'ouvrir au public, sinon chaque joueur voit tous les boss.
4. Mise en ligne publique 1.0.
5. Phase H avec la campagne du dragon, jouable avec ou sans MJ : version 1.1.
6. Phase I : version 1.2.
7. Phase J : version 2.0.

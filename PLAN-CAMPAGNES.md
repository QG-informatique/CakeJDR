# Plan — campagnes, bibliothèque du MJ, systèmes de jeu

But : qu'un MJ mène toute une partie sur le site, la voix mise à part. D'abord avec une campagne toute prête, ensuite avec ses propres règles et sa propre campagne.

Les phases suivent la refonte d'octobre 2026 (phases A à F, `PLAN-REFONTE.md`). Chaque phase se livre et se teste seule.

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

**Lancer une campagne** : à la création d'une table, choisir « Partie libre » ou une campagne toute prête.

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

## Ordre proposé

1. Intégrer le pack n° 2 et refaire la salle de démo (en cours).
2. Phase G : indispensable avant d'ouvrir au public, sinon chaque joueur voit tous les boss.
3. Mise en ligne publique 1.0.
4. Phase H, campagne du dragon comprise : version 1.1.
5. Phase I : version 1.2.
6. Phase J : version 2.0.

# Plan de refonte — octobre 2026

Demandé par Quentin le 4 octobre 2026, après avoir testé le site en ligne. Six phases, dans
l'ordre. Chacune est livrable seule : vérifiée, committée, notée au journal, puis mise en
ligne quand Quentin dit « mets en ligne ».

Les choix marqués **(par défaut)** sont appliqués sauf avis contraire de Quentin.

---

## Phase A — Thèmes, adresses et rôle de MJ

1. **Deux thèmes seulement.**
   - Ardoise : fond fixe, sans animation.
   - Classique : les dés roses qui montent (`RpgBackground`), toujours.
2. **Les neuf autres fonds animés sont retirés du site.** Ils sont rangés dans
   `C:\DEV\CakeJDR-themes\fonds-archives\` pour pouvoir les reprendre plus tard. Il ne reste
   plus de bouton qui change le fond : c'est ce bouton qui mettait des fonds de Classique
   dans Ardoise.
3. **Nouvelles adresses.**
   - `/` est la page d'arrivée, avec la connexion. Un joueur déjà connecté passe directement
     aux salles.
   - `/salles` est la page des salles et des fiches.
   - Les anciennes adresses `/menu` et `/menu-accueil` renvoient vers `/salles`.
4. **Plus de passage par l'écran de connexion** en revenant d'une table. Pendant la lecture
   du compte, une petite attente s'affiche à la place.
5. **Le bouton gâteau de la table devient un bouton clair « ← Salles ».**
6. **Rôle de MJ.**
   - On est MJ d'une salle parce qu'on l'a créée, et uniquement pour cette salle.
   - L'indicateur couronne du menu est supprimé.
   - Les restes de l'ancien réglage « je suis MJ » sont nettoyés.

## Phase B — Créer et modifier une fiche : un seul écran

Un seul écran sert à créer et à modifier une fiche, depuis la page des salles comme depuis
la table. Il remplace l'ancienne fenêtre, où les éléments se chevauchaient.

- **Colonne de gauche :** le portrait (une case vide au départ), puis nom, race, classe,
  niveau, sexe, âge, taille et poids.
- **Sections à droite**, dans des onglets ou empilées sur téléphone :
  - Caractéristiques ;
  - Combat : PV, défense, initiative, modificateurs ;
  - Compétences : liste qui défile, avec ajouter, modifier et supprimer, sans chevauchement ;
  - Équipement et bourse ;
  - Histoire : traits, idéal, failles, background, notes.
- Chaque zone qui peut s'allonger a sa propre barre de défilement.
- Les boutons « Enregistrer » et « Annuler » restent toujours visibles en bas de l'écran.
- **Import, export et cloud** restent sur la page des salles. Leur fonctionnement est vérifié
  pendant cette phase.

## Phase C — La fiche pendant la partie

1. **En-tête de la fiche :**
   - le portrait, ou une case vide « Choisir une image » ;
   - le nom, la classe et le niveau ;
   - le bouton « Modifier », directement sur la fiche.
2. **Barre de PV.**
3. **Onglets** Statistiques, Équipement et Description.
4. **Deux affichages :**
   - compact : l'essentiel sur une ligne par élément ;
   - complet : tout le détail.

   Le choix est gardé dans le navigateur.
5. **Choix du portrait :** un clic sur la case ouvre la bibliothèque des portraits sur le côté
   gauche, avec la possibilité d'envoyer sa propre image. Le portrait est enregistré dans la
   fiche.
6. **Retirés de la fiche :**
   - le sélecteur « personnage actif », qui passe dans le panneau du MJ (phase F) ;
   - le menu import, export et sauvegarde.

## Phase D — La bibliothèque remplace l'outil Images

1. **Catégories :**
   - Cartes et lieux ;
   - Pions alliés ;
   - Pions ennemis ;
   - Rencontres (PNJ, alliés ou ennemis).

   Les portraits quittent le plateau : ils servent seulement à la fiche (phase C).
2. **Un bouton « + » par catégorie** pour envoyer sa propre image. Elle reste dans la salle,
   pour tous ses joueurs **(par défaut)**.
3. **Cartes et lieux.**
   - Un clic sur une carte la met en fond, sur toute la surface du plateau.
   - Un clic sur une autre carte la remplace.
   - Un nouveau clic sur la carte active l'enlève.
   - Une carte n'est ni déplaçable ni redimensionnable, et n'a pas de croix de suppression
     sur le plateau.
4. **Pions et rencontres.**
   - Un clic pose l'image sur le plateau ; un nouveau clic l'enlève.
   - Une image posée est déplaçable et redimensionnable, sans croix de suppression.
   - Les images posées sont surlignées dans la bibliothèque.
5. **Suppression.**
   - Enlever une image du plateau ne l'efface jamais.
   - Le bouton « Supprimer » de la bibliothèque n'apparaît que sur les images qu'on a
     envoyées soi-même. Le MJ peut supprimer toutes les images de sa salle.
   - Une image supprimée est effacée chez Cloudinary.
6. **L'onglet « Outils » devient « Dessin »** : crayon, gomme, couleurs, taille et « Tout
   effacer ». Le mode Images disparaît.
7. **Tables existantes :** les images déjà posées restent affichées. Elles se retirent depuis
   un groupe « Anciennes images » de la bibliothèque.

## Phase E — Barre du bas : dés, musique, joueurs

1. **Dés.** Une rangée D4 à D100 propre, avec le bouton « Lancer » bien visible.
2. **Musique.**
   - Affichage simple : bouton lecture/pause, titre du morceau et volume.
   - Un bouton « ⋯ » ouvre les options : lien YouTube, file d'attente, réglages.
3. **Joueurs en ligne**, à droite, en ronds avec leur initiale, y compris soi-même. Le nom
   apparaît au survol, et le MJ est signalé.

## Phase F — Panneau du MJ (pour sa salle uniquement)

Ce panneau est visible seulement par le créateur de la salle.

1. **Joueurs connectés en temps réel**, avec leur personnage. Le MJ peut ouvrir la fiche
   d'un joueur et la modifier : PV, points de niveau, équipement. Le joueur voit la
   modification tout de suite.
2. **Réglage « Qui modifie les fiches ? »** : chaque joueur la sienne **(par défaut)**, ou
   seulement le MJ.
3. **Réglage « Qui peut dessiner ? »** : tout le monde **(par défaut)**, seulement le MJ, ou
   au choix joueur par joueur.
4. **Limite à connaître :** ces réglages bloquent dans l'interface, ce qui convient pour une
   table entre amis. Un joueur qui bidouille son navigateur pourrait les contourner. Une
   protection complète, côté serveur, viendrait plus tard si le besoin se présente.

---

## Hors plan, déjà noté dans TODO.md

- Images de nouveaux monstres et PNJ, à dessiner par Quentin.
- 16 avertissements d'accessibilité.
- Thèmes Papier & Sauge et V2, prévus après cette refonte.

# Plan de test manuel

Parcours à suivre avant chaque mise en ligne, tant que les tests automatisés ne
les couvrent pas. Il faut **deux comptes** (par exemple un compte Google et un
compte Discord) et, si possible, une tablette ou un téléphone.

## Préparation
1. Lancer l'application (`npm run dev`), ou utiliser l'adresse de prévisualisation Vercel.
2. Ouvrir trois fenêtres :
   1. **Compte A** — celui qui crée la table, et qui en sera donc le MJ
   2. **Compte B** — dans une fenêtre de navigation privée
   3. **Sans compte** — pour le parcours visiteur
3. Vérifier que `.env.local` contient les clés Liveblocks, Cloudinary, Neon (`DATABASE_URL`), `AUTH_SECRET` et les identifiants Google et Discord.

## Accueil et compte
1. Déconnecté : le panneau d'accueil propose de continuer avec Discord ou Google, et de visiter en invité. Le dé roule tout seul ; on peut l'attraper, le lancer, et il revient à sa place.
2. Le bouton de langue bascule toute la page entre FR et EN, et le choix survit à un rechargement.
3. Se connecter avec le compte A (Google ou Discord) : le menu s'affiche, l'avatar apparaît en haut à droite à côté du bouton de langue, sans chevauchement.
4. Changer la couleur du profil, recharger : elle est conservée. Se connecter depuis un autre navigateur : même couleur, puisqu'elle est enregistrée sur le compte.
5. Se déconnecter avec le bouton Déconnexion du menu : retour au panneau d'accueil.
6. Annuler la connexion chez Google ou Discord : retour sur `/connexion` avec un message d'erreur, sans page blanche.

## Visiteur et salle de démonstration
1. Sans compte, cliquer sur « Visiter en invité » : la salle de démonstration s'ouvre avec son bandeau, la fiche « Cake » complète, les images et le dessin.
2. Dessiner, déplacer une image, modifier la fiche, puis quitter.
3. Revenir en invité quand la salle est vide : tout est revenu à l'état d'origine.
4. Dans la salle, le menu import/export ne propose aucune action cloud.

## Tables et invitations
1. Le compte A crée une table : elle apparaît dans sa liste, avec un code d'invitation.
2. Le compte B ne voit pas cette table dans sa liste.
3. Le compte B ouvre directement l'adresse de la table, copiée depuis A : l'écran « Accès refusé » s'affiche et lui dit de demander le code.
4. Le compte B saisit le code d'invitation sur l'accueil : la table apparaît, et il peut y entrer.
5. Un mauvais code est refusé proprement.
6. Le compte A ouvre son menu depuis un autre navigateur : les boutons pour renommer et supprimer sa table sont bien là.
7. Le compte A renomme puis supprime la table ; le compte B ne peut faire ni l'un ni l'autre.

## Rôle de MJ
1. Dans la table, les messages de A (le créateur) portent la couronne, ceux de B non.
2. Seul A voit le sélecteur de fiches du MJ.
3. Dans le menu, l'indicateur de MJ s'allume quand la table sélectionnée est une table dont on est MJ.

## Fiches de personnage
1. Le compte A crée, modifie, sélectionne et supprime une fiche dans le menu.
2. Se connecter avec A depuis un autre navigateur : les mêmes fiches sont là.
3. Modifier sa fiche en jeu, revenir au menu, recharger : la modification est conservée.
4. Fenêtre « Cloud » : enregistrer une fiche, la retrouver dans la liste, l'importer, la supprimer.
5. Exporter puis réimporter une fiche en fichier : rien n'est perdu.
6. Après être passé dans une table, les fiches des autres joueurs n'apparaissent pas sur son compte depuis un autre navigateur.

## Temps réel
1. Messages de chat envoyés depuis A et B : même ordre chez tout le monde.
2. Lancers de dés depuis les deux : la fenêtre de résultat apparaît, l'historique et les statistiques se synchronisent.
3. Dessiner à deux en même temps : les traits restent synchronisés.
4. Envoyer une image : elle apparaît chez l'autre.
5. Musique YouTube : lecture, file d'attente et volume restent cohérents après un rechargement.
6. Ouvrir et fermer plusieurs fois le chat, les statistiques, le résumé et les notes : les panneaux restent cohérents.
7. Présence : les avatars apparaissent et disparaissent quand on entre et qu'on sort.

## Robustesse et affichage
1. Couper le réseau d'une fenêtre puis le rétablir : le chat, la fiche et la table reviennent.
2. Recharger en pleine partie : on revient dans la même table sans avoir à la resélectionner.
3. Tablette ou téléphone, en portrait puis en paysage : aucune action indispensable n'est cachée. L'affichage mobile n'a pas encore été retravaillé : noter ce qui gêne.

## Panel d'administration
1. Connecté avec le compte administrateur, `/admin` liste toutes les tables et permet de les renommer et de les supprimer.

## Critères de mise en ligne
- Aucune erreur bloquante dans la console ni dans les réponses de l'application.
- Aucune perte de données en passant du menu à une table, en rechargeant ou en se reconnectant.
- Aucun secret ni mot de passe visible dans les réponses du serveur.
- Tout problème restant est noté dans `TODO.md` comme non bloquant avant de publier.

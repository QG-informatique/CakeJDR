# Plan de tests manuels

Scénario de vérification pour une session complète avec un **MJ**, deux **joueurs** sur ordinateurs et une **tablette** (portrait et paysage).

## Préparation
1. Démarrer l'application avec `NEXT_PUBLIC_DEBUG=1` pour voir les logs.
2. Ouvrir trois navigateurs (MJ + 2 joueurs) sur ordinateur et un quatrième sur tablette.
3. Depuis la page menu, créer une nouvelle room depuis le compte MJ et noter son lien.
4. Les joueurs et la tablette rejoignent la room via ce lien.

## Cycle menu ↔ room
1. Chaque participant retourne au menu puis revient dans la room deux fois.
2. Vérifier qu'aucun état (personnage, chat, jets) n'est perdu après chaque aller‑retour.

## Chat et jets de dés
1. MJ et joueurs envoient plusieurs messages de chat et effectuent des jets de dés.
2. Confirmer que l'ordre chronologique est identique pour tous et que les timestamps sont cohérents.
3. Activer/désactiver les panneaux (chat, stats, résumé) et vérifier qu'ils se ré-ouvrent correctement.

## Tablette
1. Sur tablette, tester les modes **portrait** et **paysage** : rotation de l'écran et vérification de la mise en page.
2. Réaliser les mêmes actions de chat et de jets ; l'ordre et l'état doivent rester corrects.

## Resize et reconnexions
1. Redimensionner la fenêtre des navigateurs (ordinateurs) à plusieurs tailles. Aucune perte d'état.
2. Déconnecter la connexion réseau d'un joueur puis la rétablir. Le joueur doit retrouver la room et l'historique sans incohérence.

## Résultats attendus
- Les logs utiles apparaissent uniquement lorsque `NEXT_PUBLIC_DEBUG=1`.
- Aucun ordre incohérent ni perte d'état durant tous les scénarios.

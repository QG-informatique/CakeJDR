TODO (prochaines itérations)

Bloquants / Build
- Vérifier le build Next 15/React 19 avec TypeScript et ESLint après installation locale (npm indisponible ici). Corriger tout warning critique d’hydratation si présent.
- Mettre à jour l’endpoint `/api/cloudinary` pour définir par défaut le preset « CakeJDR-DU6-image » (si variable d’env absente). Note: patch côté serveur à appliquer localement si nécessaire.

Rooms / Auth
- Ajouter un petit loader « jeu vidéo » lors de la vérification du mot de passe (RoomList/RoomsPage montrent déjà un indicateur minimal; possibilité d’améliorer via framer-motion + progress bar).
- Option: hashing du mot de passe côté serveur (metadata.passwordHash) et suppression totale de `password` clair.

Canvas & Temps réel
- Éventuel throttling des segments de trait pour réduire le trafic Liveblocks lors de dessins rapides (coalescer via requestAnimationFrame).
- Déplacer l’aperçu d’image en pending sur un calque dédié et ajouter un indicateur de progression.

Personnages / Cloud
- Ajouter confirmation et gestion des erreurs détaillées pour suppression cloud (route `/api/blop/delete` vs `/api/blob` à unifier).
- Ajouter un bouton « Cloud » principal avec modal centralisée (listing/pagination Blob si la liste dépasse 100 items).

Dés 3D
- Implémenter une file d’attente par joueur (limiter à 1 lancer actif/joueur) au-delà du simple cooldown local.
- Ajouter version cube simulé D20/D6/D4/D100 avec orientation finale selon le résultat et « ? » pendant l’animation.

Musique YouTube
- Synchroniser proprement le `playing` post-initialisation, tout en évitant toute reprise automatique au premier chargement par utilisateur.
- Mémoriser une préférence utilisateur locale par room (volume initial appliqué une seule fois).

Session Summary / Lexical
- Vérifier le provider Liveblocks/Lexical sur plusieurs rooms et éviter toute seconde RoomProvider cachée.
- Option: persistance BLOB debouncée (60–120s) pour snapshots de session (aucune auto-save inutile toutes 10min).

Qualité / Tooling
- Ajouter tests e2e Playwright (smoke): rendu des pages, join room, upload image, lancer de dé, import/export personnage.
- Nettoyage types résiduels `any` si possible sans rigidifier les structures Lson.


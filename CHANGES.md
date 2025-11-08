CakeJDR – Correctifs et améliorations (lot 1)

Date: 2025-11-08

Résumé
- Rooms Liveblocks: sécurisation de l’API liste (plus d’exposition de mots de passe), idempotence conservée côté serveur, unification de la vérification de mot de passe côté client.
- Upload Cloudinary: alignement sur le preset « CakeJDR-DU6-image » côté client; serveur prêt pour env CLOUDINARY_UPLOAD_PRESET.
- YouTube musique: volume initial réel à 5% au premier démarrage, pas de reprise automatique après reload; synchronisation conservée après initialisation.
- Divers: nettoyage typings, petites sécurisations côté client.

Détails
- lib/liveRooms.ts
  - FIX: listRooms() n’expose plus le champ `password`; expose un booléen `hasPassword` calculé.
  - FIX: createRoom() marque `hasPassword: true` dans metadata quand un mot de passe est fourni.

- components/rooms/RoomList.tsx
  - FIX: type `RoomInfo` -> `hasPassword?: boolean` (au lieu de `password?: string`).
  - FIX: flux de join: vérification via `/api/rooms/verify` (avec mémorisation locale optionnelle), plus d’égalité naïve client-side.

- components/rooms/RoomSelector.tsx
  - FIX: même unification que RoomList: `hasPassword` + vérification via API.

- app/rooms/page.tsx
  - FIX: ajout de la protection `hasPassword` + champ de mot de passe contextuel et vérification serveur.

- components/canvas/InteractiveCanvas.tsx
  - FIX: volume initial à 5%; pas de reprise automatique après reload (forcer pause en `onReady`; ne synchroniser `isPlaying` qu’après la première init).
  - FIX: upload: preset client aligné « CakeJDR-DU6-image ».

- components/rooms/JoinAnnouncer.tsx
  - FIX: typing d’événement broadcast (cast sûr).

Notes Cloudinary
- L’endpoint `/api/cloudinary` attend `CLOUDINARY_UPLOAD_PRESET` (ou NEXT_PUBLIC_…) dans l’environnement. À défaut, ajuster la valeur à « CakeJDR-DU6-image » (cf. TODO.md) pour le serveur. Le client envoie déjà ce preset.

Compatibilité
- Aucune rupture d’API externe; le schéma de `GET /api/rooms/list` change uniquement côté client (utilisation de `hasPassword`).


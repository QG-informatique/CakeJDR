# CakeJDR

Table de jeu de rôle en ligne, gratuite, qui tourne dans le navigateur. Version 1.0.

En ligne : **https://cakejdr.qg-informatique.fr**

CakeJDR réunit au même endroit ce qu'il faut pour jouer à distance : un plateau
partagé, des dés 3D, les fiches de personnage, le chat, le récit de la partie et
la musique. Un MJ automatique peut aussi mener des aventures toutes prêtes quand
personne ne veut faire le MJ.

Le projet est 100 % gratuit : il n'utilise que des offres gratuites et des
ressources libres de droits. N'importe qui doit pouvoir le refaire à partir de
ce dépôt.

## Ce qu'on peut faire

**Sans compte**
- Essayer la démo : chaque visiteur reçoit sa propre partie, qu'il retrouve en
  revenant. Elle s'efface après une semaine sans visite.

**Avec un compte** (connexion Google ou Discord)
- Créer une table et inviter ses joueurs avec son code. Il n'y a pas d'annuaire
  public : sans le code, une table reste invisible. Le créateur est le MJ.
- Choisir le système de jeu de la table :
  - Narratif CakeJDR
  - Fantasy 5E (SRD 5.2, CC-BY-4.0)
  - Enquête d100 (BRP, ORC)
  - ou un système créé dans l'atelier
- Garder ses fiches de personnage et les réutiliser d'une table à l'autre.

**À la table**
- Plateau partagé :
  - dessin, images et pions
  - bibliothèque d'images libres (cartes, monstres, PNJ)
  - image de scène montrée en grand à tout le monde
- Dés 3D avec une vraie physique, et statistiques de chance de chaque joueur.
- Le MJ demande des jets ; les modificateurs sont calculés depuis la fiche.
- Fiches de personnage qui suivent le système de jeu : caractéristiques,
  ressources, attaques, sac, XP et niveaux.
- Chat, récit de la partie, journal des joueurs et carnet du MJ.
- Résumé de partie écrit à plusieurs en même temps.
- Musique synchronisée pour toute la table, sons d'interface et de combat, avec
  un réglage de volume par salle.

**MJ automatique**
- Aventures toutes prêtes (« La fournée maudite », « La Flamme sous la
  montagne »…), jouables sans MJ humain : scènes, votes du groupe, épreuves,
  combats au tour par tour, butin et montée de niveau.
- Héros tout prêts, ou création de héros guidée.
- Salon d'attente : la partie démarre quand tout le monde est prêt.

**Atelier du MJ** (`/atelier`)
- Créer ses propres systèmes de jeu et ses propres campagnes, puis les réutiliser
  d'une table à l'autre ou les partager par un lien.

**Interface**
- Quatre thèmes : Ardoise, Classique, Nocturne et Papier & Sauge (clair).
- En français et en anglais.

## Comment c'est construit

| Rôle | Outil |
| --- | --- |
| Site et serveur | Next.js 16, React 19, Tailwind CSS 4 |
| Temps réel (plateau, chat, dés, récit…) | Liveblocks, une salle Liveblocks par table |
| Comptes, tables, fiches, créations de l'atelier | Neon (PostgreSQL) avec Drizzle |
| Connexion | Auth.js, avec Google et Discord |
| Images envoyées par les joueurs | Cloudinary |
| Dés 3D | Dice Box (three.js) |
| Résumé co-édité | Lexical et Yjs |
| Hébergement et tâches de nuit | Vercel |

**Où vivent les données**
- **Base Neon** : tout ce qui doit durer.
  - les comptes
  - les tables et leurs membres
  - les fiches de personnage
  - les créations de l'atelier
- **Liveblocks** : l'état en direct de chaque table (plateau, messages, dés,
  récit, progression de l'aventure).
- **Cloudinary** : les images envoyées sur le plateau.

**Accès**
- Le serveur vérifie les droits de chaque salle avant de la donner à Liveblocks
  (`lib/db/roomAccess.ts`).
- Les jets de dés sont signés côté serveur (`app/api/dice`).

**Tâches de nuit** (`vercel.json`)
- `/api/demo/reset` remet la démo de référence à zéro.
- `/api/cron/cleanup-rooms` supprime les salles abandonnées et les copies de
  démo inactives, avec leurs images.

## Installer en local

Il faut Node.js 20 ou plus récent, et un compte gratuit sur chacun de ces
services : Neon, Liveblocks, Cloudinary, ainsi que Google Cloud et/ou Discord
pour la connexion.

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Copier `.env.example` en `.env.local` et remplir les valeurs. Chaque variable
   y est expliquée :
   - Cloudinary
   - `LIVEBLOCKS_SECRET_KEY`
   - `DATABASE_URL`
   - `CRON_SECRET`
   - `AUTH_SECRET`
   - les identifiants Google et Discord

3. Sur une base Neon **neuve**, créer les tables à partir du schéma
   (`lib/db/schema.ts`) :

   ```bash
   npm run db:push
   ```

   Sur une base qui contient déjà des données, préférer les scripts SQL de
   `scripts/`, qui n'effacent rien.

4. Lancer le site :

   ```bash
   npm run dev
   ```

   Il s'ouvre sur http://localhost:3000. En développement, un bouton
   « Connexion locale (admin) » permet d'entrer sans Google ni Discord.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | vérification des types puis build de production |
| `npm start` | lance le build de production |
| `npm test` | types, ESLint, et contrôle des aventures traduites en anglais |
| `npm run test:e2e` | tests Playwright (build puis navigateur) |

Avant une mise en ligne, suivre aussi le parcours de test manuel de
`MANUAL_TEST_PLAN.md`.

## Organisation du code

| Dossier | Contenu |
| --- | --- |
| `app/` | les pages : accueil, `salles`, `room/[id]`, `atelier`, `admin`, pages légales et crédits ; et les routes `app/api/*` |
| `components/` | l'interface, rangée par zone : `canvas`, `dice`, `character`, `chat`, `menu`, `atelier`… |
| `lib/autoGm/` | le MJ automatique et ses aventures |
| `lib/gameSystems.ts`, `lib/customSystem.ts` | les systèmes de jeu |
| `lib/db/` | le schéma de la base et les accès |
| `lib/translations.ts`, `lib/en/` | les textes en français et en anglais |
| `app/themes.css`, `lib/themes.ts` | les thèmes |
| `public/bibliotheque/` | les images libres de la bibliothèque |
| `scripts/` | scripts d'administration (base, démo) |

Le suivi du projet est à la racine :
- `JOURNAL.md` : ce qui a été fait
- `TODO.md` : ce qui reste à faire

## Ressources et licences

Les règles reprises, les images, les musiques et les sons sont tous libres de
droits. La licence de chacun est indiquée sur la page `/credits` du site et
dans `app/conditions/page.tsx` pour les systèmes de jeu.

---

Application créée par [QG Informatique](https://www.qg-informatique.fr).

# CakeJDR — repères pour Claude Code

Table de jeu de rôle en ligne : Next.js + React, temps réel via Liveblocks,
canvas partagé, dés 3D, éditeur Lexical, musique YouTube synchronisée.
`npm run dev`. Cloudinary pour les images ; comptes, tables et fiches de personnage en base (Neon), connexion Google et Discord par Auth.js (`auth.ts`).

`TODO.md` liste les chantiers ouverts (build Next 15/React 19 à vérifier, hashage des
mots de passe de rooms, tests e2e Playwright). `CHANGES.md` garde le détail du lot de
correctifs de novembre 2025 — le nouveau format de trace est `JOURNAL.md`.
`MANUAL_TEST_PLAN.md` décrit le parcours de test manuel : le suivre avant une mise en
ligne tant que les tests e2e n'existent pas.

## Garder une trace — à faire à chaque session

Avant de terminer une session de travail sur ce projet, mettre à jour deux fichiers
à la racine. Les créer s'ils n'existent pas.

**`JOURNAL.md`** — ce qui a été fait. Ajouter une entrée EN HAUT du fichier :

    ## AAAA-MM-JJ — titre court de ce qui a été fait
    - changement concret (`chemin/fichier.ext`)
    - décision prise, et pourquoi elle a été prise
    Reste ouvert : ce qui n'est pas terminé

Les entrées récentes en premier. On ajoute, on ne réécrit pas le passé : une entrée
datée reste telle quelle même si la décision est revue plus tard — dans ce cas on
écrit une nouvelle entrée qui explique le revirement.

**`TODO.md`** — ce qui reste. Cocher `- [x]` ce qui vient d'être terminé, ajouter
`- [ ]` ce qui est apparu en cours de route. Une ligne = une tâche actionnable,
formulée à l'infinitif, compréhensible dans trois mois sans le contexte de la session.

Ne pas gonfler ces fichiers : le journal résume, il ne raconte pas. Trois à six lignes
par entrée suffisent. Le détail exact des changements est dans le code.

## Pourquoi c'est important ici

Ces deux fichiers sont relus chaque matin par le recap automatique
(`C:\DEV\_recap\recap_dev.py`), qui classe tous les projets par priorité et affiche
la prochaine action de chacun. Un projet sans entrée de journal récente et sans tâche
ouverte paraît à l'arrêt, et redescend dans le classement — même s'il vient d'avancer.

Ce projet est suivi par git : le journal ne remplace pas les commits, il les résume.
Un message de commit dit ce qui change dans le code ; une entrée de journal dit où on
en est et ce qu'on avait en tête. Penser à committer `JOURNAL.md` et `TODO.md` avec le
reste.

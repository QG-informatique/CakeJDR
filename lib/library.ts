// Bibliothèque de départ : images offertes à toutes les tables, en plus de
// celles que chaque MJ envoie. Fichiers dans public/bibliotheque/<catégorie>/,
// chacun avec une miniature « -mini.webp » pour la grille.
// Images faites par Quentin (QG Informatique) : on en a les droits.
// Le pack n° 2 (octobre 2026) suit le monde de la campagne du royaume d'Aurélion.

export type LibraryLabel = { fr: string; en: string }

export type LibraryItem = {
  id: string
  label: LibraryLabel
  /** Taille réelle du fichier, pour garder ses proportions sur le plateau. */
  width: number
  height: number
}

export type LibraryCategory = {
  id: string
  label: LibraryLabel
  /** Part du plateau occupée par l'image à son arrivée (0 à 1). */
  share: number
  /** Une carte devient le fond du plateau : une seule à la fois, fixe. */
  map?: boolean
  items: LibraryItem[]
}

export const LIBRARY: LibraryCategory[] = [
  {
    id: 'cartes',
    label: { fr: 'Cartes et lieux', en: 'Maps & places' },
    share: 1,
    map: true,
    items: [
      { id: 'carte-ruines', label: { fr: 'Ruines', en: 'Ruins' }, width: 1536, height: 1024 },
      { id: 'ambiance-taverne', label: { fr: 'Taverne', en: 'Tavern' }, width: 1600, height: 900 },
      { id: 'patisserie-cake', label: { fr: 'Pâtisserie de Cake', en: 'Cake\'s bakery' }, width: 1536, height: 1024 },
      { id: 'cave-farine', label: { fr: 'Cave à farine', en: 'Flour cellar' }, width: 1536, height: 1024 },
      { id: 'royaume-aurelion', label: { fr: 'Royaume d\'Aurélion (carte)', en: 'Kingdom of Aurelion (map)' }, width: 1536, height: 1024 },
      { id: 'place-village', label: { fr: 'Place du village', en: 'Village square' }, width: 1536, height: 1024 },
      { id: 'taverne-interieur', label: { fr: 'Taverne (intérieur)', en: 'Tavern (inside)' }, width: 1536, height: 1024 },
      { id: 'foret-clairiere', label: { fr: 'Clairière', en: 'Forest clearing' }, width: 1536, height: 1024 },
      { id: 'route-embuscade', label: { fr: 'Route de l\'embuscade', en: 'Ambush road' }, width: 1536, height: 1024 },
      { id: 'camp-gobelins', label: { fr: 'Camp gobelin', en: 'Goblin camp' }, width: 1536, height: 1024 },
      { id: 'grotte-gobelins', label: { fr: 'Grotte des gobelins', en: 'Goblin cave' }, width: 1536, height: 1024 },
      { id: 'rues-ville', label: { fr: 'Rues de la ville', en: 'City streets' }, width: 1536, height: 1024 },
      { id: 'port-quais', label: { fr: 'Port et quais', en: 'Harbour docks' }, width: 1536, height: 1024 },
      { id: 'egouts', label: { fr: 'Égouts', en: 'Sewers' }, width: 1536, height: 1024 },
      { id: 'salle-trone', label: { fr: 'Salle du trône', en: 'Throne room' }, width: 1536, height: 1024 },
      { id: 'temple', label: { fr: 'Temple', en: 'Temple' }, width: 1536, height: 1024 },
      { id: 'col-montagne', label: { fr: 'Col de montagne', en: 'Mountain pass' }, width: 1536, height: 1024 },
      { id: 'camp-orc', label: { fr: 'Camp orc', en: 'Orc war camp' }, width: 1536, height: 1024 },
      { id: 'mine-abandonnee', label: { fr: 'Mine abandonnée', en: 'Abandoned mine' }, width: 1536, height: 1024 },
      { id: 'pont-gorge', label: { fr: 'Pont sur la gorge', en: 'Gorge bridge' }, width: 1536, height: 1024 },
      { id: 'marais', label: { fr: 'Marais', en: 'Swamp' }, width: 1536, height: 1024 },
      { id: 'crypte', label: { fr: 'Crypte', en: 'Crypt' }, width: 1536, height: 1024 },
      { id: 'donjon-salles', label: { fr: 'Donjon', en: 'Dungeon halls' }, width: 1536, height: 1024 },
      { id: 'tour-mage', label: { fr: 'Tour du mage', en: 'Wizard tower' }, width: 1536, height: 1024 },
      { id: 'sanctuaire-culte', label: { fr: 'Sanctuaire du culte', en: 'Cult sanctuary' }, width: 1536, height: 1024 },
      { id: 'chateau-vampire', label: { fr: 'Château du vampire', en: 'Vampire castle' }, width: 1536, height: 1024 },
      { id: 'repaire-dragon', label: { fr: 'Repaire du dragon', en: 'Dragon lair' }, width: 1536, height: 1024 },
      { id: 'ambiance-royaume', label: { fr: 'Ambiance : le royaume', en: 'Mood: the kingdom' }, width: 1600, height: 900 },
      { id: 'ambiance-ville-royale', label: { fr: 'Ambiance : ville royale', en: 'Mood: royal city' }, width: 1600, height: 900 },
      { id: 'ambiance-foret-brume', label: { fr: 'Ambiance : forêt de brume', en: 'Mood: misty forest' }, width: 1600, height: 900 },
      { id: 'ambiance-chateau-vampire', label: { fr: 'Ambiance : château du vampire', en: 'Mood: vampire castle' }, width: 1600, height: 900 },
      { id: 'ambiance-montagne-dragon', label: { fr: 'Ambiance : montagne du dragon', en: 'Mood: dragon mountain' }, width: 1600, height: 900 },
    ],
  },
  {
    id: 'pions',
    label: { fr: 'Pions alliés', en: 'Allied tokens' },
    share: 0.18,
    items: [
      { id: 'guerrier-homme', label: { fr: 'Guerrier', en: 'Warrior (man)' }, width: 427, height: 640 },
      { id: 'guerriere-femme', label: { fr: 'Guerrière', en: 'Warrior (woman)' }, width: 427, height: 640 },
      { id: 'mage-homme', label: { fr: 'Mage (homme)', en: 'Mage (man)' }, width: 427, height: 640 },
      { id: 'mage-femme', label: { fr: 'Mage (femme)', en: 'Mage (woman)' }, width: 427, height: 640 },
      { id: 'rodeur-homme', label: { fr: 'Rôdeur', en: 'Ranger (man)' }, width: 427, height: 640 },
      { id: 'rodeuse-femme', label: { fr: 'Rôdeuse', en: 'Ranger (woman)' }, width: 427, height: 640 },
      { id: 'roublard-homme', label: { fr: 'Roublard', en: 'Rogue (man)' }, width: 427, height: 640 },
      { id: 'roublarde-femme', label: { fr: 'Roublarde', en: 'Rogue (woman)' }, width: 427, height: 640 },
      { id: 'cake-patissier', label: { fr: 'Cake le pâtissier', en: 'Cake the baker' }, width: 427, height: 640 },
      { id: 'nain-guerrier', label: { fr: 'Nain guerrier', en: 'Dwarf warrior' }, width: 427, height: 640 },
      { id: 'paladine-femme', label: { fr: 'Paladine', en: 'Paladin (woman)' }, width: 427, height: 640 },
      { id: 'barde-homme', label: { fr: 'Barde', en: 'Bard (man)' }, width: 427, height: 640 },
      { id: 'druidesse-femme', label: { fr: 'Druidesse', en: 'Druid (woman)' }, width: 427, height: 640 },
      { id: 'moine-homme', label: { fr: 'Moine', en: 'Monk (man)' }, width: 427, height: 640 },
      { id: 'clerc-femme', label: { fr: 'Clerc (femme)', en: 'Cleric (woman)' }, width: 427, height: 640 },
      { id: 'roi', label: { fr: 'Le roi', en: 'The king' }, width: 427, height: 640 },
      { id: 'capitaine-garde', label: { fr: 'Capitaine de la garde', en: 'Guard captain' }, width: 427, height: 640 },
      { id: 'garde-ville', label: { fr: 'Garde de la ville', en: 'City guard' }, width: 427, height: 640 },
      { id: 'chevaliere-heroine', label: { fr: 'Chevalière héroïne', en: 'Heroic knight' }, width: 427, height: 640 },
      { id: 'mage-cour', label: { fr: 'Mage de la cour', en: 'Court mage' }, width: 427, height: 640 },
      { id: 'pretresse-temple', label: { fr: 'Grande prêtresse', en: 'High priestess' }, width: 427, height: 640 },
      { id: 'guide-elfe', label: { fr: 'Guide elfe', en: 'Elf guide' }, width: 427, height: 640 },
      { id: 'capitaine-port', label: { fr: 'Capitaine de navire', en: 'Ship captain' }, width: 427, height: 640 },
      { id: 'milicien-village', label: { fr: 'Milicien', en: 'Village militia' }, width: 427, height: 640 },
    ],
  },
  {
    id: 'ennemis',
    label: { fr: 'Pions ennemis', en: 'Enemy tokens' },
    share: 0.18,
    items: [
      { id: 'golem-mie-brulee', label: { fr: 'Golem de Mie Brûlée (boss)', en: 'Burnt Crumb Golem (boss)' }, width: 427, height: 640 },
      { id: 'levain-affame', label: { fr: 'Levain affamé', en: 'Hungry sourdough' }, width: 427, height: 640 },
      { id: 'levain-geant', label: { fr: 'Levain géant', en: 'Giant sourdough' }, width: 427, height: 640 },
      { id: 'gobelin-guerrier', label: { fr: 'Gobelin guerrier', en: 'Goblin warrior' }, width: 427, height: 640 },
      { id: 'gobelin-archer', label: { fr: 'Gobelin archer', en: 'Goblin archer' }, width: 427, height: 640 },
      { id: 'gobelin-chaman', label: { fr: 'Gobelin chaman', en: 'Goblin shaman' }, width: 427, height: 640 },
      { id: 'loup-sombre', label: { fr: 'Loup sombre', en: 'Dark wolf' }, width: 427, height: 640 },
      { id: 'roi-gobelin', label: { fr: 'Roi gobelin (boss)', en: 'Goblin king (boss)' }, width: 427, height: 640 },
      { id: 'bandit', label: { fr: 'Bandit', en: 'Bandit' }, width: 427, height: 640 },
      { id: 'arbaletriere-bandit', label: { fr: 'Arbalétrière', en: 'Crossbow bandit' }, width: 427, height: 640 },
      { id: 'brute-bandit', label: { fr: 'Brute', en: 'Bandit brute' }, width: 427, height: 640 },
      { id: 'cheffe-bandits', label: { fr: 'Cheffe des bandits (boss)', en: 'Bandit leader (boss)' }, width: 427, height: 640 },
      { id: 'cultiste', label: { fr: 'Cultiste', en: 'Cultist' }, width: 427, height: 640 },
      { id: 'fanatique', label: { fr: 'Fanatique', en: 'Fanatic' }, width: 427, height: 640 },
      { id: 'diablotin', label: { fr: 'Diablotin', en: 'Imp' }, width: 427, height: 640 },
      { id: 'demon-cornu', label: { fr: 'Démon cornu (élite)', en: 'Horned demon (elite)' }, width: 427, height: 640 },
      { id: 'grand-pretre', label: { fr: 'Grand prêtre (boss)', en: 'High priest (boss)' }, width: 427, height: 640 },
      { id: 'orc-guerrier', label: { fr: 'Orc guerrier', en: 'Orc warrior' }, width: 427, height: 640 },
      { id: 'orc-archer', label: { fr: 'Orc archer', en: 'Orc archer' }, width: 427, height: 640 },
      { id: 'ogre', label: { fr: 'Ogre', en: 'Ogre' }, width: 427, height: 640 },
      { id: 'orc-chaman', label: { fr: 'Orc chaman (élite)', en: 'Orc shaman (elite)' }, width: 427, height: 640 },
      { id: 'chef-orc', label: { fr: 'Chef orc (boss)', en: 'Orc warlord (boss)' }, width: 427, height: 640 },
      { id: 'homme-lezard', label: { fr: 'Homme-lézard', en: 'Lizardfolk' }, width: 427, height: 640 },
      { id: 'araignee-geante', label: { fr: 'Araignée géante', en: 'Giant spider' }, width: 427, height: 640 },
      { id: 'troll', label: { fr: 'Troll (élite)', en: 'Troll (elite)' }, width: 427, height: 640 },
      { id: 'sorciere-marais', label: { fr: 'Sorcière du marais (boss)', en: 'Swamp witch (boss)' }, width: 427, height: 640 },
      { id: 'squelette-soldat', label: { fr: 'Squelette soldat', en: 'Skeleton soldier' }, width: 427, height: 640 },
      { id: 'squelette-archer', label: { fr: 'Squelette archer', en: 'Skeleton archer' }, width: 427, height: 640 },
      { id: 'zombie', label: { fr: 'Zombie', en: 'Zombie' }, width: 427, height: 640 },
      { id: 'goule', label: { fr: 'Goule', en: 'Ghoul' }, width: 427, height: 640 },
      { id: 'spectre', label: { fr: 'Spectre (élite)', en: 'Wraith (elite)' }, width: 427, height: 640 },
      { id: 'necromancien', label: { fr: 'Nécromancien (élite)', en: 'Necromancer (elite)' }, width: 427, height: 640 },
      { id: 'liche', label: { fr: 'Liche (boss)', en: 'Lich (boss)' }, width: 427, height: 640 },
      { id: 'rejeton-vampire', label: { fr: 'Rejeton vampire', en: 'Vampire spawn' }, width: 427, height: 640 },
      { id: 'chauve-souris-geante', label: { fr: 'Chauve-souris géante', en: 'Giant bat' }, width: 427, height: 640 },
      { id: 'loup-garou', label: { fr: 'Loup-garou (élite)', en: 'Werewolf (elite)' }, width: 427, height: 640 },
      { id: 'seigneur-vampire', label: { fr: 'Seigneur vampire (boss)', en: 'Vampire lord (boss)' }, width: 427, height: 640 },
      { id: 'kobold', label: { fr: 'Kobold', en: 'Kobold' }, width: 427, height: 640 },
      { id: 'drakeide-garde', label: { fr: 'Garde drakéide', en: 'Dragonborn guard' }, width: 427, height: 640 },
      { id: 'dragon-rouge', label: { fr: 'Dragon rouge (boss)', en: 'Red dragon (boss)' }, width: 427, height: 640 },
    ],
  },
  {
    id: 'portraits',
    label: { fr: 'Portraits', en: 'Portraits' },
    share: 0.28,
    items: [
      { id: 'guerrier-homme', label: { fr: 'Guerrier', en: 'Warrior (man)' }, width: 768, height: 768 },
      { id: 'guerriere-femme', label: { fr: 'Guerrière', en: 'Warrior (woman)' }, width: 768, height: 768 },
      { id: 'mage-homme', label: { fr: 'Mage (homme)', en: 'Mage (man)' }, width: 768, height: 768 },
      { id: 'mage-femme', label: { fr: 'Mage (femme)', en: 'Mage (woman)' }, width: 768, height: 768 },
      { id: 'rodeur-homme', label: { fr: 'Rôdeur', en: 'Ranger (man)' }, width: 768, height: 768 },
      { id: 'rodeuse-femme', label: { fr: 'Rôdeuse', en: 'Ranger (woman)' }, width: 768, height: 768 },
      { id: 'roublard-homme', label: { fr: 'Roublard', en: 'Rogue (man)' }, width: 768, height: 768 },
      { id: 'roublarde-femme', label: { fr: 'Roublarde', en: 'Rogue (woman)' }, width: 768, height: 768 },
      { id: 'cake-patissier', label: { fr: 'Cake le pâtissier', en: 'Cake the baker' }, width: 768, height: 768 },
      { id: 'cakesama-variante-brioche', label: { fr: 'Cake à la brioche', en: 'Cake with brioche' }, width: 768, height: 768 },
      { id: 'nain-guerrier', label: { fr: 'Nain guerrier', en: 'Dwarf warrior' }, width: 768, height: 768 },
      { id: 'paladine-femme', label: { fr: 'Paladine', en: 'Paladin (woman)' }, width: 768, height: 768 },
      { id: 'barde-homme', label: { fr: 'Barde', en: 'Bard (man)' }, width: 768, height: 768 },
      { id: 'druidesse-femme', label: { fr: 'Druidesse', en: 'Druid (woman)' }, width: 768, height: 768 },
      { id: 'moine-homme', label: { fr: 'Moine', en: 'Monk (man)' }, width: 768, height: 768 },
      { id: 'clerc-femme', label: { fr: 'Clerc (femme)', en: 'Cleric (woman)' }, width: 768, height: 768 },
    ],
  },
  {
    id: 'rencontres',
    label: { fr: 'Rencontres', en: 'Encounters' },
    share: 0.32,
    items: [
      { id: 'creature-gobelin', label: { fr: 'Gobelin', en: 'Goblin' }, width: 1024, height: 1024 },
      { id: 'boss-gardien', label: { fr: 'Gardien (boss)', en: 'Guardian (boss)' }, width: 1024, height: 1024 },
      { id: 'pnj-aubergiste', label: { fr: 'Aubergiste (PNJ)', en: 'Innkeeper (NPC)' }, width: 1024, height: 1024 },
      { id: 'cake-patissier', label: { fr: 'Cake le pâtissier', en: 'Cake the baker' }, width: 1024, height: 1024 },
      { id: 'apprentie-patissiere', label: { fr: 'Mila, l\'apprentie', en: 'Mila the apprentice' }, width: 1024, height: 1024 },
      { id: 'golem-mie-brulee', label: { fr: 'Golem de Mie Brûlée (boss)', en: 'Burnt Crumb Golem (boss)' }, width: 1024, height: 1024 },
      { id: 'roi', label: { fr: 'Le roi', en: 'The king' }, width: 1024, height: 1024 },
      { id: 'princesse-heritiere', label: { fr: 'Princesse héritière', en: 'Crown princess' }, width: 1024, height: 1024 },
      { id: 'capitaine-garde', label: { fr: 'Capitaine de la garde', en: 'Guard captain' }, width: 1024, height: 1024 },
      { id: 'garde-ville', label: { fr: 'Garde de la ville', en: 'City guard' }, width: 1024, height: 1024 },
      { id: 'chevaliere-heroine', label: { fr: 'Chevalière héroïne', en: 'Heroic knight' }, width: 1024, height: 1024 },
      { id: 'mage-cour', label: { fr: 'Mage de la cour', en: 'Court mage' }, width: 1024, height: 1024 },
      { id: 'pretresse-temple', label: { fr: 'Grande prêtresse', en: 'High priestess' }, width: 1024, height: 1024 },
      { id: 'guide-elfe', label: { fr: 'Guide elfe', en: 'Elf guide' }, width: 1024, height: 1024 },
      { id: 'capitaine-port', label: { fr: 'Capitaine de navire', en: 'Ship captain' }, width: 1024, height: 1024 },
      { id: 'milicien-village', label: { fr: 'Milicien', en: 'Village militia' }, width: 1024, height: 1024 },
      { id: 'bourgmestre', label: { fr: 'Bourgmestre (PNJ)', en: 'Mayor (NPC)' }, width: 1024, height: 1024 },
      { id: 'forgeronne-naine', label: { fr: 'Forgeronne naine (PNJ)', en: 'Dwarf smith (NPC)' }, width: 1024, height: 1024 },
      { id: 'marchand-ambulant', label: { fr: 'Marchand ambulant (PNJ)', en: 'Peddler (NPC)' }, width: 1024, height: 1024 },
      { id: 'herboriste', label: { fr: 'Herboriste (PNJ)', en: 'Herbalist (NPC)' }, width: 1024, height: 1024 },
      { id: 'alchimiste', label: { fr: 'Alchimiste (PNJ)', en: 'Alchemist (NPC)' }, width: 1024, height: 1024 },
      { id: 'informateur-voleur', label: { fr: 'Informateur (PNJ)', en: 'Thief informant (NPC)' }, width: 1024, height: 1024 },
      { id: 'ermite-sage', label: { fr: 'Ermite (PNJ)', en: 'Hermit sage (NPC)' }, width: 1024, height: 1024 },
      { id: 'noble-intrigante', label: { fr: 'Noble intrigante (PNJ)', en: 'Scheming noble (NPC)' }, width: 1024, height: 1024 },
      { id: 'paysanne', label: { fr: 'Paysanne (PNJ)', en: 'Farmer (NPC)' }, width: 1024, height: 1024 },
      { id: 'diseuse-aventure', label: { fr: 'Diseuse de bonne aventure (PNJ)', en: 'Fortune teller (NPC)' }, width: 1024, height: 1024 },
      { id: 'roi-gobelin', label: { fr: 'Roi gobelin (boss)', en: 'Goblin king (boss)' }, width: 1024, height: 1024 },
      { id: 'cheffe-bandits', label: { fr: 'Cheffe des bandits (boss)', en: 'Bandit leader (boss)' }, width: 1024, height: 1024 },
      { id: 'demon-cornu', label: { fr: 'Démon cornu (élite)', en: 'Horned demon (elite)' }, width: 1024, height: 1024 },
      { id: 'grand-pretre', label: { fr: 'Grand prêtre (boss)', en: 'High priest (boss)' }, width: 1024, height: 1024 },
      { id: 'orc-chaman', label: { fr: 'Orc chaman (élite)', en: 'Orc shaman (elite)' }, width: 1024, height: 1024 },
      { id: 'chef-orc', label: { fr: 'Chef orc (boss)', en: 'Orc warlord (boss)' }, width: 1024, height: 1024 },
      { id: 'troll', label: { fr: 'Troll (élite)', en: 'Troll (elite)' }, width: 1024, height: 1024 },
      { id: 'sorciere-marais', label: { fr: 'Sorcière du marais (boss)', en: 'Swamp witch (boss)' }, width: 1024, height: 1024 },
      { id: 'spectre', label: { fr: 'Spectre (élite)', en: 'Wraith (elite)' }, width: 1024, height: 1024 },
      { id: 'necromancien', label: { fr: 'Nécromancien (élite)', en: 'Necromancer (elite)' }, width: 1024, height: 1024 },
      { id: 'liche', label: { fr: 'Liche (boss)', en: 'Lich (boss)' }, width: 1024, height: 1024 },
      { id: 'loup-garou', label: { fr: 'Loup-garou (élite)', en: 'Werewolf (elite)' }, width: 1024, height: 1024 },
      { id: 'seigneur-vampire', label: { fr: 'Seigneur vampire (boss)', en: 'Vampire lord (boss)' }, width: 1024, height: 1024 },
      { id: 'dragon-rouge', label: { fr: 'Dragon rouge (boss)', en: 'Red dragon (boss)' }, width: 1024, height: 1024 },
    ],
  },
]

/** Catégories proposées sur le plateau ; les portraits servent aux fiches. */
export const BOARD_LIBRARY = LIBRARY.filter((c) => c.id !== 'portraits')

/**
 * Image envoyée par un joueur dans la bibliothèque de sa table, rangée dans
 * le stockage Liveblocks (`library`) : tous les joueurs de la table la voient.
 */
export type LibraryUpload = {
  id: string
  url: string
  category: string
  width: number
  height: number
  /** Identifiant Liveblocks de celui qui l'a envoyée. */
  ownerId: string
  ownerName?: string
  createdAt: number
}

/** Miniature d'une image Cloudinary, pour la grille de la bibliothèque. */
export function uploadThumbUrl(url: string): string {
  return url.startsWith('https://res.cloudinary.com/')
    ? url.replace('/image/upload/', '/image/upload/c_limit,w_240,h_240,f_auto,q_auto/')
    : url
}

export function libraryUrl(categoryId: string, itemId: string, mini = false): string {
  return `/bibliotheque/${categoryId}/${itemId}${mini ? '-mini' : ''}.webp`
}

/** Type MIME du glisser-déposer d'une image de la bibliothèque vers le plateau. */
export const LIBRARY_DRAG_TYPE = 'application/x-cakejdr-library'

/** Image de la bibliothèque prête à poser : offerte ou envoyée par la table. */
export type BoardEntry = {
  url: string
  categoryId: string
  width: number
  height: number
}

export function boardCategory(id: string) {
  return BOARD_LIBRARY.find((c) => c.id === id)
}

// ── Étiquettes du pack n° 2 (voir PROMPT-PACK-IMAGES.md) ──────────────────
// Un même identifiant dans plusieurs dossiers est le même personnage : la
// rencontre « liche » et le pion ennemi « liche » partagent leurs étiquettes.

export type LibraryRole = 'troupe' | 'elite' | 'boss' | 'allie' | 'pnj'
export type LibraryAct = '1' | '2' | '3' | 'final'

export const LIBRARY_FACTIONS: { id: string; label: LibraryLabel; act?: LibraryAct }[] = [
  { id: 'royaume', label: { fr: 'Royaume', en: 'Kingdom' } },
  { id: 'fournil', label: { fr: 'Fournil de Cake', en: 'Cake\'s bakery' } },
  { id: 'gobelins', label: { fr: 'Gobelins', en: 'Goblins' }, act: '1' },
  { id: 'bandits', label: { fr: 'Bandits', en: 'Bandits' }, act: '1' },
  { id: 'culte', label: { fr: 'Culte', en: 'Cult' }, act: '2' },
  { id: 'orcs', label: { fr: 'Orcs', en: 'Orcs' }, act: '3' },
  { id: 'marais', label: { fr: 'Marais', en: 'Swamp' }, act: '3' },
  { id: 'morts-vivants', label: { fr: 'Morts-vivants', en: 'Undead' }, act: '3' },
  { id: 'vampires', label: { fr: 'Vampires', en: 'Vampires' }, act: 'final' },
  { id: 'dragon', label: { fr: 'Dragon', en: 'Dragon' }, act: 'final' },
]

export const LIBRARY_ACTS: { id: LibraryAct; label: LibraryLabel }[] = [
  { id: '1', label: { fr: 'Acte 1', en: 'Act 1' } },
  { id: '2', label: { fr: 'Acte 2', en: 'Act 2' } },
  { id: '3', label: { fr: 'Acte 3', en: 'Act 3' } },
  { id: 'final', label: { fr: 'Final', en: 'Finale' } },
]

export const LIBRARY_ROLES: { id: LibraryRole; label: LibraryLabel }[] = [
  { id: 'troupe', label: { fr: 'Troupe', en: 'Minion' } },
  { id: 'elite', label: { fr: 'Élite', en: 'Elite' } },
  { id: 'boss', label: { fr: 'Boss', en: 'Boss' } },
  { id: 'allie', label: { fr: 'Allié', en: 'Ally' } },
  { id: 'pnj', label: { fr: 'PNJ', en: 'NPC' } },
]

const FACTION_OF: Record<string, string> = {}
const tagFaction = (faction: string, ids: string) => ids.split(' ').forEach((id) => { FACTION_OF[id] = faction })
tagFaction('fournil', 'golem-mie-brulee levain-affame levain-geant patisserie-cake cave-farine')
tagFaction('gobelins', 'gobelin-guerrier gobelin-archer gobelin-chaman loup-sombre roi-gobelin creature-gobelin camp-gobelins grotte-gobelins')
tagFaction('bandits', 'bandit arbaletriere-bandit brute-bandit cheffe-bandits route-embuscade')
tagFaction('culte', 'cultiste fanatique diablotin demon-cornu grand-pretre noble-intrigante sanctuaire-culte')
tagFaction('orcs', 'orc-guerrier orc-archer ogre orc-chaman chef-orc camp-orc col-montagne')
tagFaction('marais', 'homme-lezard araignee-geante troll sorciere-marais marais')
tagFaction('morts-vivants', 'squelette-soldat squelette-archer zombie goule spectre necromancien liche crypte')
tagFaction('vampires', 'rejeton-vampire chauve-souris-geante loup-garou seigneur-vampire chateau-vampire ambiance-chateau-vampire')
tagFaction('dragon', 'kobold drakeide-garde dragon-rouge repaire-dragon ambiance-montagne-dragon')
tagFaction('royaume', 'roi capitaine-garde garde-ville chevaliere-heroine mage-cour pretresse-temple guide-elfe capitaine-port milicien-village princesse-heritiere salle-trone royaume-aurelion ambiance-royaume ambiance-ville-royale')

/** Lieux sans faction, rangés par acte. */
const ACT_OF: Record<string, LibraryAct> = {}
const tagAct = (act: LibraryAct, ids: string) => ids.split(' ').forEach((id) => { ACT_OF[id] = act })
tagAct('1', 'place-village taverne-interieur foret-clairiere ambiance-foret-brume bourgmestre paysanne')
tagAct('2', 'rues-ville port-quais egouts temple informateur-voleur')
tagAct('3', 'mine-abandonnee pont-gorge donjon-salles tour-mage ermite-sage')

const ENEMY_IDS = new Set(LIBRARY.find((c) => c.id === 'ennemis')?.items.map((i) => i.id) ?? [])
const ALLY_IDS = new Set(LIBRARY.find((c) => c.id === 'pions')?.items.map((i) => i.id) ?? [])

export type LibraryTags = { role?: LibraryRole; faction?: string; act?: LibraryAct }

/** Rôle, faction et acte d'une image offerte, pour les filtres de la bibliothèque. */
export function libraryTags(categoryId: string, item: LibraryItem): LibraryTags {
  const faction = FACTION_OF[item.id]
  const act = ACT_OF[item.id] ?? LIBRARY_FACTIONS.find((f) => f.id === faction)?.act
  if (categoryId === 'cartes') return { faction, act }
  const label = item.label.fr
  const role: LibraryRole = label.includes('(boss)') ? 'boss'
    : label.includes('(élite)') ? 'elite'
    : label.includes('(PNJ)') ? 'pnj'
    : ALLY_IDS.has(item.id) ? 'allie'
    : ENEMY_IDS.has(item.id) || categoryId === 'ennemis' || (faction && faction !== 'royaume') ? 'troupe'
    : 'pnj'
  return { role, faction, act }
}

/** Pion assorti à une rencontre ou à un portrait (même identifiant), s'il existe. */
export function matchingPion(itemId: string): { categoryId: string; item: LibraryItem } | null {
  for (const categoryId of ['pions', 'ennemis']) {
    const item = LIBRARY.find((c) => c.id === categoryId)?.items.find((i) => i.id === itemId)
    if (item) return { categoryId, item }
  }
  return null
}

/** Identifiant d'une image offerte à partir de son adresse, si c'en est une. */
export function libraryItemOf(url: string | undefined): { categoryId: string; itemId: string } | null {
  const m = url?.match(/^\/bibliotheque\/([^/]+)\/([^/]+?)\.webp$/)
  return m ? { categoryId: m[1]!, itemId: m[2]! } : null
}

/** Couleurs des pions dessinés par le code. */
export const TOKEN_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#57534e']

/** Initiale d'un nom pour un pion de couleur. */
export function tokenInitial(name: string | undefined): string {
  return (name?.trim()[0] ?? '?').toUpperCase()
}

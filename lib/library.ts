// Bibliothèque de départ : images offertes à toutes les tables, en plus de
// celles que chaque MJ envoie. Fichiers dans public/bibliotheque/<catégorie>/,
// chacun avec une miniature « -mini.webp » pour la grille.
// Images faites par Quentin (QG Informatique) : on en a les droits.

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
  items: LibraryItem[]
}

export const LIBRARY: LibraryCategory[] = [
  {
    id: 'cartes',
    label: { fr: 'Cartes et lieux', en: 'Maps & places' },
    share: 0.9,
    items: [
      { id: 'carte-ruines', label: { fr: 'Ruines', en: 'Ruins' }, width: 1536, height: 1024 },
      { id: 'ambiance-taverne', label: { fr: 'Taverne', en: 'Tavern' }, width: 1600, height: 900 },
    ],
  },
  {
    id: 'pions',
    label: { fr: 'Pions', en: 'Tokens' },
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
    ],
  },
]

export function libraryUrl(categoryId: string, itemId: string, mini = false): string {
  return `/bibliotheque/${categoryId}/${itemId}${mini ? '-mini' : ''}.webp`
}

/** Type MIME du glisser-déposer d'une image de la bibliothèque vers le plateau. */
export const LIBRARY_DRAG_TYPE = 'application/x-cakejdr-library'

export type LibraryPick = { categoryId: string; itemId: string }

export function findLibraryItem(pick: LibraryPick) {
  const category = LIBRARY.find((c) => c.id === pick.categoryId)
  const item = category?.items.find((i) => i.id === pick.itemId)
  return category && item ? { category, item } : null
}

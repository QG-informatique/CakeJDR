/**
 * Historiques : ce que faisait le héros avant l'aventure. Chacun donne un
 * bonus aux actions de son domaine, pas aux caractéristiques : un ancien
 * voleur se faufile mieux, quelle que soit sa Dextérité.
 *
 * Le MJ automatique s'en sert à chaque jet : les jets de ses aventures disent
 * à quel genre d'action ils appartiennent (`SceneStep.action`), et le héros
 * dont l'historique correspond ajoute le bonus. Il a donc plus de chances
 * d'être appelé à lancer, et de réussir. Régler une situation sans combattre
 * profite ainsi autant à un héros qu'un combat.
 */

/** Genres d'action des jets du MJ automatique. */
export type ActionKind = 'combat' | 'discretion' | 'parole' | 'ruse' | 'savoir' | 'nature' | 'foi' | 'effort'

/** Bonus d'un historique aux actions de son domaine. */
export const BACKGROUND_BONUS = 2

export type Background = {
  id: string
  action: ActionKind
  nom: string
  /** Le passé du héros, en une phrase : il va dans la fiche. */
  passe: string
  /** Les actions qui profitent du bonus, en clair. */
  domaine: string
}

const BACKGROUNDS_FR: readonly Background[] = [
  { id: 'soldat', action: 'combat', nom: 'Ancien soldat', passe: 'A servi dans une compagnie avant de partir à l\'aventure.', domaine: 'combattre' },
  { id: 'voleur', action: 'discretion', nom: 'Voleur des rues', passe: 'A grandi en chapardant dans les ruelles d\'une grande ville.', domaine: 'se cacher, se faufiler, voler, crocheter' },
  { id: 'noble', action: 'parole', nom: 'Noble', passe: 'Élevé à la cour, rompu aux bonnes manières et aux négociations.', domaine: 'convaincre, négocier, apaiser' },
  { id: 'saltimbanque', action: 'ruse', nom: 'Saltimbanque', passe: 'A couru les foires en jouant la comédie et les tours de passe-passe.', domaine: 'mentir, duper, distraire' },
  { id: 'erudit', action: 'savoir', nom: 'Érudit', passe: 'A passé des années dans les bibliothèques à étudier les vieux grimoires.', domaine: 'énigmes, magie, rituels' },
  { id: 'chasseur', action: 'nature', nom: 'Chasseur', passe: 'A vécu de la chasse, seul au fond des bois.', domaine: 'pister, survivre, traverser la nature' },
  { id: 'acolyte', action: 'foi', nom: 'Acolyte', passe: 'A servi dans un temple, au milieu des prières et des reliques.', domaine: 'bénédictions, morts-vivants, malédictions' },
  { id: 'artisan', action: 'effort', nom: 'Forgeron', passe: 'A travaillé à la forge, des journées entières devant le feu.', domaine: 'pousser, porter, endurer' },
]

const BACKGROUNDS_EN: readonly Background[] = [
  { id: 'soldat', action: 'combat', nom: 'Former soldier', passe: 'Served in a company before setting out on adventure.', domaine: 'fighting' },
  { id: 'voleur', action: 'discretion', nom: 'Street thief', passe: 'Grew up pilfering in the alleys of a big city.', domaine: 'hiding, sneaking, stealing, lockpicking' },
  { id: 'noble', action: 'parole', nom: 'Noble', passe: 'Raised at court, well versed in manners and negotiation.', domaine: 'convincing, negotiating, calming' },
  { id: 'saltimbanque', action: 'ruse', nom: 'Entertainer', passe: 'Toured the fairs with comedy and sleight of hand.', domaine: 'lying, tricking, distracting' },
  { id: 'erudit', action: 'savoir', nom: 'Scholar', passe: 'Spent years in libraries studying old grimoires.', domaine: 'riddles, magic, rituals' },
  { id: 'chasseur', action: 'nature', nom: 'Hunter', passe: 'Lived off the hunt, alone deep in the woods.', domaine: 'tracking, surviving, crossing the wild' },
  { id: 'acolyte', action: 'foi', nom: 'Acolyte', passe: 'Served in a temple, among prayers and relics.', domaine: 'blessings, undead, curses' },
  { id: 'artisan', action: 'effort', nom: 'Blacksmith', passe: 'Worked at the forge, whole days in front of the fire.', domaine: 'pushing, lifting, enduring' },
]

/** Les historiques dans la langue de l'interface. */
export function backgrounds(lang: 'en' | 'fr'): readonly Background[] {
  return lang === 'en' ? BACKGROUNDS_EN : BACKGROUNDS_FR
}

export function backgroundOf(id: string | undefined, lang: 'en' | 'fr'): Background | undefined {
  return id ? backgrounds(lang).find((b) => b.id === id) : undefined
}

/** Bonus de l'historique `id` à une action de ce genre. */
export function actionBonus(id: string | undefined, action: ActionKind | undefined): number {
  if (!id || !action) return 0
  return BACKGROUNDS_FR.find((b) => b.id === id)?.action === action ? BACKGROUND_BONUS : 0
}

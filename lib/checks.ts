/**
 * Tests de caractéristique demandés par le MJ.
 *
 * Le MJ choisit le joueur, la caractéristique, la difficulté, et s'il la
 * montre. Le joueur lance un D20 ; le serveur tire le dé, ajoute le
 * modificateur, et le test est réussi si le total atteint la difficulté.
 */

/** Dé lancé pour un test. */
export const CHECK_DICE = 20

/** Caractéristiques qu'on peut tester, avec leur intitulé dans `lib/translations.ts`. */
export const CHECK_STATS = [
  { key: 'force', label: 'strength' },
  { key: 'dexterite', label: 'dexterity' },
  { key: 'constitution', label: 'constitution' },
  { key: 'intelligence', label: 'intelligence' },
  { key: 'sagesse', label: 'wisdom' },
  { key: 'charisme', label: 'charisma' },
] as const

export type CheckStat = (typeof CHECK_STATS)[number]['key']

export function isCheckStat(value: unknown): value is CheckStat {
  return CHECK_STATS.some((s) => s.key === value)
}

export function checkStatLabel(stat: string) {
  return CHECK_STATS.find((s) => s.key === stat)?.label ?? 'strength'
}

/** Bornes acceptées par le serveur. */
export const CHECK_MOD_RANGE = 30
export const CHECK_DC_MIN = 1
export const CHECK_DC_MAX = 60
export const CHECK_REASON_MAX = 120
export const CHECK_NAME_MAX = 60

/**
 * Demande en attente, rangée dans la liste partagée `checks` de la table.
 *
 * Les champs en clair servent à l'affichage ; `seal` est la demande complète
 * chiffrée par le serveur. C'est elle qui fait foi au moment du jet : un
 * joueur qui modifierait la demande ne changerait rien, et il ne peut pas y
 * lire une difficulté cachée.
 */
export type CheckRequest = {
  type?: 'check'
  id: string
  targetId: string
  targetName: string
  stat: CheckStat
  mod: number
  showDc: boolean
  /** Présente seulement si le MJ montre la difficulté. */
  dc?: number
  reason?: string
  createdAt: number
  seal: string
}

/** Résultat d'un test, joint au lancer inscrit dans l'historique. */
export type CheckOutcome = {
  stat: CheckStat
  mod: number
  total: number
  dc: number
  showDc: boolean
  success: boolean
  reason?: string
}

/**
 * Jets demandés par le MJ : plusieurs dés d'un coup, lancés par le joueur en
 * une fois. Une montée de niveau en est un cas particulier : un dé pour les PV
 * et un par caractéristique, ajoutés à la fiche du joueur.
 */
export const ROLLS_MAX = 10
export const LEVEL_UP_TARGETS = ['pv', ...CHECK_STATS.map((s) => s.key)] as const
export type LevelUpTarget = (typeof LEVEL_UP_TARGETS)[number]

export type RollsRequest = {
  type: 'rolls'
  id: string
  targetId: string
  targetName: string
  dice: number
  count: number
  levelUp: boolean
  reason?: string
  createdAt: number
  seal: string
}

/** Demande en attente dans la liste `checks` : un test ou des jets. */
export type GmRequest = CheckRequest | RollsRequest

/** Résultat de jets demandés, joint au lancer inscrit dans l'historique. */
export type RollsOutcome = {
  results: number[]
  levelUp: boolean
  reason?: string
}

/** Intitulé d'un dé de montée de niveau dans `lib/translations.ts`. */
export const levelUpLabel = (i: number) =>
  i === 0 ? 'hp' : checkStatLabel(LEVEL_UP_TARGETS[i] ?? '')

export const signedMod = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`

/** Place la caractéristique dans le texte, avec l'élision française : « test d'Intelligence ». */
export const withStat = (text: string, stat: string) =>
  text.replace('{stat}', stat).replace(/(^|\s)de ([AEIOUYÉÈÊ])/, "$1d'$2")

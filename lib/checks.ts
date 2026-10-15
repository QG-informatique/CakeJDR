import { ALL_STATS, NARRATIF, type D100, type GameSystem } from './gameSystems'

/**
 * Tests de caractéristique demandés par le MJ.
 *
 * Le MJ choisit le joueur, la caractéristique, la difficulté, et s'il la
 * montre. Le joueur lance un D20 sur la table ; le serveur reçoit la face
 * obtenue, ajoute le modificateur, et le test est réussi si le total atteint
 * la difficulté.
 */

/** Dé d'un test quand la demande ne dit pas lequel (demandes d'avant les systèmes). */
export const CHECK_DICE = NARRATIF.checkDie

/** Caractéristiques du jeu narratif, avec leur intitulé dans `lib/translations.ts`. */
export const CHECK_STATS = NARRATIF.stats

/** Une caractéristique, de n'importe quel système (`lib/gameSystems.ts`). */
export type CheckStat = (typeof NARRATIF.stats)[number]['key'] | (typeof D100.stats)[number]['key']

/** Vrai si la caractéristique existe dans ce système. */
export function isCheckStat(value: unknown, system: GameSystem = NARRATIF): value is CheckStat {
  return system.stats.some((s) => s.key === value)
}

export function checkStatLabel(stat: string) {
  return ALL_STATS.find((s) => s.key === stat)?.label ?? 'strength'
}

/** Bornes acceptées par le serveur. */
export const CHECK_MOD_RANGE = 30
export const CHECK_DC_MIN = 1
export const CHECK_DC_MAX = 60
/** Seuil d'un test sous un seuil : jusqu'au double d'une caractéristique de 20 (test facile). */
export const CHECK_THRESHOLD_MAX = 200
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
  /** Dé à lancer ; absent sur les demandes d'avant les systèmes : un D20. */
  dice?: number
  /** Test sous un seuil (d100) : `dc` est le seuil, en %. */
  under?: boolean
  reason?: string
  /** Demandé par le MJ automatique : un jet de scène ou une attaque en combat. */
  auto?: AutoAsk
  createdAt: number
  seal: string
}

/**
 * Demande faite par le MJ automatique, acceptée du joueur qui mène la partie
 * même s'il n'est pas le MJ de la table : le serveur vérifie qu'elle
 * correspond à la scène en cours (`app/api/check/route.ts`).
 */
export type AutoAsk = 'scene' | 'combat' | 'level'

/** Résultat d'un test, joint au lancer inscrit dans l'historique. */
export type CheckOutcome = {
  stat: CheckStat
  mod: number
  total: number
  dc: number
  showDc: boolean
  success: boolean
  /** Test sous un seuil (d100) : réussi si le dé fait au plus `dc`. */
  under?: boolean
  reason?: string
}

/**
 * Jets demandés par le MJ : plusieurs dés d'un coup, lancés par le joueur en
 * une fois. Une montée de niveau en est un cas particulier : un dé pour les PV
 * et un par caractéristique, ajoutés à la fiche du joueur.
 */
export const ROLLS_MAX = 10
export const LEVEL_UP_TARGETS = NARRATIF.levelUp
export type LevelUpTarget = (typeof LEVEL_UP_TARGETS)[number]

export type RollsRequest = {
  type: 'rolls'
  id: string
  targetId: string
  targetName: string
  dice: number
  count: number
  levelUp: boolean
  /** Montée de niveau : ce que chaque dé fait monter (« pv », puis les caractéristiques). */
  targets?: string[]
  reason?: string
  creation?: true
  /** Demandé par le MJ automatique (`/api/check`, `auto`) : le jet ne rapporte pas d'XP à lui seul. */
  auto?: AutoAsk
  createdAt: number
  seal: string
}

/** Demande en attente dans la liste `checks` : un test ou des jets. */
export type GmRequest = CheckRequest | RollsRequest

/** Résultat de jets demandés, joint au lancer inscrit dans l'historique. */
export type RollsOutcome = {
  results: number[]
  levelUp: boolean
  /** Ce que chaque dé fait monter ; sans liste, `LEVEL_UP_TARGETS` (anciens jets). */
  targets?: string[]
  reason?: string
}

/** Intitulé d'un dé de montée de niveau dans `lib/translations.ts`. */
export const levelUpLabel = (i: number, targets: readonly string[] = LEVEL_UP_TARGETS) => {
  const key = targets[i] ?? ''
  return key === 'pv' ? 'hp' : checkStatLabel(key)
}

export const signedMod = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n)}`

/** Place la caractéristique dans le texte, avec l'élision française : « test d'Intelligence ». */
export const withStat = (text: string, stat: string) =>
  text.replace('{stat}', stat).replace(/(^|\s)de ([AEIOUYÉÈÊ])/, "$1d'$2")

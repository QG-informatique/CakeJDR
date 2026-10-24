/**
 * Règles d'un test, au-delà du dé et du seuil (`lib/gameSystems.ts`).
 *
 * Un système peut additionner plusieurs dés (2D6, 3D6), compter les
 * réussites d'une réserve de dés (un dé réussit à partir d'une face), faire
 * exploser les dés au maximum, lancer le dé de la caractéristique avec un dé
 * joker, et lire des paliers : réussite partielle, critique, majeure ou
 * extrême, échec critique. L'avantage fait lancer un dé de plus et garder les
 * meilleurs.
 *
 * Le serveur scelle ces règles avec la demande (`RollSpec`) et calcule le
 * résultat ici (`evaluate`), à partir des faces posées sur la table.
 *
 * Les aventures du MJ automatique sont écrites à l'échelle du d20 (une
 * difficulté de 10 est normale, 15 difficile) : `fromD20` les traduit dans
 * les règles de la table, et `d20Equivalent` fait l'inverse pour comparer les
 * héros entre eux.
 */
import type { GameSystem } from './gameSystems'
import type { TranslationKey } from './translations'

/** Ce qu'un système ajoute aux tests (`GameSystem.check`). */
export type CheckExtras = {
  /** Dés lancés et additionnés (2 pour 2D6) ; sans valeur, un seul. */
  count?: number
  /** Réserve de dés : chaque dé à partir de cette face est une réussite. */
  pool?: number
  /** Un dé au maximum est relancé, et le nouveau jet s'ajoute. */
  explode?: boolean
  /** La valeur de la caractéristique est le dé à lancer (D4 à D12). */
  statDie?: boolean
  /** Dé joker lancé en plus du dé de caractéristique : on garde le meilleur. */
  wild?: number
  /** Réussite partielle : de la difficulté moins cet écart jusqu'à la difficulté. */
  partial?: number
  /** Écart qui fait une réussite critique au-dessus, un échec critique en dessous. */
  margin?: number
  /** Test de pourcentage : réussites critique, extrême et majeure, échec critique. */
  degrees?: boolean
  /** Le MJ peut donner l'avantage ou le désavantage. */
  advantage?: boolean
}

export type CheckMode = 'over' | 'under' | 'pool'

export type CheckRules = {
  die: number
  count: number
  mode: CheckMode
  /** Réserve de dés : face minimale d'une réussite. */
  target: number
  explode: boolean
  statDie: boolean
  wild: number
  partial: number
  margin: number
  degrees: boolean
  advantage: boolean
}

/** Bornes acceptées par le serveur. */
export const CHECK_COUNT_MAX = 5
export const POOL_DICE_MAX = 15
export const POOL_SUCCESS_MAX = 10
export const EXPLODE_MAX = 10
const THRESHOLD_MAX = 200
const MOD_RANGE = 30

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export function checkRules(system: GameSystem): CheckRules {
  const x = system.check ?? {}
  const pool = x.pool && x.pool >= 2 && x.pool <= system.checkDie ? x.pool : 0
  return {
    die: system.checkDie,
    count: pool ? 1 : clamp(Math.round(x.count ?? 1), 1, CHECK_COUNT_MAX),
    mode: pool ? 'pool' : system.rollUnder ? 'under' : 'over',
    target: pool,
    explode: !!x.explode,
    statDie: !pool && !system.rollUnder && !!x.statDie,
    wild: !pool && x.wild ? x.wild : 0,
    partial: !pool && !system.rollUnder ? Math.max(0, Math.round(x.partial ?? 0)) : 0,
    margin: Math.max(0, Math.round(x.margin ?? 0)),
    degrees: system.rollUnder && !!x.degrees,
    advantage: !pool && !!x.advantage,
  }
}

/** Difficulté la plus haute : assez pour plusieurs dés et un bon modificateur. */
export function dcMax(r: CheckRules): number {
  if (r.mode === 'pool') return POOL_SUCCESS_MAX
  if (r.mode === 'under') return THRESHOLD_MAX
  return clamp(r.count * r.die + MOD_RANGE, 60, THRESHOLD_MAX)
}

/**
 * Règles scellées avec une demande de test, et jointes au résultat. Absentes
 * pour un test simple (un dé, sans palier) : les anciennes demandes restent
 * valables.
 */
export type RollSpec = {
  count?: number
  pool?: number
  explode?: true
  /** Avantage (1) ou désavantage (-1) : un dé de plus, on garde les meilleurs ou les pires. */
  adv?: 1 | -1
  wild?: number
  partial?: number
  margin?: number
  degrees?: true
}

/** Les règles d'un test à sceller ; rien pour un test simple. */
export function rollSpec(r: CheckRules, adv: 0 | 1 | -1 = 0): RollSpec | undefined {
  const spec: RollSpec = {
    ...(r.count > 1 ? { count: r.count } : {}),
    ...(r.target ? { pool: r.target } : {}),
    ...(r.explode ? { explode: true as const } : {}),
    ...(adv && r.advantage ? { adv } : {}),
    ...(r.wild ? { wild: r.wild } : {}),
    ...(r.partial ? { partial: r.partial } : {}),
    ...(r.margin ? { margin: r.margin } : {}),
    ...(r.degrees ? { degrees: true as const } : {}),
  }
  return Object.keys(spec).length > 0 ? spec : undefined
}

/**
 * Les dés à lancer pour un test : la réserve entière (le modificateur en
 * donne la taille), ou les dés additionnés, un de plus avec l'avantage, et le
 * dé joker en dernier.
 */
export function checkDiceList(c: { dice?: number; mod: number; roll?: RollSpec }): number[] {
  const die = c.dice ?? 20
  const r = c.roll
  if (r?.pool) return Array<number>(clamp(c.mod, 1, POOL_DICE_MAX)).fill(die)
  const n = (r?.count ?? 1) + (r?.adv ? 1 : 0)
  return [...Array<number>(n).fill(die), ...(r?.wild ? [r.wild] : [])]
}

/** Palier d'un résultat, quand il sort de la simple réussite ou du simple échec. */
export type CheckTier = 'critical' | 'extreme' | 'hard' | 'partial' | 'fumble'

export const TIER_LABELS: Record<CheckTier, TranslationKey> = {
  critical: 'tierCritical',
  extreme: 'tierExtreme',
  hard: 'tierHard',
  partial: 'tierPartial',
  fumble: 'tierFumble',
}

export type Evaluated = {
  /** Le dé gardé, la somme des dés gardés, ou le nombre de réussites d'une réserve. */
  result: number
  total: number
  success: boolean
  tier?: CheckTier
  /** Dés relancés par l'explosion, tirés par le serveur. */
  extra?: number[]
}

/**
 * Résultat d'un test à partir des faces posées. `rand(n)` tire un dé de
 * `n` faces pour les dés qui explosent.
 */
export function evaluate(
  c: { dice?: number; mod: number; dc: number; under?: boolean; roll?: RollSpec },
  faces: readonly number[],
  rand: (sides: number) => number,
): Evaluated {
  const die = c.dice ?? 20
  const r = c.roll ?? {}
  const extra: number[] = []
  const more = () => (extra.length > 0 ? { extra } : {})

  if (r.pool) {
    const all = [...faces]
    if (r.explode) {
      for (let i = 0; i < all.length && extra.length < EXPLODE_MAX; i += 1) {
        if (all[i] !== die) continue
        const f = rand(die)
        extra.push(f)
        all.push(f)
      }
    }
    const hits = all.filter((f) => f >= r.pool!).length
    const ones = faces.filter((f) => f === 1).length
    const success = hits >= c.dc
    let tier: CheckTier | undefined
    if (success && r.margin && hits >= c.dc + r.margin) tier = 'critical'
    // Aucune réussite et au moins la moitié de 1 : la catastrophe.
    if (!success && hits === 0 && ones * 2 >= faces.length) tier = 'fumble'
    return { result: hits, total: hits, success, ...(tier ? { tier } : {}), ...more() }
  }

  const chain = (face: number, sides: number) => {
    let sum = face
    let last = face
    while (r.explode && last === sides && sides > 1 && extra.length < EXPLODE_MAX) {
      last = rand(sides)
      extra.push(last)
      sum += last
    }
    return sum
  }
  const n = r.count ?? 1
  const main = faces.slice(0, n + (r.adv ? 1 : 0)).map((f) => chain(f, die))
  const wildFace = r.wild ? faces[faces.length - 1] : undefined
  const wildValue = r.wild && wildFace !== undefined ? chain(wildFace, r.wild) : undefined
  // Sous un seuil, le meilleur dé est le plus bas.
  const keepLow = c.under ? r.adv === 1 : r.adv === -1
  const kept = r.adv ? [...main].sort((a, b) => (keepLow ? a - b : b - a)).slice(0, n) : main
  let result = kept.reduce((a, b) => a + b, 0)
  if (wildValue !== undefined) result = c.under ? Math.min(result, wildValue) : Math.max(result, wildValue)
  const total = result + c.mod
  // Un D20 ou un D100 seul : le 20 naturel et le 1 naturel comptent.
  const natural = n === 1 && !r.wild && !r.explode && die >= 20
  let tier: CheckTier | undefined

  if (c.under) {
    const success = total <= c.dc
    if (r.degrees && die === 100 && n === 1) {
      if (success) {
        tier = total <= Math.max(1, Math.round(c.dc / 20)) ? 'critical' : total <= Math.floor(c.dc / 5) ? 'extreme' : total <= Math.floor(c.dc / 2) ? 'hard' : undefined
      } else if (total >= 100 || (c.dc < 50 && total >= 96)) tier = 'fumble'
    } else if (success) {
      if ((r.margin && total <= c.dc - r.margin) || (natural && result === 1)) tier = 'critical'
    } else if ((r.margin && total >= c.dc + r.margin) || (natural && result === die)) tier = 'fumble'
    return { result, total, success, ...(tier ? { tier } : {}), ...more() }
  }

  const partial = r.partial ?? 0
  const success = total >= c.dc - partial
  if (success) {
    if (total < c.dc) tier = 'partial'
    else if ((r.margin && total >= c.dc + r.margin) || (natural && result === die)) tier = 'critical'
  } else if (
    (r.margin && total <= c.dc - partial - r.margin) ||
    (natural && result === 1) ||
    (r.wild && faces.every((f) => f === 1))
  ) tier = 'fumble'
  return { result, total, success, ...(tier ? { tier } : {}), ...more() }
}

/** Écart d'un point de d20 dans l'échelle du système : la plage du jet sur celle du d20. */
const scale = (r: CheckRules) => (r.statDie ? 5 : r.count * (r.die - 1)) / 19

/**
 * Un test écrit pour le d20 (bonus d'action et difficulté), traduit dans les
 * règles de la table. `sysMod` est ce que la fiche donne au test dans ce
 * système : le modificateur, le seuil en %, la taille de la réserve, ou le dé
 * de la caractéristique. Sur un D20 seul, rien ne change.
 */
export function fromD20(r: CheckRules, sysMod: number, bonus: number, dc: number): { mod: number; dc: number } {
  const k = scale(r)
  const b = Math.round(bonus * k)
  if (r.mode === 'pool') {
    return { mod: clamp(sysMod + Math.round(bonus / 2), 1, POOL_DICE_MAX), dc: clamp(Math.round(1 + (dc - 10) / 5), 1, 5) }
  }
  // Sous un seuil, une difficulté de 10 laisse le seuil de la fiche.
  if (r.mode === 'under') return { mod: 0, dc: clamp(sysMod - Math.round((dc - 10) * k) + b, 1, THRESHOLD_MAX) }
  // La réussite partielle commence où la réussite du d20 commençait. Avec un
  // dé par caractéristique, un test normal demande 4 (Savage Worlds).
  const need = (r.statDie ? Math.round(4 + (dc - 10) * k) : Math.round(r.count + (dc - 1) * k)) + r.partial
  return { mod: clamp((r.statDie ? 0 : sysMod) + b, -MOD_RANGE, MOD_RANGE), dc: clamp(need, 1, dcMax(r)) }
}

/** Ce que la fiche donne au test, ramené à un modificateur de d20 : pour comparer les héros. */
export function d20Equivalent(r: CheckRules, sysMod: number): number {
  let m: number
  if (r.mode === 'pool') m = 2 * (sysMod - 3)
  else if (r.statDie) m = Math.round((sysMod - 6) / 2)
  else if (r.mode === 'under') m = Math.round((20 * (sysMod - r.count)) / (r.count * (r.die - 1)) - 10)
  else m = Math.round(sysMod / scale(r))
  return clamp(m, -MOD_RANGE, MOD_RANGE) || 0
}

/** Vrai si le système lance un seul D20 au-dessus d'une difficulté : les règles d'origine des aventures. */
export const plainD20 = (r: CheckRules) => r.mode === 'over' && r.die === 20 && r.count === 1 && !r.statDie

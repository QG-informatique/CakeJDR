import { DICE_TYPES } from './dicePayload'

/**
 * Lancer de plusieurs dés, de types mélangés : `dice[i]` est le type du dé
 * dont le résultat est `results[i]`.
 *
 * Sur la table 3D (`components/dice/DiceBoxTable.tsx`), un D100 se lance
 * comme à une vraie table : un dé des dizaines (00 à 90) et un D10 des
 * unités, 00 et 0 faisant 100. Ici, un D100 reste un seul dé de 1 à 100.
 */
export type DicePool = { dice: number[]; results: number[] }

/** Dés lancés d'un coup au plus. */
export const POOL_MAX = 20

export const isDiceType = (v: unknown): v is number =>
  typeof v === 'number' && (DICE_TYPES as readonly number[]).includes(v)

/** Résultats plausibles pour ces dés : un entier entre 1 et le nombre de faces. */
export const validResults = (dice: number[], results: unknown): results is number[] =>
  Array.isArray(results) &&
  results.length === dice.length &&
  results.every((v, i) => Number.isInteger(v) && v >= 1 && v <= (dice[i] ?? 0))

/** Dés rangés par type croissant, comme les lance la table. */
export const sortDice = (dice: number[]) => [...dice].sort((a, b) => a - b)

/** « 2D6 + D20 ». */
export function poolLabel(dice: number[]) {
  const counts = new Map<number, number>()
  for (const d of sortDice(dice)) counts.set(d, (counts.get(d) ?? 0) + 1)
  return Array.from(counts, ([d, n]) => `${n > 1 ? n : ''}D${d}`).join(' + ')
}

/** Dés physiques d'une table 3D, et comment retrouver le résultat de chaque dé. */
export type BoxRoll = {
  /** Notation de dice-box-threejs : « 2d6+1d20 », suivie de « @3,5,17 » pour imposer les faces. */
  notation: string
  /** Résultat de chaque dé à partir des faces des dés physiques, dans l'ordre de la table. */
  read: (faces: number[]) => number[]
  /** Pour chaque dé physique, l'indice du dé qu'il représente. */
  owners: number[]
}

/**
 * Traduit des dés en dés physiques. La table regroupe les dés par type, dans
 * l'ordre de la notation : on écrit chaque type une seule fois, D10 des
 * unités compris, pour savoir quel dé physique est lequel.
 */
export function boxRoll(dice: number[], results?: number[]): BoxRoll {
  const order = dice.map((d, i) => ({ d, i })).sort((a, b) => a.d - b.d)
  const tens = order.filter((o) => o.d === 100)
  // Dés physiques par type : [index du dé, rôle].
  const slots = new Map<number, Array<{ i: number; part: 'whole' | 'units' | 'tens' }>>()
  const push = (type: number, i: number, part: 'whole' | 'units' | 'tens') => {
    const list = slots.get(type) ?? []
    list.push({ i, part })
    slots.set(type, list)
  }
  for (const o of order) if (o.d !== 100) push(o.d, o.i, 'whole')
  for (const o of tens) push(10, o.i, 'units')
  for (const o of tens) push(100, o.i, 'tens')
  const types = Array.from(slots.keys()).sort((a, b) => a - b)
  const physical = types.flatMap((type) => (slots.get(type) ?? []).map((s) => ({ type, ...s })))

  let notation = types.map((type) => `${slots.get(type)?.length ?? 0}d${type}`).join('+')
  if (results) {
    const faces = physical.map(({ i, part }) => {
      const v = results[i] ?? 1
      if (part === 'units') return v % 10 === 0 ? 10 : v % 10
      if (part === 'tens') return v % 100 < 10 ? 100 : Math.floor((v % 100) / 10) * 10
      return v
    })
    notation += `@${faces.join(',')}`
  }

  const read = (faces: number[]) => {
    const out = dice.map(() => 1)
    const units = new Map<number, number>()
    physical.forEach(({ i, part }, k) => {
      const f = faces[k] ?? 1
      if (part === 'units') units.set(i, f % 10)
      else if (part === 'tens') out[i] = (f % 100) + (units.get(i) ?? 0) || 100
      else out[i] = f
    })
    return out
  }
  return { notation, read, owners: physical.map((p) => p.i) }
}

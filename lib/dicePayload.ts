import type { CheckOutcome, RollsOutcome } from './checks'
import type { DicePool } from './dicePool'

/** Faces proposées par le lanceur de dés. */
export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const

/** Délai entre le lancer et l'affichage du résultat, quand le lanceur ne donne pas la durée de ses dés. */
export const DICE_REVEAL_DELAY_MS = 3000
/** Au-delà, la table pose les dés d'office. */
export const DICE_MAX_ROLL_MS = 10_000

/**
 * Départ des dés sur la table du lanceur : chaque navigateur rejoue le même
 * lancer à partir de la même graine (même côté, même force), en imposant les
 * faces du résultat.
 */
export type DiceThrow = { seed: number; w: number; h: number }

export type SignedDiceRoll = {
  id: string
  player: string
  /** Type du dé ; pour plusieurs dés libres, celui du premier (`pool` les détaille). */
  dice: number
  /** Le dé, ou la somme des dés. */
  result: number
  /** Moment où le résultat s'affiche, c'est-à-dire quand les dés se posent. */
  ts: number
  /** Test demandé par le MJ : le jet est alors un D20 comparé à une difficulté. */
  check?: CheckOutcome
  /** Jets demandés par le MJ : `result` est alors la somme des dés. */
  rolls?: RollsOutcome
  /** Plusieurs dés lancés librement, de types mélangés. */
  pool?: DicePool
  sig: string
  /** Départ des dés, rejoué par chaque navigateur. Hors signature : il ne change pas le résultat. */
  throw?: DiceThrow
}

/**
 * Moment où le résultat s'affiche : quand les dés se posent chez le lanceur,
 * d'après la durée qu'il annonce (bornée), un peu avant pour couvrir le trajet
 * jusqu'au serveur.
 */
export function revealAt(ms: unknown, now = Date.now()) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return now + DICE_REVEAL_DELAY_MS
  return now + Math.min(DICE_MAX_ROLL_MS, Math.max(0, ms - 150))
}

export function parseDiceThrow(value: unknown): DiceThrow | null {
  if (!value || typeof value !== 'object') return null
  const { seed, w, h } = value as Record<string, unknown>
  const ok = (v: unknown, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
  if (!ok(seed, 0xffffffff) || !Number.isInteger(seed) || !ok(w, 10_000) || !ok(h, 10_000)) return null
  return { seed, w: Math.round(w), h: Math.round(h) }
}

/** Texte signé par le serveur et vérifié par chaque navigateur : les deux doivent l'écrire à l'identique. */
export function diceSignedPayload(roomId: string, roll: Omit<SignedDiceRoll, 'sig'>) {
  const base = [roomId, roll.id, roll.player, roll.dice, roll.result, roll.ts]
  // Un lancer simple garde le texte d'avant : ses anciennes signatures restent valables.
  if (roll.pool) return JSON.stringify([...base, 'pool', roll.pool.dice, roll.pool.results])
  if (roll.rolls) {
    const r = roll.rolls
    return JSON.stringify([...base, 'rolls', r.results, r.levelUp, r.reason ?? ''])
  }
  if (!roll.check) return JSON.stringify(base)
  const c = roll.check
  return JSON.stringify([...base, c.stat, c.mod, c.total, c.dc, c.showDc, c.success, c.reason ?? ''])
}

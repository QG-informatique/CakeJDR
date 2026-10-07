import type { CheckOutcome, RollsOutcome } from './checks'
import type { ThrowParams } from './diceThrow'

/** Faces proposées par le lanceur de dés. */
export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const

/** Délai entre le lancer et l'affichage du résultat, quand le lancer n'a pas de geste. */
export const DICE_REVEAL_DELAY_MS = 3000

export type SignedDiceRoll = {
  id: string
  player: string
  dice: number
  result: number
  /** Moment où le résultat s'affiche, c'est-à-dire à la fin de l'animation. */
  ts: number
  /** Test demandé par le MJ : le jet est alors un D20 comparé à une difficulté. */
  check?: CheckOutcome
  /** Jets demandés par le MJ : `result` est alors la somme des dés. */
  rolls?: RollsOutcome
  sig: string
  /** Geste du lanceur, rejoué par chaque navigateur. Hors signature : il ne change pas le résultat. */
  throw?: ThrowParams
}

/** Texte signé par le serveur et vérifié par chaque navigateur : les deux doivent l'écrire à l'identique. */
export function diceSignedPayload(roomId: string, roll: Omit<SignedDiceRoll, 'sig'>) {
  const base = [roomId, roll.id, roll.player, roll.dice, roll.result, roll.ts]
  // Un lancer simple garde le texte d'avant : ses anciennes signatures restent valables.
  if (roll.rolls) {
    const r = roll.rolls
    return JSON.stringify([...base, 'rolls', r.results, r.levelUp, r.reason ?? ''])
  }
  if (!roll.check) return JSON.stringify(base)
  const c = roll.check
  return JSON.stringify([...base, c.stat, c.mod, c.total, c.dc, c.showDc, c.success, c.reason ?? ''])
}

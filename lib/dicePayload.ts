/** Faces proposées par le lanceur de dés. */
export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const

/** Délai entre le lancer et l'affichage du résultat (durée de l'animation). */
export const DICE_REVEAL_DELAY_MS = 3000

export type SignedDiceRoll = {
  id: string
  player: string
  dice: number
  result: number
  /** Moment où le résultat s'affiche, c'est-à-dire à la fin de l'animation. */
  ts: number
  sig: string
}

/** Texte signé par le serveur et vérifié par chaque navigateur : les deux doivent l'écrire à l'identique. */
export function diceSignedPayload(roomId: string, roll: Omit<SignedDiceRoll, 'sig'>) {
  return JSON.stringify([roomId, roll.id, roll.player, roll.dice, roll.result, roll.ts])
}

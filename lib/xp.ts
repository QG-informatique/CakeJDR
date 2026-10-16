import type { Adventure } from './autoGm/types'
import type { Character } from '@/types/character'

/**
 * Expérience : une barre qui se remplit en jouant, et un niveau de plus quand
 * elle est pleine. Elle repart alors de ce qui dépasse.
 *
 * Tout le jeu en donne, pas seulement les combats : chaque jet demandé (un
 * peu même raté), chaque scène traversée avec le MJ automatique, et plus
 * pour un monstre vaincu ou une étape de quête. Le MJ humain en donne aussi
 * à la main depuis son panneau.
 *
 * Chacun ajoute l'XP à sa propre fiche, comme les dégâts des scènes.
 */

/** XP pour passer au niveau suivant, le même à chaque niveau. */
export const XP_PER_LEVEL = 100

export const XP_GAINS = {
  /** Jet demandé par le MJ, réussi ou raté : on apprend aussi de ses échecs. */
  checkSuccess: 10,
  checkFail: 3,
  /** Scène traversée avec le MJ automatique, qu'on s'en sorte en parlant, en ruse ou en combat. */
  scene: 4,
  monster: 25,
  quest: 50,
} as const

/** Ce que le MJ humain donne d'un clic. */
export const XP_GIFTS = [
  { amount: 10, label: 'xpGiftGood' },
  { amount: XP_GAINS.monster, label: 'xpGiftMonster' },
  { amount: XP_GAINS.quest, label: 'xpGiftQuest' },
] as const

/**
 * Ce que paie le MJ automatique, plus bas que les dons du MJ humain : une
 * longue campagne donne environ un niveau par acte (niveau 4 ou 5 à la fin).
 */
export const AUTO_XP = {
  scene: 3,
  monster: 20,
  quest: 45,
} as const

export function xpOf(c: Pick<Character, 'xp'> | null | undefined): number {
  return Math.max(0, Number(c?.xp) || 0)
}

/** La barre est pleine : le héros peut monter de niveau. */
export function levelReady(c: Pick<Character, 'xp'> | null | undefined): boolean {
  return xpOf(c) >= XP_PER_LEVEL
}

export function addXp(c: Character, amount: number): Character {
  return { ...c, xp: xpOf(c) + Math.max(0, Math.round(amount)) }
}

/** Un niveau de plus : la barre perd ce qu'il a coûté. */
export function spendLevel(c: Character): Character {
  return { ...c, niveau: Number(c.niveau) + 1, xp: Math.max(0, xpOf(c) - XP_PER_LEVEL) }
}

/**
 * XP gagnée par chaque héros en arrivant dans une scène du MJ automatique :
 * un peu pour chaque scène, plus après un combat gagné (au tour par tour, ou
 * la scène qui suit la réussite d'un jet de combat) et à chaque étape de la quête (un nouveau
 * chapitre, ou la fin de l'aventure).
 */
export function sceneXp(adventure: Adventure, sceneId: string, fromId?: string): number {
  const scene = adventure.scenes[sceneId]
  if (!scene) return 0
  let xp = AUTO_XP.scene
  const from = fromId ? adventure.scenes[fromId] : undefined
  if (from?.step.kind === 'check' && from.step.action === 'combat' && from.step.success === sceneId) xp += AUTO_XP.monster
  if (from?.step.kind === 'combat' && from.step.victory === sceneId) xp += AUTO_XP.monster
  if (scene.step.kind === 'end' || (from && scene.chapter && from.chapter && scene.chapter !== from.chapter)) xp += AUTO_XP.quest
  return xp
}

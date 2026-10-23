import type { GameSystem } from './gameSystems'
import type { Character } from '@/types/character'

/**
 * Fiche déjà faite qu'un joueur garde pour l'aventure, quand la salle accepte
 * les fiches existantes : le MJ (ou le créateur de la salle, en MJ
 * automatique) la regarde avant qu'elle joue. Clé : `heroCheckKey`.
 */
export type HeroCheck = {
  /** Identifiant Liveblocks du joueur. */
  userId: string
  charId: string
  name: string
  player: string
  level: number
  stats: Record<string, number>
  status: 'pending' | 'ok' | 'refused'
  at: number
}

export const heroCheckKey = (userId: string, charId: string | number) => `${userId}:${charId}`

/** Le meilleur jet possible à la création, dans tous les systèmes (3 D6 gardés, ou 2 D6 + 6). */
const STAT_MAX = 18
/** Au-delà de cette moyenne, les caractéristiques sont bien plus hautes qu'un tirage ordinaire. */
const MEAN_MAX = 15

export function heroCheckOf(userId: string, char: Character, player: string, system: GameSystem): HeroCheck {
  const stats: Record<string, number> = {}
  for (const { key } of system.stats) stats[key] = Number((char as unknown as Record<string, unknown>)[key]) || 0
  return {
    userId,
    charId: String(char.id),
    name: String(char.nom ?? '').trim(),
    player,
    level: Math.max(1, Number(char.niveau) || 1),
    stats,
    status: 'pending',
    at: Date.now(),
  }
}

/** Ce qui mérite un coup d'œil du MJ : niveau de départ, caractéristique ou moyenne trop haute. */
export function heroCheckWarnings(check: HeroCheck): ('level' | 'stat' | 'mean')[] {
  const values = Object.values(check.stats)
  const out: ('level' | 'stat' | 'mean')[] = []
  if (check.level > 1) out.push('level')
  if (values.some((v) => v > STAT_MAX)) out.push('stat')
  if (values.length && values.reduce((a, b) => a + b, 0) / values.length > MEAN_MAX) out.push('mean')
  return out
}

export const HERO_STAT_MAX = STAT_MAX

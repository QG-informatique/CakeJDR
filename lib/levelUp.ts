import { LEVEL_UP_TARGETS } from '@/lib/checks'
import { type Character, normalizeCharacter } from '@/types/character'
import { spendLevel } from '@/lib/xp'

/**
 * Applique une montée de niveau tirée par le serveur : un niveau de plus, le
 * premier dé ajouté aux PV max (et aux PV, sans dépasser le max), puis un dé
 * par caractéristique, dans l'ordre de `LEVEL_UP_TARGETS`. Un système qui ne
 * tire que les PV (`lib/gameSystems.ts`) envoie un seul dé : les
 * caractéristiques restent telles quelles. La barre d'XP paie le niveau.
 */
export function applyLevelUp(character: Character, gains: number[]): Character {
  const c = normalizeCharacter(character)
  const next: Character = spendLevel(c)
  LEVEL_UP_TARGETS.forEach((key, i) => {
    const gain = gains[i] ?? 0
    if (key === 'pv') {
      const max = Number(c.pv_max) + gain
      next.pv_max = max
      next.pv = Math.min(Number(c.pv) + gain, max)
    } else {
      next[key] = Number(c[key]) + gain
    }
  })
  return next
}

import { CUSTOM_STAT_KEY, LEVEL_UP_TARGETS } from '@/lib/checks'
import { type Character, normalizeCharacter } from '@/types/character'
import type { GameSystem } from '@/lib/gameSystems'
import { classOf } from '@/lib/heroCreation'
import { spendLevel } from '@/lib/xp'

/**
 * Ce que montent les dés d'une montée de niveau : les PV, puis, au narratif,
 * deux caractéristiques à tour de rôle dans l'ordre utile à la classe (les
 * deux premières au niveau 2, les deux suivantes au niveau 3…). Sans classe
 * connue, l'ordre de la fiche. Les autres systèmes gardent leur liste.
 */
export function levelUpTargets(system: GameSystem, character: Pick<Character, 'classe' | 'niveau'> | null | undefined): string[] {
  const count = system.levelUpStats
  if (!count) return [...system.levelUp]
  const stats = system.levelUp.filter((k) => k !== 'pv')
  const preferred = classOf(character?.classe)?.priorites.filter((k) => stats.includes(k)) ?? []
  const order = [...preferred, ...stats.filter((k) => !preferred.includes(k))]
  const level = Math.max(1, Math.floor(Number(character?.niveau)) || 1)
  const start = ((level - 1) * count) % order.length
  return ['pv', ...Array.from({ length: Math.min(count, order.length) }, (_, i) => order[(start + i) % order.length]!)]
}

/**
 * Applique une montée de niveau tirée par le serveur : un niveau de plus, le
 * premier dé ajouté aux PV max (et aux PV, sans dépasser le max), puis un dé
 * par caractéristique de `targets` (toutes celles de `LEVEL_UP_TARGETS` pour
 * un ancien jet). Un système qui ne tire que les PV (`lib/gameSystems.ts`)
 * envoie un seul dé. La barre d'XP paie le niveau.
 */
export function applyLevelUp(character: Character, gains: number[], targets: readonly string[] = LEVEL_UP_TARGETS): Character {
  const c = normalizeCharacter(character)
  const next: Character = spendLevel(c)
  targets.forEach((key, i) => {
    const gain = gains[i] ?? 0
    if (key === 'pv') {
      const max = Number(c.pv_max) + gain
      next.pv_max = max
      next.pv = Math.min(Number(c.pv) + gain, max)
    } else if (key in c || CUSTOM_STAT_KEY.test(key)) {
      // Une caractéristique ajoutée dans l'atelier peut être encore vide.
      const stats = next as unknown as Record<string, unknown>
      stats[key] = (Number(stats[key]) || 0) + gain
    }
  })
  return next
}

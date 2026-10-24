/**
 * Les tests du MJ automatique dans les règles de la table.
 *
 * Les aventures (toutes prêtes ou de l'atelier) écrivent leurs tests pour le
 * d20 : une caractéristique ou son rôle, un bonus d'action, une difficulté
 * (10 normal, 15 difficile). La fiche du héros donne ce qu'elle donne dans le
 * système de la table ; `fromD20` traduit le reste. Sur un D20 seul, rien ne
 * change.
 */
import type { Character } from '@/types/character'
import type { CheckStat } from '@/lib/checks'
import { NARRATIF, type GameSystem } from '@/lib/gameSystems'
import { checkRules, d20Equivalent, fromD20 } from '@/lib/checkRules'
import { STAT_ROLES, tableStat } from '@/lib/statRoles'
import { testParts } from '@/lib/modifiers'
import { DICE_TYPES } from '@/lib/dicePayload'

/** Ce que la fiche donne à chaque test du système : la caractéristique (ou compétence), et les états cochés. */
export type SheetTests = Record<string, { base: number; states: number }>

/** Dés d'une caractéristique, pour un système qui en donne un à chacune. */
export const STAT_DICE = DICE_TYPES.filter((d) => d <= 12)

/** Le dé d'une caractéristique d'après sa valeur sur la fiche (4 à 12). */
export const statDieOf = (value: number) => STAT_DICE.find((d) => d >= value) ?? STAT_DICE[STAT_DICE.length - 1]!

export function sheetTests(c: Character | undefined, system: GameSystem = NARRATIF): SheetTests {
  const out: SheetTests = {}
  if (!c) return out
  for (const { key } of [...system.stats, ...(system.skills ?? [])]) out[key] = testParts(c, key as CheckStat, system)
  return out
}

/**
 * Le score de chaque héros ramené au d20, par rôle (force, dextérité…) et par
 * clé du système : pour choisir qui lance, et pour le combat.
 */
export function d20Mods(tests: SheetTests, system: GameSystem = NARRATIF): Record<string, number> {
  const r = checkRules(system)
  const of = (key: string) => {
    const t = tests[key] ?? { base: 0, states: 0 }
    return r.statDie ? d20Equivalent(r, statDieOf(t.base)) + t.states : d20Equivalent(r, t.base + t.states)
  }
  const mods: Record<string, number> = {}
  for (const key of Object.keys(tests)) mods[key] = of(key)
  for (const role of STAT_ROLES) mods[role] ??= of(tableStat(system, role))
  return mods
}

export type TableCheck = {
  /** La caractéristique testée à la table. */
  stat: string
  /** Ce que l'aventure demandait : caractéristique et difficulté sur l'échelle du d20. */
  role: string
  base: number
  mod: number
  dc: number
  /** Le dé de la caractéristique, quand le système en donne un à chacune. */
  die?: number
}

/** Un test de l'aventure (`stat`, `bonus`, `dc` sur l'échelle du d20) pour ce héros, à cette table. */
export function tableCheck(system: GameSystem, tests: SheetTests | undefined, stat: string, bonus: number, dc: number): TableCheck {
  const r = checkRules(system)
  const key = tableStat(system, stat)
  const t = tests?.[key] ?? { base: 0, states: 0 }
  if (r.statDie) {
    const c = fromD20(r, 0, bonus, dc)
    return { stat: key, role: stat, base: dc, mod: Math.max(-30, Math.min(30, c.mod + t.states)), dc: c.dc, die: statDieOf(t.base) }
  }
  const c = fromD20(r, t.base + t.states, bonus, dc)
  return { stat: key, role: stat, base: dc, mod: c.mod, dc: c.dc }
}

/** Le coup critique d'un jet : son palier, ou le 20 naturel d'un ancien jet. */
export const isCrit = (c: { tier?: string; total: number; mod: number }) =>
  c.tier ? c.tier === 'critical' || c.tier === 'extreme' : c.total - c.mod === 20

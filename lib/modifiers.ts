/**
 * D'où vient le modificateur d'une caractéristique.
 *
 * Il s'additionne : la part que donnent les règles de la table selon la
 * valeur, puis le bonus d'équipement inscrit sur la fiche. Chaque part garde
 * son origine, pour que la fiche puisse l'expliquer au survol.
 */
import type { Character } from '@/types/character'
import type { TranslationKey } from './translations'
import type { CheckStat } from './checks'
import { NARRATIF, type GameSystem } from './gameSystems'

/** Règle de la table (`modRule` de son système, `lib/gameSystems.ts`). */
type Rule = {
  /** Nom des règles, montré comme origine du modificateur. */
  label: TranslationKey
  /** Comment la règle se lit, en une ligne. */
  detail: TranslationKey
  mod: (value: number) => number
}

export type ModPart =
  | { kind: 'rules'; value: number; label: TranslationKey; detail: TranslationKey }
  | { kind: 'equipment'; value: number; from: string }

export type StatMod = { value: number; total: number; parts: ModPart[] }

const num = (v: unknown) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : 0
}

/** Modificateur d'une caractéristique, avec le détail de ses origines. */
export function statMod(c: Character, stat: CheckStat, rule: Rule = NARRATIF.modRule): StatMod {
  // Une caractéristique ajoutée dans l'atelier (`s_…`) n'est pas dans le type de la fiche.
  const get = (key: string) => Reflect.get(c, key) as unknown
  const value = num(get(stat))
  const parts: ModPart[] = [{ kind: 'rules', value: rule.mod(value), label: rule.label, detail: rule.detail }]
  const bonus = num(get(`${stat}_bonus`))
  if (bonus !== 0) parts.push({ kind: 'equipment', value: bonus, from: String(get(`${stat}_bonus_from`) ?? '').trim() })
  return { value, total: parts.reduce((sum, p) => sum + p.value, 0), parts }
}

/**
 * Ce que la fiche donne à un test, en deux parts : la caractéristique, ou la
 * compétence (sa valeur, plus le modificateur de sa caractéristique) ; puis
 * les états cochés (blessé, effrayé…), qui changent tous les tests.
 */
export function testParts(c: Character, key: CheckStat, system: GameSystem): { base: number; states: number } {
  const get = (k: string) => Reflect.get(c, k) as unknown
  const skill = system.skills?.find((s) => s.key === key)
  const base = skill
    ? (skill.stat ? statMod(c, skill.stat as CheckStat, system.modRule).total : 0) + num(get(skill.key))
    : statMod(c, key, system.modRule).total
  const states = (system.conditions ?? []).reduce((sum, k) => sum + (get(k.key) === true ? k.mod : 0), 0)
  return { base, states }
}

/** Ce que la fiche donne à un test, états compris. */
export function testMod(c: Character, key: CheckStat, system: GameSystem): number {
  const { base, states } = testParts(c, key, system)
  return base + states
}

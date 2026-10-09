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
import { GAME_SYSTEMS, type GameSystemId } from './gameSystems'

/** Règles de jeu d'une table : celles de son système de jeu (`lib/gameSystems.ts`). */
export type RuleSystem = GameSystemId

type Rule = {
  /** Nom des règles, montré comme origine du modificateur. */
  label: TranslationKey
  /** Comment la règle se lit, en une ligne. */
  detail: TranslationKey
  mod: (value: number) => number
}

export const RULES: Record<RuleSystem, Rule> = {
  narratif: GAME_SYSTEMS.narratif.modRule,
  srd5: GAME_SYSTEMS.srd5.modRule,
  d100: GAME_SYSTEMS.d100.modRule,
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
export function statMod(c: Character, stat: CheckStat, system: RuleSystem = 'narratif'): StatMod {
  const rule = RULES[system]
  const value = num(c[stat])
  const parts: ModPart[] = [{ kind: 'rules', value: rule.mod(value), label: rule.label, detail: rule.detail }]
  const bonus = num(c[`${stat}_bonus`])
  if (bonus !== 0) parts.push({ kind: 'equipment', value: bonus, from: String(c[`${stat}_bonus_from`] ?? '').trim() })
  return { value, total: parts.reduce((sum, p) => sum + p.value, 0), parts }
}

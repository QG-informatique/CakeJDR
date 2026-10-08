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

/**
 * Règles de jeu d'une table. Une seule pour l'instant, le jeu narratif ; les
 * systèmes de jeu à venir (préréglages, règles créées par le MJ) s'ajoutent ici.
 */
export type RuleSystem = 'narratif'

type Rule = {
  /** Nom des règles, montré comme origine du modificateur. */
  label: TranslationKey
  /** Comment la règle se lit, en une ligne. */
  detail: TranslationKey
  mod: (value: number) => number
}

export const RULES: Record<RuleSystem, Rule> = {
  // 10 donne +0, puis ±1 tous les 2 points.
  narratif: { label: 'modRulesNarrator', detail: 'modRulesNarratorDetail', mod: (v) => Math.floor((v - 10) / 2) },
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

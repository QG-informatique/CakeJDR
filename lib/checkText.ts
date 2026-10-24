/**
 * Textes d'un test pour l'invite, le bandeau et le chat : les dés à lancer,
 * puis les faces posées, la somme ou les réussites, et le palier.
 */
import { signedMod, type CheckOutcome } from './checks'
import { TIER_LABELS, type RollSpec } from './checkRules'
import type { TranslationKey } from './translations'

type T = (key: TranslationKey) => string

/** Les dés d'un test : « 2D6 +1 », « D20 (avantage) +3 », « 5 D10 · réussite sur 8+ ». */
export function checkDiceText(c: { dice?: number; mod: number; under?: boolean; roll?: RollSpec }, t: T): string {
  const die = c.dice ?? 20
  const r = c.roll ?? {}
  if (r.pool) {
    return `${c.mod} D${die} · ${t('checkPoolTarget').replace('{n}', String(r.pool))}${r.explode ? ` · ${t('checkExploding')}` : ''}`
  }
  const n = r.count ?? 1
  let s = `${n > 1 ? n : ''}D${die}`
  if (r.adv) s += ` (${t(r.adv > 0 ? 'checkAdvantage' : 'checkDisadvantage')})`
  if (r.wild) s += ` + D${r.wild} ${t('checkWildDie')}`
  if (r.explode) s += ` · ${t('checkExploding')}`
  if (!c.under && c.mod !== 0) s += ` ${signedMod(c.mod)}`
  return s
}

/** Les faces posées, et les dés relancés par l'explosion entre parenthèses. */
function facesText(c: CheckOutcome, result: number): string {
  const extra = c.extra ?? []
  const faces = c.faces ?? [extra.length > 0 ? result - extra.reduce((a, b) => a + b, 0) : result]
  return faces.join(' · ') + (extra.length > 0 ? ` (+${extra.join(', +')})` : '')
}

/**
 * Le détail d'un résultat : « 4 · 6 → 10 +1 = 11 contre 9 », « 8 · 3 · 9 → 2
 * réussites sur 2 », « 37 sous 45 % ». La difficulté seulement si on la montre.
 */
export function checkResultText(c: CheckOutcome, dice: number | undefined, result: number, showDc: boolean, t: T): string {
  const r = c.roll ?? {}
  if (r.pool) {
    return `${facesText(c, result)} → ${c.total} ${t('checkSuccesses')}${showDc ? ` / ${c.dc}` : ''}`
  }
  if (c.under) return `D${dice ?? 100} ${c.total}${showDc ? ` ${t('checkUnder')} ${c.dc} %` : ''}`
  const several = (c.faces?.length ?? 1) > 1 || (c.extra?.length ?? 0) > 0
  const sum = several ? `${facesText(c, result)} → ${result}` : `D${dice ?? 20} ${result}`
  return `${sum} ${signedMod(c.mod)} = ${c.total}${showDc ? ` ${t('checkVs')} ${c.dc}` : ''}`
}

/** Le palier du résultat (« Réussite critique »…), s'il y en a un. */
export const checkTierText = (c: CheckOutcome, t: T): string | null => (c.tier ? t(TIER_LABELS[c.tier]) : null)

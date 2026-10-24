'use client'

// Les compétences testables et les états d'un système de l'atelier, sur la
// fiche : ce que chaque compétence donne au test, et les états cochés, qui
// changent tous les tests.

import type { FC } from 'react'
import { useT } from '@/lib/useT'
import type { Character } from '@/types/character'
import type { GameSystem } from '@/lib/gameSystems'
import { signedMod, type CheckStat } from '@/lib/checks'
import { checkRules } from '@/lib/checkRules'
import { testParts } from '@/lib/modifiers'
import { statDieOf } from '@/lib/autoGm/tableCheck'

/** Ce qu'un test donne, écrit dans les règles de la table : +2, 45 %, 4 D6, D8. */
export function testText(system: GameSystem, n: number): string {
  const r = checkRules(system)
  if (r.mode === 'under') return `${n}${r.die === 100 ? ' %' : ''}`
  if (r.mode === 'pool') return `${Math.max(0, n)} D${r.die}`
  if (r.statDie) return `D${statDieOf(n)}`
  return signedMod(n)
}

export const isChecked = (c: Character, key: string) => Reflect.get(c, key) === true

const SheetTests: FC<{ perso: Character; system: GameSystem }> = ({ perso, system }) => {
  const t = useT()
  const skills = system.skills ?? []
  const conditions = system.conditions ?? []
  if (skills.length === 0 && conditions.length === 0) return null
  const checked = conditions.filter((c) => isChecked(perso, c.key))
  return (
    <>
      {skills.length > 0 && (
        <div>
          <div className="ui-label mb-1">{t('checkSkillsGroup')}</div>
          <div className="ui-well grid grid-cols-2 py-1">
            {skills.map((k) => (
              <div key={k.key} className="flex min-w-0 items-baseline justify-between gap-2 px-2.5 py-1 text-sm">
                <span className="truncate text-ink/65">{t(k.label)}</span>
                <span className="shrink-0 font-semibold tabular-nums">{testText(system, testParts(perso, k.key as CheckStat, system).base)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {conditions.length > 0 && (
        <div>
          <div className="ui-label mb-1">{t('sheetConditions')}</div>
          {checked.length === 0 ? (
            <p className="text-xs text-ink/50">{t('sheetConditionsNone')}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {checked.map((c) => (
                <li key={c.key} className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-xs">
                  {t(c.label)} <span className="tabular-nums text-ink/60">{signedMod(c.mod)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  )
}

export default SheetTests

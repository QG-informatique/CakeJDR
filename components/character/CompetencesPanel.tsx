'use client'

import { FC } from 'react'
import { useT } from '@/lib/useT'
import { type Competence } from '@/types/character'

type Props = {
  competences: Competence[]
  compact?: boolean
}

/** Compétences de la fiche, en lecture : on les modifie dans l'écran d'édition. */
const CompetencesPanel: FC<Props> = ({ competences = [], compact = false }) => {
  const t = useT()
  const damageLabel = t('damageOptional').replace(/ \(.*\)$/, '')

  return (
    <div className="mt-4">
      <div className="ui-label mb-1.5">{t('skills')}</div>
      {competences.length === 0 && <span className="text-ink/55 text-xs">{t('noSkill')}</span>}
      {compact ? (
        <ul className="ui-well divide-y divide-[var(--c-panel-line)]">
          {competences.map((c, idx) => (
            <li
              key={`${c.id}-${idx}`}
              className="flex min-w-0 items-center gap-2 px-2.5 py-1.5 text-sm"
              title={c.effets || undefined}
            >
              <span className="min-w-0 truncate font-semibold">{c.nom}</span>
              {c.type && <span className="shrink-0 text-[11px] text-ink/50">{c.type}</span>}
              {c.degats && <span className="ml-auto shrink-0 tabular-nums text-xs text-ink/70">{c.degats}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-2">
          {competences.map((c, idx) => (
            <div key={`${c.id}-${idx}`} className="ui-well px-3 py-2">
              <div className="flex items-center gap-2 font-semibold leading-snug">
                {c.nom}
                {c.type && <span className="rounded-full border border-[var(--c-panel-line)] px-1.5 py-px text-[10px] font-medium text-ink/60">{c.type}</span>}
              </div>
              {c.effets && <div className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-ink/70">{c.effets}</div>}
              {c.degats && <div className="mt-0.5 text-xs text-ink/70">{damageLabel} : <span className="font-semibold text-ink">{c.degats}</span></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CompetencesPanel

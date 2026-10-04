'use client'

import { FC } from 'react'
import { useT } from '@/lib/useT'
import type { TranslationKey } from '@/lib/translations'
import { type Character } from '@/types/character'

// Bourse : affichée avec l'équipement.
const SHORT_FIELDS: Array<[keyof Character, TranslationKey]> = [
  ['race', 'race'],
  ['classe', 'class'],
  ['sexe', 'gender'],
  ['age', 'age'],
  ['taille', 'height'],
  ['poids', 'weight'],
]
const LONG_FIELDS: Array<[keyof Character, TranslationKey]> = [
  ['capacite_raciale', 'racialAbility'],
  ['traits', 'traits'],
  ['ideal', 'ideal'],
  ['obligations', 'bonds'],
  ['failles', 'flaws'],
  ['avantages', 'features'],
  ['background', 'background'],
]

const text = (v: unknown) => (v === undefined || v === null ? '' : String(v)).trim()

/**
 * Description du personnage, en lecture. Compact : une ligne par champ
 * rempli ; complet : tout le texte.
 */
const DescriptionPanel: FC<{ perso: Character; compact?: boolean }> = ({ perso, compact = false }) => {
  const t = useT()
  const short = SHORT_FIELDS.map(([k, l]) => ({ key: k, label: t(l), value: text(perso[k]) }))
  const long = [
    ...LONG_FIELDS.map(([k, l]) => ({ key: String(k), label: t(l), value: text(perso[k]) })),
    ...(perso.champs_perso || []).map((f) => ({ key: f.id, label: f.label, value: text(f.value) })),
  ].filter((f) => f.value)

  return (
    <div className="flex flex-col gap-4">
      <dl className="ui-well grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2 text-sm">
        {short.map((f) => (
          <div key={String(f.key)} className="flex min-w-0 items-baseline gap-1.5">
            <dt className="shrink-0 text-ink/60">{f.label}</dt>
            <dd className="min-w-0 truncate font-semibold" title={f.value}>{f.value || '—'}</dd>
          </div>
        ))}
      </dl>

      {long.length === 0 && <span className="text-xs text-ink/55">{t('noCustomField')}</span>}
      {compact ? (
        <dl className="ui-well divide-y divide-[var(--c-panel-line)] text-sm">
          {long.map((f) => (
            <div key={f.key} className="flex min-w-0 items-baseline gap-2 px-2.5 py-1.5">
              <dt className="shrink-0 text-ink/60">{f.label}</dt>
              <dd className="min-w-0 truncate" title={f.value}>{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="flex flex-col gap-2">
          {long.map((f) => (
            <div key={f.key} className="ui-well px-3 py-2">
              <dt className="ui-label !text-[10px]">{f.label}</dt>
              <dd className="mt-0.5 whitespace-pre-line break-words text-sm leading-relaxed">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default DescriptionPanel

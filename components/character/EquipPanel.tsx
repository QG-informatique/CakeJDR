'use client'

import { FC } from 'react'
import { useT } from '@/lib/useT'
import { type Character } from '@/types/character'

type Props = {
  perso: Character
  compact?: boolean
}

/** Équipement de la fiche, en lecture : on le modifie dans l'écran d'édition. */
const EquipPanel: FC<Props> = ({ perso, compact = false }) => {
  const t = useT()
  const objets = perso.objets || []
  const gear = [
    { label: t('weapons'), value: perso.armes, extra: perso.degats_armes, extraLabel: t('weaponDamage') },
    { label: t('armor'), value: perso.armure, extra: perso.modif_armure, extraLabel: t('armorMod') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="ui-label mb-1.5">{t('weaponsArmor')}</div>
        {compact ? (
          <ul className="ui-well divide-y divide-[var(--c-panel-line)]">
            {gear.map(g => (
              <li key={g.label} className="flex min-w-0 items-baseline gap-2 px-2.5 py-1.5 text-sm">
                <span className="shrink-0 text-ink/65">{g.label}</span>
                <span className="min-w-0 truncate font-semibold">{g.value || '—'}</span>
                {g.extra !== undefined && g.extra !== '' && (
                  <span className="ml-auto shrink-0 tabular-nums text-xs text-ink/70" title={g.extraLabel}>{g.extra}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-2">
            {gear.map(g => (
              <div key={g.label} className="ui-well px-3 py-2">
                <div className="ui-label !text-[10px]">{g.label}</div>
                <div className="font-semibold">{g.value || '—'}</div>
                {g.extra !== undefined && g.extra !== '' && (
                  <div className="text-xs text-ink/70">{g.extraLabel} : <span className="font-semibold text-ink">{g.extra}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="ui-label mb-1.5">{t('items')}</div>
        {objets.length === 0 ? (
          <span className="text-ink/55 text-xs">{t('noItems')}</span>
        ) : (
          <ul className={compact ? 'ui-well divide-y divide-[var(--c-panel-line)]' : 'flex flex-col gap-1.5'}>
            {objets.map((o) => (
              <li
                key={o.id}
                className={`flex min-w-0 items-center gap-2 px-2.5 ${compact ? 'py-1 text-sm' : 'ui-well py-2'}`}
              >
                <span className="min-w-0 truncate">{o.nom}</span>
                <span className="ml-auto shrink-0 tabular-nums text-xs text-ink/70">×{o.quantite}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {perso.bourse !== undefined && perso.bourse !== '' && (
        <div className="ui-well flex items-baseline justify-between px-3 py-2 text-sm">
          <span className="text-ink/65">{t('purse')}</span>
          <span className="font-semibold tabular-nums">{perso.bourse}</span>
        </div>
      )}
    </div>
  )
}

export default EquipPanel

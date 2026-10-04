import { FC } from 'react'
import { useT } from '@/lib/useT'
import {
  type Character,
  type CharacterChangeHandler,
} from '@/types/character'
import type { TranslationKey } from '@/lib/translations'

const STATS = [
  { key: 'force', label: 'strength' },
  { key: 'dexterite', label: 'dexterity' },
  { key: 'constitution', label: 'constitution' },
  { key: 'intelligence', label: 'intelligence' },
  { key: 'sagesse', label: 'wisdom' },
  { key: 'charisme', label: 'charisma' }
] as const
const ATTACKS = [
  { key: 'mod_contact', label: 'melee' },
  { key: 'mod_distance', label: 'ranged' },
  { key: 'mod_magique', label: 'magic' }
] as const
const BASICS = [
  { key: 'defense', label: 'defense' },
  { key: 'chance', label: 'luck' },
  { key: 'initiative', label: 'initiative' },
] as const

// Couleur de la valeur d'une caractéristique : on lit d'un coup d'œil les
// points forts (vert, or) et les faiblesses (orange, rouge).
const getStatColor = (value: number) => {
  if (value >= 18) return 'text-yellow-300'
  if (value >= 14) return 'text-emerald-300'
  if (value >= 10) return 'text-ink'
  if (value >= 6) return 'text-amber-300'
  return 'text-red-400'
}

const getPvColor = (pv: number, pvMax: number) => {
  if (!pvMax) return 'bg-ink/30'
  const ratio = pv / pvMax
  if (ratio > 0.7) return 'bg-emerald-500'
  if (ratio > 0.3) return 'bg-amber-500'
  return 'bg-red-500'
}

const fieldClass =
  'w-full min-w-0 rounded-md bg-field border px-1.5 py-0.5 text-sm text-field-ink text-center'

/** Case d'une valeur : petit intitulé, grand chiffre. */
const Tile: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="ui-well flex min-w-0 flex-col items-center gap-0.5 px-1.5 py-2">
    <span className="ui-label !text-[10px] w-full truncate text-center" title={label}>{label}</span>
    {children}
  </div>
)

type Props = {
  edit: boolean
  perso: Character
  onChange: CharacterChangeHandler
}

const StatsPanel: FC<Props> = ({ edit, perso, onChange }) => {
  const pvActuel = Number(perso.pv) || 0
  const pvMax = Number(perso.pv_max ?? perso.pvMax ?? perso.pv) || pvActuel
  const pvRatio = pvMax ? Math.max(0, Math.min(1, pvActuel / pvMax)) : 0
  const t = useT()

  return (
    <div className="flex flex-col gap-4">
      {/* Identité : nom et niveau */}
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <div className="ui-label mb-0.5">{t('name')}</div>
          {edit
            ? <input value={perso.nom || ''} onChange={e => onChange('nom', e.target.value)} className={`${fieldClass} !text-left !text-base font-semibold`} />
            : <div className="truncate text-xl font-bold leading-tight">{perso.nom || t('unnamed')}</div>
          }
        </div>
        <div className="w-20 shrink-0 text-right">
          <div className="ui-label mb-0.5">{t('level')}</div>
          {edit
            ? <input type="text" value={perso.niveau || ''} onChange={e => onChange('niveau', e.target.value)} className={fieldClass} />
            : <div className="text-xl font-bold leading-tight tabular-nums">{perso.niveau}</div>
          }
        </div>
      </div>

      {/* Points de vie */}
      <div className="ui-well px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="ui-label">{t('hp')}</span>
          {edit
            ? (
              <span className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={perso.pv ?? ''}
                  onChange={e => onChange('pv', e.target.value)}
                  className={`${fieldClass} !w-16`}
                  placeholder={t('hp')}
                />
                <span className="text-ink/50 font-bold">/</span>
                <input
                  type="number"
                  min={0}
                  value={perso.pv_max ?? perso.pvMax ?? ''}
                  onChange={e => onChange('pv_max', e.target.value)}
                  className={`${fieldClass} !w-16`}
                  placeholder={t('max')}
                />
              </span>
            )
            : (
              <span className="tabular-nums">
                <span className="text-2xl font-bold">{pvActuel}</span>
                <span className="text-sm text-ink/55"> / {pvMax}</span>
              </span>
            )}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${getPvColor(pvActuel, pvMax)}`}
            style={{ width: `${pvRatio * 100}%` }}
          />
        </div>
      </div>

      {/* Défense, chance, initiative */}
      <div className="grid grid-cols-3 gap-2">
        {BASICS.map(b => (
          <Tile key={b.key} label={t(b.label as TranslationKey)}>
            {edit
              ? <input type="text" value={perso[b.key] || ''} onChange={e => onChange(b.key, e.target.value)} className={fieldClass} />
              : <span className="text-lg font-bold tabular-nums">{perso[b.key]}</span>
            }
          </Tile>
        ))}
      </div>

      {/* Caractéristiques et modificateurs */}
      <div>
        <div className="ui-label mb-1.5">{t('attributes')}</div>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map(stat => {
            const statValue = Number(perso[stat.key] ?? 0)
            const modValue = Number(
              (perso as Record<string, unknown>)[`${stat.key}_mod`] ?? 0,
            )
            return (
              <Tile key={stat.key} label={t(stat.label as TranslationKey)}>
                {edit
                  ? (
                    <span className="flex w-full items-center gap-1">
                      <input type="text" value={perso[stat.key] ?? ''} onChange={e => onChange(stat.key, e.target.value)} className={fieldClass} aria-label={t(stat.label as TranslationKey)} />
                      <input type="text" value={perso[`${stat.key}_mod`] ?? ''} onChange={e => onChange(`${stat.key}_mod`, e.target.value)} className={fieldClass} placeholder={t('mod')} aria-label={`${t(stat.label as TranslationKey)} — ${t('mod')}`} />
                    </span>
                  )
                  : (
                    <span className="flex items-baseline gap-1.5 tabular-nums">
                      <span className={`text-xl font-bold ${getStatColor(statValue)}`}>{statValue}</span>
                      <span className="text-xs font-semibold text-ink/55">{modValue >= 0 ? '+' : ''}{modValue}</span>
                    </span>
                  )}
              </Tile>
            )
          })}
        </div>
      </div>

      {/* Modificateurs d'attaque */}
      <div>
        <div className="ui-label mb-1.5">{t('attackMods')}</div>
        <div className="grid grid-cols-3 gap-2">
          {ATTACKS.map(att => (
            <Tile key={att.key} label={t(att.label as TranslationKey)}>
              {edit
                ? <input type="text" value={perso[att.key] ?? ''} onChange={e => onChange(att.key, e.target.value)} className={fieldClass} />
                : <span className="text-lg font-bold tabular-nums">{perso[att.key] ?? 0}</span>
              }
            </Tile>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel

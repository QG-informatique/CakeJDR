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

const getStatColor = (value: number) => {
  if (value >= 18) return 'bg-yellow-400 text-black'
  if (value >= 14) return 'bg-green-500 text-white'
  if (value >= 10) return 'bg-green-300 text-black'
  if (value >= 6) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

const getPvColor = (pv: number, pvMax: number) => {
  if (!pvMax) return 'bg-gray-500 text-white'
  const ratio = pv / pvMax
  if (ratio > 0.7) return 'bg-green-500 text-white'
  if (ratio > 0.3) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

type Props = {
  edit: boolean
  perso: Character
  onChange: CharacterChangeHandler
}

const StatsPanel: FC<Props> = ({ edit, perso, onChange }) => {
  const pvActuel = Number(perso.pv) || 0
  const pvMax = Number(perso.pv_max ?? perso.pvMax ?? perso.pv) || pvActuel
  const t = useT()

  return (
    <div>
      {/* Name top right above HP */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center">
            <strong className="w-20">{t('level')}:</strong>
            {edit
              ? <input type="text" value={perso.niveau || ''} onChange={e => onChange('niveau', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.niveau}</span>
            }
          </div>
          <div className="flex items-center">
            <strong className="w-20">{t('defense')}:</strong>
            {edit
              ? <input type="text" value={perso.defense || ''} onChange={e => onChange('defense', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.defense}</span>
            }
          </div>
          <div className="flex items-center">
            <strong className="w-20">{t('luck')}:</strong>
            {edit
              ? <input type="text" value={perso.chance || ''} onChange={e => onChange('chance', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.chance}</span>
            }
          </div>
          <div className="flex items-center">
            <strong className="w-20">{t('initiative')}:</strong>
            {edit
              ? <input type="text" value={perso.initiative || ''} onChange={e => onChange('initiative', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black" />
              : <span className="ml-1 text-sm">{perso.initiative}</span>
            }
          </div>
        </div>
        <div className="flex flex-col items-center ml-4">
          <div className="flex items-center mb-1">
            <span className="text-sm text-gray-400 mr-2">{t('name')}:</span>
            {edit
              ? <input value={perso.nom || ''} onChange={e => onChange('nom', e.target.value)} className="px-1 py-0.5 rounded text-sm font-semibold bg-white border text-black w-[90px]" />
              : <span className="text-sm font-semibold">{perso.nom}</span>
            }
          </div>
          <span className={`flex items-center justify-center text-2xl font-bold rounded-full h-14 w-14 border-4 ${getPvColor(pvActuel, pvMax)}`} style={{ boxShadow: '0 0 8px #222' }}>
            {pvActuel}
          </span>
          <span className="mt-1 text-xs text-gray-300">{t('hp')} / {pvMax}</span>
          {edit && (
            <div className="mt-1 flex gap-1">
              <input
                type="number"
                min={0}
                value={perso.pv ?? ''}
                onChange={e => onChange('pv', e.target.value)}
                className="w-10 px-1 py-0.5 rounded bg-white border text-sm text-black"
                placeholder={t('hp')}
              />
              <span className="text-gray-400 font-bold">/</span>
              <input
                type="number"
                min={0}
                value={perso.pv_max ?? perso.pvMax ?? ''}
                onChange={e => onChange('pv_max', e.target.value)}
                className="w-10 px-1 py-0.5 rounded bg-white border text-sm text-black"
                placeholder={t('max')}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats and attack modifiers */}
      <div className="mt-2 flex gap-0">
        <div className="flex-1">
          <div className="font-semibold text-base mb-1">{t('attributes')}</div>
{STATS.map(stat =>
  <div key={stat.key} className="flex gap-3 items-center mb-1">
    <strong className="w-28 text-right">{t(stat.label as TranslationKey)} :</strong>
    {edit
      ? <>
          <input type="text" value={perso[stat.key] ?? ''} onChange={e => onChange(stat.key, e.target.value)} className="ml-2 px-1 py-0.5 rounded bg-white border w-10 text-sm text-black" />
          <span className="mx-1">/</span>
          <input type="text" value={perso[`${stat.key}_mod`] ?? ''} onChange={e => onChange(`${stat.key}_mod`, e.target.value)} className="px-1 py-0.5 rounded bg-white border w-10 text-sm text-black" placeholder={t('mod')} />
        </>
      : <>
          <span
            className={`ml-2 px-2 py-0.5 rounded text-base font-bold ${getStatColor(Number(perso[stat.key]))} bg-opacity-80`}
            style={{ display: 'inline-block', width: '36px', textAlign: 'center' }} // fixed width
          >
            {perso[stat.key]}
          </span>
          <span
            className="ml-2 text-gray-300 text-base font-semibold"
            style={{ display: 'inline-block', width: '50px', textAlign: 'left' }} // fixed width for all mods
          >
            ({perso[`${stat.key}_mod`] >= 0 ? '+' : ''}{perso[`${stat.key}_mod`]})
          </span>
        </>
    }
  </div>
)}

        </div>
        <div className="flex flex-col items-end justify-between ml-4 min-w-[120px]">
          <div className="font-semibold text-base mb-1">{t('attackMods')}</div>
          {ATTACKS.map(att =>
            <div key={att.key} className="flex items-center mb-2 w-full justify-end">
              <strong className="w-16 text-right">{t(att.label as TranslationKey)}</strong>
              {edit
                ? <input type="text" value={perso[att.key] ?? ''} onChange={e => onChange(att.key, e.target.value)} className="ml-2 px-1 py-0.5 rounded bg-white border w-10 text-sm text-black text-right" />
                : <span className="ml-3 px-2 py-0.5 rounded text-base font-bold bg-gray-700 text-white text-right">{perso[att.key] ?? 0}</span>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel

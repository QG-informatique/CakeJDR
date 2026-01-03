'use client'

import { FC, useState } from 'react'
import { useT } from '@/lib/useT'
import type { TranslationKey } from '@/lib/translations'
import {
  type Character,
  type CharacterChangeHandler,
  type CustomField,
} from '@/types/character'

type DescriptionValues = Pick<
  Character,
  | 'race'
  | 'classe'
  | 'sexe'
  | 'age'
  | 'taille'
  | 'poids'
  | 'capacite_raciale'
  | 'bourse'
  | 'traits'
  | 'ideal'
  | 'obligations'
  | 'failles'
  | 'avantages'
  | 'background'
  | 'champs_perso'
>

type DescriptionPanelProps = {
  edit: boolean
  values: DescriptionValues
  onChange: CharacterChangeHandler
  champsPerso: CustomField[]
  onAddChamp: (champ: CustomField) => void
  onDelChamp: (id: string) => void
  onUpdateChamp: (id: string, champ: CustomField) => void
}

// See more / close with translation
const LimiteChamp: FC<{ value: string }> = ({ value }) => {
  const [open, setOpen] = useState(false)
  const t = useT()
  const LMAX = 130
  if (!value) return null
  if (value.length <= LMAX || open) return (
    <span className="text-sm whitespace-pre-line break-words">
      {value}
      {value.length > LMAX && (
        <button className="text-blue-400 underline ml-1 text-xs" onClick={() => setOpen(false)}>
          {t('close')}
        </button>
      )}
    </span>
  )
  return (
    <span className="text-sm whitespace-pre-line break-words">
      {value.slice(0, LMAX) + '...'}
      <button className="text-blue-400 underline ml-1 text-xs" onClick={() => setOpen(true)}>
        {t('seeMore')}
      </button>
    </span>
  )
}

const LABEL_WIDTH = "120px"

const DescriptionPanel: FC<DescriptionPanelProps> = ({
  edit,
  values,
  onChange,
  champsPerso = [],
  onAddChamp,
  onDelChamp,
  onUpdateChamp,
}) => {
  const [newChamp, setNewChamp] = useState<Partial<CustomField>>({}) // <-- Ajout ici
  const t = useT()

  // Champs standards
  const shortFields = [
    'race',
    'classe',
    'sexe',
    'age',
    'taille',
    'poids',
    'bourse',
  ] as const
  const longFields = [
    'traits',
    'ideal',
    'obligations',
    'failles',
    'avantages',
    'background',
  ] as const

  const LABEL_KEYS: Record<(typeof shortFields[number] | typeof longFields[number] | 'capacite_raciale'), TranslationKey> = {
    race: 'race',
    classe: 'class',
    sexe: 'gender',
    age: 'age',
    taille: 'height',
    poids: 'weight',
    bourse: 'purse',
    traits: 'traits',
    ideal: 'ideal',
    obligations: 'bonds',
    failles: 'flaws',
    avantages: 'features',
    background: 'background',
    capacite_raciale: 'racialAbility',
  }

  return (
    <div
      className="h-[calc(100vh-120px)] overflow-y-auto pr-1"
      style={{ minHeight: 0, overflowX: 'hidden' }}
    >
      {/* Champs courts alignés */}
      {shortFields.map((key) => {
        const val = Reflect.get(values, key) as string | undefined
        const label = Reflect.get(LABEL_KEYS, key) as TranslationKey
        return (
          <div key={key} className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
            <label
              className="font-semibold text-right select-none"
              style={{ minWidth: LABEL_WIDTH }}
            >
              {t(label)}
            </label>
            <span className="text-right font-bold">:</span>
            <div className="flex-1 min-w-0 break-words pl-3">
              {edit ? (
                <input
                  value={val || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="px-1 py-0.5 rounded bg-white border text-sm text-black w-full"
                  style={{ minWidth: 0 }}
                />
              ) : (
                <span className="text-sm whitespace-pre-line break-words w-full">{val}</span>
              )}
            </div>
          </div>
        )
      })}

      {/* Racial ability */}
      <div className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
        <label
          className="font-semibold text-right select-none"
          style={{ minWidth: LABEL_WIDTH }}
        >
          {t('racialAbility')}
        </label>
        <span className="text-right font-bold">:</span>
        <div className="flex-1 min-w-0 break-words pl-3">
          {edit ? (
            <textarea
              value={values.capacite_raciale || ''}
              onChange={e => onChange('capacite_raciale', e.target.value)}
              className="px-1 py-0.5 rounded bg-white border text-sm text-black w-full min-h-[38px] max-h-[130px] resize-y"
              style={{ minWidth: 0, overflowWrap: 'break-word' }}
            />
          ) : (
            <span className="text-sm whitespace-pre-line break-words w-full">{values.capacite_raciale}</span>
          )}
        </div>
      </div>

      {/* Long fields (see more) */}
      {longFields.map((key) => {
        const val = Reflect.get(values, key) as string | undefined
        const label = Reflect.get(LABEL_KEYS, key) as TranslationKey
        return (
          <div key={key} className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
            <label
              className="font-semibold text-right select-none"
              style={{ minWidth: LABEL_WIDTH }}
            >
              {t(label)}
            </label>
            <span className="text-right font-bold">:</span>
            <div className="flex-1 min-w-0 break-words pl-3">
              {edit ? (
                <textarea
                  value={val || ''}
                  onChange={(e) => onChange(key, e.target.value)}
                  className="px-1 py-0.5 rounded bg-white border text-sm text-black w-full min-h-[34px] max-h-[130px] resize-y"
                  style={{ minWidth: 0, overflowWrap: 'break-word' }}
                />
              ) : (
                <LimiteChamp value={val || ''} />
              )}
            </div>
          </div>
        )
      })}

      {/* Champs persos dynamiques */}
      <div className="mt-2">
        <div className="font-semibold text-base mb-1">{t('customFields')}</div>
        {edit ? (
          <>
            <div className="flex flex-col gap-1 mb-1">
            {champsPerso.map((f) => (
                <div key={f.id} className="grid grid-cols-[120px_18px_1fr_80px] gap-1 mb-1 items-start w-full">
                  <input
                    className="p-1 rounded bg-white text-black text-sm w-full text-right"
                    value={f.label}
                    onChange={e => {
                      onUpdateChamp(f.id, { ...f, label: e.target.value })
                    }}
                  />
                  <span className="text-right font-bold">:</span>
                  <textarea
                    className="p-1 rounded bg-white text-black text-sm flex-1 min-h-[28px] resize-y w-full pl-3"
                    value={f.value}
                    onChange={e => {
                      onUpdateChamp(f.id, { ...f, value: e.target.value })
                    }}
                    style={{ overflowWrap: 'break-word', minWidth: 0 }}
                  />
                  <button className="text-xs text-red-400 hover:underline col-span-1 justify-self-end" onClick={() => onDelChamp(f.id)}>{t('delete')}</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <div className="grid grid-cols-[120px_18px_1fr_80px] gap-1 w-full">
                <input
                  className="p-1 rounded bg-white text-black text-sm w-full text-right"
                  placeholder={t('fieldName')}
                  value={newChamp.label || ''}
                  onChange={e => setNewChamp({ ...newChamp, label: e.target.value })}
                />
                <span className="text-right font-bold">:</span>
                <textarea
                  className="p-1 rounded bg-white text-black text-sm flex-1 min-h-[28px] resize-y w-full pl-3"
                  placeholder={t('value')}
                  value={newChamp.value || ''}
                  onChange={e => setNewChamp({ ...newChamp, value: e.target.value })}
                  style={{ overflowWrap: 'break-word', minWidth: 0 }}
                />
                <span />
              </div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded p-1 mt-1 w-fit self-end"
                onClick={() => {
                  if (!newChamp.label || !newChamp.value) return
                  onAddChamp({ id: crypto.randomUUID(), label: newChamp.label, value: newChamp.value })
                  setNewChamp({})
                }}
              >
                {t('add')}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            {champsPerso.map((f) => (
              <div key={f.id} className="grid grid-cols-[120px_18px_1fr] items-start w-full">
                <span className="font-semibold text-right">{f.label}</span>
                <span className="text-right font-bold">:</span>
                <span className="break-words flex-1 pl-3">{f.value}</span>
              </div>
            ))}
            {champsPerso.length === 0 && <span className="text-gray-400 text-xs">{t('noCustomField')}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default DescriptionPanel

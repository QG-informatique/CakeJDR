'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useState } from 'react'

type CustomField = { label: string, value: string }

type DescriptionValues = {
  race: string,
  classe: string,
  sexe: string,
  age: string | number,
  taille: string,
  poids: string,
  capacite_raciale: string,
  bourse: string | number,
  traits: string,
  ideal: string,
  obligations: string,
  failles: string,
  avantages: string,
  background: string,
  champs_perso: CustomField[],
  [key: string]: any
}

type DescriptionPanelProps = {
  edit: boolean,
  values: DescriptionValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (field: string, value: any) => void,
  champsPerso: CustomField[],
  onAddChamp: (champ: CustomField) => void,
  onDelChamp: (index: number) => void,
  onUpdateChamp: (index: number, champ: CustomField) => void,
}

// Voir plus...
const LimiteChamp: FC<{ value: string }> = ({ value }) => {
  const [open, setOpen] = useState(false)
  const LMAX = 130
  if (!value) return null
  if (value.length <= LMAX || open) return (
    <span className="text-sm whitespace-pre-line break-words">
      {value}
      {value.length > LMAX && (
        <button className="text-blue-400 underline ml-1 text-xs" onClick={() => setOpen(false)}>
          Fermer
        </button>
      )}
    </span>
  )
  return (
    <span className="text-sm whitespace-pre-line break-words">
      {value.slice(0, LMAX) + '...'}
      <button className="text-blue-400 underline ml-1 text-xs" onClick={() => setOpen(true)}>
        Voir plus
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
  const [newChamp, setNewChamp] = useState<Partial<CustomField>>({})

  // Champs standards
  const shortFields = [
    { key: 'race', label: 'Race' },
    { key: 'classe', label: 'Classe' },
    { key: 'sexe', label: 'Sexe' },
    { key: 'age', label: 'Âge' },
    { key: 'taille', label: 'Taille' },
    { key: 'poids', label: 'Poids' },
    { key: 'bourse', label: 'Bourse (PA)' },
  ]
  const longFields = [
    { key: 'traits', label: 'Trait perso' },
    { key: 'ideal', label: 'Idéal' },
    { key: 'obligations', label: 'Obligations' },
    { key: 'failles', label: 'Failles' },
    { key: 'avantages', label: 'Avantages' },
    { key: 'background', label: 'Background' }
  ]

  return (
    <div
      className="h-[calc(100vh-120px)] overflow-y-auto pr-1"
      style={{ minHeight: 0, overflowX: 'hidden' }}
    >
      <div className="font-semibold mb-2 text-base">Description</div>

      {/* Champs courts alignés */}
      {shortFields.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
          <label
            className="font-semibold text-right select-none"
            style={{ minWidth: LABEL_WIDTH }}
          >
            {label}
          </label>
          <span className="text-right font-bold">:</span>
          <div className="flex-1 min-w-0 break-words pl-3">
              {edit ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <input
                  value={(values as any)[key] || ''}
                  onChange={e => onChange(key, e.target.value)}
                  className="px-1 py-0.5 rounded bg-white border text-sm text-black w-full"
                  style={{ minWidth: 0 }}
                />
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <span className="text-sm whitespace-pre-line break-words w-full">{(values as any)[key]}</span>
              )}
          </div>
        </div>
      ))}

      {/* Capacité raciale alignée */}
      <div className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
        <label
          className="font-semibold text-right select-none"
          style={{ minWidth: LABEL_WIDTH }}
        >
          Capacité raciale
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

      {/* Champs longs (voir plus) alignés */}
      {longFields.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-[120px_18px_1fr] mb-2 items-start">
          <label
            className="font-semibold text-right select-none"
            style={{ minWidth: LABEL_WIDTH }}
          >
            {label}
          </label>
          <span className="text-right font-bold">:</span>
          <div className="flex-1 min-w-0 break-words pl-3">
              {edit ? (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <textarea
                  value={(values as any)[key] || ''}
                  onChange={e => onChange(key, e.target.value)}
                  className="px-1 py-0.5 rounded bg-white border text-sm text-black w-full min-h-[34px] max-h-[130px] resize-y"
                  style={{ minWidth: 0, overflowWrap: 'break-word' }}
                />
              ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <LimiteChamp value={(values as any)[key] || ''} />
              )}
          </div>
        </div>
      ))}

      {/* Champs persos dynamiques */}
      <div className="mt-2">
        <div className="font-semibold text-base mb-1">Autres champs</div>
        {edit ? (
          <>
            <div className="flex flex-col gap-1 mb-1">
              {champsPerso.map((f, i) => (
                <div key={i} className="grid grid-cols-[120px_18px_1fr_80px] gap-1 mb-1 items-start w-full">
                  <input
                    className="p-1 rounded bg-white text-black text-sm w-full text-right"
                    value={f.label}
                    onChange={e => {
                      onUpdateChamp(i, { ...f, label: e.target.value })
                    }}
                  />
                  <span className="text-right font-bold">:</span>
                  <textarea
                    className="p-1 rounded bg-white text-black text-sm flex-1 min-h-[28px] resize-y w-full pl-3"
                    value={f.value}
                    onChange={e => {
                      onUpdateChamp(i, { ...f, value: e.target.value })
                    }}
                    style={{ overflowWrap: 'break-word', minWidth: 0 }}
                  />
                  <button className="text-xs text-red-400 hover:underline col-span-1 justify-self-end" onClick={() => onDelChamp(i)}>Suppr</button>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 mb-2">
              <div className="grid grid-cols-[120px_18px_1fr_80px] gap-1 w-full">
                <input
                  className="p-1 rounded bg-white text-black text-sm w-full text-right"
                  placeholder="Nom du champ"
                  value={newChamp.label || ''}
                  onChange={e => setNewChamp({ ...newChamp, label: e.target.value })}
                />
                <span className="text-right font-bold">:</span>
                <textarea
                  className="p-1 rounded bg-white text-black text-sm flex-1 min-h-[28px] resize-y w-full pl-3"
                  placeholder="Valeur"
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
                  onAddChamp({ label: newChamp.label, value: newChamp.value })
                  setNewChamp({})
                }}
              >
                Ajouter
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            {champsPerso.map((f, i) => (
              <div key={i} className="grid grid-cols-[120px_18px_1fr] items-start w-full">
                <span className="font-semibold text-right">{f.label}</span>
                <span className="text-right font-bold">:</span>
                <span className="break-words flex-1 pl-3">{f.value}</span>
              </div>
            ))}
            {champsPerso.length === 0 && <span className="text-gray-400 text-xs">Aucun champ perso.</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default DescriptionPanel

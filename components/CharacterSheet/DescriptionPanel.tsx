'use client'

import { FC, useState } from 'react'

type CustomField = { label: string, value: string }

type DescriptionPanelProps = {
  edit: boolean,
  values: {
    race: string,
    profil: string,
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
    champs_perso: CustomField[]
  },
  onChange: (field: string, value: any) => void,
  champsPerso: CustomField[],
  onAddChamp: (champ: CustomField) => void,
  onDelChamp: (index: number) => void,
  onUpdateChamp: (index: number, champ: CustomField) => void,
}

const DescriptionPanel: FC<DescriptionPanelProps> = ({
  edit,
  values,
  onChange,
  champsPerso = [],   // <-- Ajoute ceci comme valeur par défaut !  
  onAddChamp,
  onDelChamp,
  onUpdateChamp,
}) => {
  const [newChamp, setNewChamp] = useState<Partial<CustomField>>({})

  return (
    <div>
      <div className="font-semibold mb-2 text-base">Description</div>
      {/* Champs standards */}
      {[
        { key: 'race', label: 'Race' },
        { key: 'profil', label: 'Profil' },
        { key: 'sexe', label: 'Sexe' },
        { key: 'age', label: 'Âge' },
        { key: 'taille', label: 'Taille' },
        { key: 'poids', label: 'Poids' }
      ].map(({ key, label }) => (
        <div key={key} className="mb-1 flex items-center">
          <strong className="min-w-[80px]">{label} :</strong>
          {edit
            ? <input
                value={values[key] || ''}
                onChange={e => onChange(key, e.target.value)}
                className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1"
              />
            : <span className="ml-1 text-sm">{values[key]}</span>}
        </div>
      ))}
      {/* Capacité raciale AVEC deux points juste derrière */}
      <div className="mb-1 flex items-start">
        <strong className="min-w-[120px] mt-1">Capacité raciale :</strong>
        {edit
          ? <textarea
              value={values.capacite_raciale || ''}
              onChange={e => onChange('capacite_raciale', e.target.value)}
              className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1 min-h-[48px] max-h-[130px] resize-y"
            />
          : <span className="ml-1 text-sm whitespace-pre-line">{values.capacite_raciale}</span>}
      </div>
      <div className="mb-1 flex items-center">
        <strong className="min-w-[100px]">Bourse (PA) :</strong>
        {edit
          ? <input
              type="text"
              value={values.bourse || ''}
              onChange={e => onChange('bourse', e.target.value)}
              className="ml-1 px-1 py-0.5 rounded bg-white border w-14 text-sm text-black"
            />
          : <span className="ml-1 text-sm">{values.bourse}</span>}
      </div>
      {/* Ajouts demandés */}
      {[
        { key: 'traits', label: 'Trait perso' },
        { key: 'ideal', label: 'Idéal' },
        { key: 'obligations', label: 'Obligations' },
        { key: 'failles', label: 'Failles' },
        { key: 'avantages', label: 'Avantages' },
        { key: 'background', label: 'Background' }
      ].map(({ key, label }) => (
        <div key={key} className="mb-1 flex items-center">
          <strong className="min-w-[100px]">{label} :</strong>
          {edit
            ? <input
                value={values[key] || ''}
                onChange={e => onChange(key, e.target.value)}
                className="ml-1 px-1 py-0.5 rounded bg-white border text-sm text-black flex-1"
              />
            : <span className="ml-1 text-sm whitespace-pre-line">{values[key]}</span>}
        </div>
      ))}
      {/* Champs persos dynamiques */}
      <div className="mt-2">
        <div className="font-semibold text-base mb-1">Autres champs</div>
        {edit ? (
          <>
            <div className="flex flex-col gap-1 mb-1">
              {champsPerso.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="p-1 rounded bg-white text-black text-sm w-32"
                    value={f.label}
                    onChange={e => {
                      onUpdateChamp(i, { ...f, label: e.target.value })
                    }}
                  />
                  <span>:</span>
                  <input
                    className="p-1 rounded bg-white text-black text-sm flex-1"
                    value={f.value}
                    onChange={e => {
                      onUpdateChamp(i, { ...f, value: e.target.value })
                    }}
                  />
                  <button className="text-xs text-red-400 hover:underline" onClick={() => onDelChamp(i)}>Suppr</button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 mb-2">
              <input
                className="p-1 rounded bg-white text-black text-sm w-32"
                placeholder="Nom du champ"
                value={newChamp.label || ''}
                onChange={e => setNewChamp({ ...newChamp, label: e.target.value })}
              />
              <span>:</span>
              <input
                className="p-1 rounded bg-white text-black text-sm flex-1"
                placeholder="Valeur"
                value={newChamp.value || ''}
                onChange={e => setNewChamp({ ...newChamp, value: e.target.value })}
              />
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded p-1"
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
              <div key={i} className="flex gap-2 items-center">
                <span className="font-semibold">{f.label} :</span>
                <span className="">{f.value}</span>
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

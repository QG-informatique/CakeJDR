'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useState } from 'react'

type Objet = { nom: string, quantite: number }

type Props = {
  edit: boolean,
  armes: string,
  armure: string,
  degats_armes: string,      // snake_case partout
  modif_armure: number,
  objets: Objet[],
  onAddObj: (obj: Objet) => void,
  onDelObj: (idx: number) => void,
  onChange: (field: string, value: any) => void,
}

const EquipPanel: FC<Props> = ({
  armes,
  degats_armes,     // snake_case
  armure,
  modif_armure,     // snake_case
  objets = [],
  edit,
  onChange,
  onAddObj,
  onDelObj,
}) => {
  const [newObj, setNewObj] = useState<{ nom: string, quantite: string }>({ nom: '', quantite: '' })

  const handleAddObj = () => {
    if (!newObj.nom || !newObj.quantite) return
    const quantiteNumber = parseInt(newObj.quantite, 10)
    if (isNaN(quantiteNumber) || quantiteNumber < 1) return
    onAddObj({ nom: newObj.nom, quantite: quantiteNumber })
    setNewObj({ nom: '', quantite: '' })
  }

  return (
    <div className="text-[1.07rem]">
      <div className="font-semibold mb-2 text-lg">Armes & Armures</div>
      <div className="mb-1 flex items-center">
        <strong className="w-32">Armes :</strong>
        {edit
          ? <input value={armes || ''} onChange={e => onChange('armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-28 text-sm text-black" />
          : <span className="ml-1">{armes}</span>
        }
      </div>
      <div className="mb-1 flex items-center">
        <strong className="w-32">Dégâts armes :</strong>
        {edit
          ? <input value={degats_armes || ''} onChange={e => onChange('degats_armes', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-20 text-sm text-black" />
          : <span className="ml-1">{degats_armes}</span>
        }
      </div>
      <div className="mb-1 flex items-center">
        <strong className="w-32">Armure :</strong>
        {edit
          ? <input value={armure || ''} onChange={e => onChange('armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-28 text-sm text-black" />
          : <span className="ml-1">{armure}</span>
        }
      </div>
      <div className="mb-3 flex items-center">
        <strong className="w-32">Modif armure :</strong>
        {edit
          ? <input type="number" value={modif_armure ?? ''} onChange={e => onChange('modif_armure', e.target.value)} className="ml-1 px-1 py-0.5 rounded bg-white border w-12 text-sm text-black" />
          : <span className="ml-1">{modif_armure}</span>
        }
      </div>
      <div className="font-semibold text-lg mb-1 mt-3">Objets</div>
      {/* Création/édition d’objets */}
      {edit ? (
        <>
          <div className="flex flex-col gap-1 mb-2">
            {objets.map((o, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
                <span className="text-base">{o.nom}</span>
                <span className="text-xs text-gray-300">x{o.quantite}</span>
                <button className="text-xs text-red-400 hover:underline ml-2" onClick={() => onDelObj(i)}>Suppr</button>
              </div>
            ))}
          </div>
          <div className="flex gap-1 mb-2">
            <input
              className="p-1 rounded bg-white text-black text-sm flex-1"
              placeholder="Nom de l'objet"
              value={newObj.nom}
              onChange={e => setNewObj({ ...newObj, nom: e.target.value })}
            />
            <input
              className="p-1 rounded bg-white text-black text-sm w-16"
              placeholder="Qté"
              type="number"
              min="1"
              value={newObj.quantite}
              onChange={e => setNewObj({ ...newObj, quantite: e.target.value })}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded p-1"
              onClick={handleAddObj}
            >
              Ajouter
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          {objets.map((o, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded px-2 py-1">
              <span className="text-base">{o.nom}</span>
              <span className="text-xs text-gray-300">x{o.quantite}</span>
            </div>
          ))}
          {objets.length === 0 && <span className="text-gray-400 text-xs">No items.</span>}
        </div>
      )}
    </div>
  )
}

export default EquipPanel

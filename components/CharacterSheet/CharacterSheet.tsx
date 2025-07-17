'use client'

import { FC, useState, useEffect } from 'react'
import StatsPanel from './StatsPanel'
import CompetencesPanel from './CompetencesPanel'
import EquipPanel from './EquipPanel'
import DescriptionPanel from './DescriptionPanel'
import LevelUpPanel from './LevelUpPanel'
import ImportExportMenu from './ImportExportMenu'
// (ImportExportMenu ici plus tard)

const TABS = [
  { key: 'main', label: 'Statistiques' },
  { key: 'equip', label: 'Équipement' },
  { key: 'desc', label: 'Description' }
]

type Competence = { nom: string, type: string, effets: string, degats?: string }
type Objet = { nom: string, quantite: number }
type CustomField = { label: string, value: string }

type Props = {
  perso: any,
  onUpdate: (perso: any) => void,
  chatBoxRef?: React.RefObject<HTMLDivElement | null>
}

export const defaultPerso = {
  // ...exactement ta structure de base, inchangée
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate, chatBoxRef }) => {
  const [edit, setEdit] = useState(false)
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState<any>({ ...(Object.keys(perso || {}).length ? perso : defaultPerso) })
  const [processing, setProcessing] = useState(false)
  const [dice, setDice] = useState('d6')

  const cFiche = edit ? localPerso : (Object.keys(perso || {}).length ? perso : defaultPerso)

  useEffect(() => {
  if (!edit) setLocalPerso({ ...(Object.keys(perso || {}).length ? perso : defaultPerso) })
}, [perso])


  // Fonctions utilitaires pour les champs dynamiques
  const handleChange = (field: string, value: any) => {
    setLocalPerso({ ...localPerso, [field]: value })
  }
  const handleUpdateCompetences = (competences: Competence[]) => setLocalPerso({ ...localPerso, competences })
  const handleUpdateObjets = (objets: Objet[]) => setLocalPerso({ ...localPerso, objets })
  const handleUpdateChampsPerso = (champs_perso: CustomField[]) => setLocalPerso({ ...localPerso, champs_perso })

  // Pour la gestion de Level Up
  const rollDice = (dice: string): number => {
    const match = dice.match(/d(\d+)/i)
    if (!match) return 0
    const sides = parseInt(match[1])
    return Math.floor(Math.random() * sides) + 1
  }

 const handleLevelUp = async () => {
  if (processing) return
  setProcessing(true)
  let updatedPerso = { ...cFiche, niveau: Number(cFiche.niveau) + 1 }
  const pvMaxKey =
    updatedPerso.pv_max !== undefined ? 'pv_max'
    : updatedPerso.pvMax !== undefined ? 'pvMax'
    : 'pv_max'

  for (const stat of ['pv', 'force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme']) {
    const gain = rollDice(dice)
    // Ajout au chat
    if (chatBoxRef?.current) {
      const message = document.createElement('p')
      message.innerHTML = `<strong>🎲 ${cFiche.nom} - ${dice.toUpperCase()} - ${stat} :</strong> ${gain}`
      chatBoxRef.current.appendChild(message)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
    if (stat === 'pv') {
      const currentMax = Number(updatedPerso[pvMaxKey] ?? updatedPerso.pv ?? 0)
      const newPvMax = currentMax + gain
      const currentPv = Number(updatedPerso.pv ?? 0)
      const newPv = Math.min(currentPv + gain, newPvMax)
      updatedPerso = { ...updatedPerso, [pvMaxKey]: newPvMax, pv: newPv }
    } else {
      updatedPerso = { ...updatedPerso, [stat]: Number(updatedPerso[stat] ?? 0) + gain }
    }
    // <= MAJ locale aussi !
    setLocalPerso({ ...updatedPerso })
    onUpdate(updatedPerso)
    await new Promise((resolve) => setTimeout(resolve, 1200))
  }
  setProcessing(false)
}


  const save = () => {
    setEdit(false)
    onUpdate(localPerso)
  }

  return (
    <aside className="w-1/5 bg-gray-900 p-3 overflow-y-auto text-[15px] text-white relative select-none">
      <div className="flex justify-between items-center">
  <h2 className="text-lg font-bold mb-2">Personnage</h2>
  <div className="flex gap-2 items-center">
    <ImportExportMenu
  perso={localPerso}
  onUpdate={(newPerso) => {
    setLocalPerso(newPerso)
    onUpdate(newPerso)
    setEdit(false) // optionnel
  }}
/>
    <button
      onClick={() => { if (edit) save(); else setEdit(true); }}
      className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
    >
      {edit ? 'Sauver' : 'Éditer'}
    </button>
  </div>
</div>

      <nav className="flex gap-1 mb-3">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-2 py-1 rounded-t text-sm font-semibold ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'main' && (
        <>
          <StatsPanel
            edit={edit}
            perso={localPerso}
            onChange={handleChange}
          />
          <CompetencesPanel
            edit={edit}
            competences={localPerso.competences || []}
            onAdd={comp =>
              setLocalPerso({
                ...localPerso,
                competences: [...(localPerso.competences || []), comp]
              })
            }
            onDelete={idx =>
              setLocalPerso({
                ...localPerso,
                competences: (localPerso.competences || []).filter((_, i) => i !== idx)
              })
            }
          />
          <LevelUpPanel
            dice={dice}
            setDice={setDice}
            onLevelUp={handleLevelUp}
            processing={processing}
          />
        </>
      )}

      {tab === 'equip' && (
  <EquipPanel
    edit={edit}
    armes={localPerso.armes}
    armure={localPerso.armure}
    degats_armes={localPerso.degats_armes}
    modif_armure={localPerso.modif_armure}
    objets={localPerso.objets || []}
    onAddObj={obj =>
      setLocalPerso({
        ...localPerso,
        objets: [...(localPerso.objets || []), obj]
      })
    }
    onDeleteObj={idx =>
      setLocalPerso({
        ...localPerso,
        objets: (localPerso.objets || []).filter((_, i) => i !== idx)
      })
    }
    onChange={handleChange}
  />
)}


      {tab === 'desc' && (
        <DescriptionPanel
          edit={edit}
          values={{
            race: localPerso.race,
            profil: localPerso.profil,
            sexe: localPerso.sexe,
            age: localPerso.age,
            taille: localPerso.taille,
            poids: localPerso.poids,
            capacite_raciale: localPerso.capacite_raciale,
            bourse: localPerso.bourse,
            traits: localPerso.traits,
            ideal: localPerso.ideal,
            obligations: localPerso.obligations,
            failles: localPerso.failles,
            avantages: localPerso.avantages,
            background: localPerso.background,
            champs_perso: localPerso.champs_perso,
          }}
          onChange={handleChange}
          champsPerso={localPerso.champs_perso}
          onAddChamp={champ => {
            setLocalPerso({
              ...localPerso,
              champs_perso: [...(localPerso.champs_perso || []), champ]
            })
          }}
          onDelChamp={idx => {
            const arr = [...(localPerso.champs_perso || [])]
            arr.splice(idx, 1)
            setLocalPerso({ ...localPerso, champs_perso: arr })
          }}
          onUpdateChamp={(idx, champ) => {
            const arr = [...(localPerso.champs_perso || [])]
            arr[idx] = champ
            setLocalPerso({ ...localPerso, champs_perso: arr })
          }}
        />
      )}

      {edit && (
        <button onClick={save} className="mt-3 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm">Sauver</button>
      )}
    </aside>
  )
}

export default CharacterSheet

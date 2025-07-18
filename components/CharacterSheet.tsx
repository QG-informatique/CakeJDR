'use client'

import { FC, useState, useEffect } from 'react'
import StatsPanel from './StatsPanel'
import CompetencesPanel from './CompetencesPanel'
import EquipPanel from './EquipPanel'
import DescriptionPanel from './DescriptionPanel'
import LevelUpPanel from './LevelUpPanel'
import ImportExportMenu from './ImportExportMenu'
import CharacterSheetHeader from './CharacterSheetHeader'

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perso: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (perso: any) => void,
  chatBoxRef?: React.RefObject<HTMLDivElement | null>
}

export const defaultPerso = {
  nom: '',
  race: '',
  classe: '',
  sexe: '',
  age: '',
  taille: '',
  poids: '',
  capacite_raciale: '',
  niveau: 1,
  pv: 10,
  pv_max: 10,
  force: 1,
  dexterite: 1,
  constitution: 1,
  intelligence: 1,
  sagesse: 1,
  charisme: 1,
  bourse: 0,
  armes: '',
  armure: '',
  degats_armes: '',
  modif_armure: 0,
  competences: [],
  objets: [],
  traits: '',
  ideal: '',
  obligations: '',
  failles: '',
  avantages: '',
  background: '',
  champs_perso: [],
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate, chatBoxRef }) => {
  const [edit, setEdit] = useState(false)
  const [tab, setTab] = useState('main')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [localPerso, setLocalPerso] = useState<any>(
    { ...(Object.keys(perso || {}).length ? perso : defaultPerso) }
  )
  const [processing, setProcessing] = useState(false)
  const [dice, setDice] = useState('d6')
  const [lastStat, setLastStat] = useState<string | null>(null)
  const [lastGain, setLastGain] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0) // AJOUT

  const cFiche = edit ? localPerso : (Object.keys(perso || {}).length ? perso : defaultPerso)

  useEffect(() => {
    if (!edit) setLocalPerso({ ...(Object.keys(perso || {}).length ? perso : defaultPerso) })
  }, [perso])

  // Fonctions utilitaires pour les champs dynamiques
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Ici : animation LevelUp avec animKey unique à chaque stat, même si chiffre identique
      setLastStat(stat)
      setLastGain(gain)
      setAnimKey(k => k + 1) // INCRÉMENTATION À CHAQUE LEVELUP

      setTimeout(() => {
        setLastStat(null)
        setLastGain(null)
      }, 1200)

      if (stat === 'pv') {
        const currentMax = Number(updatedPerso[pvMaxKey] ?? updatedPerso.pv ?? 0)
        const newPvMax = currentMax + gain
        const currentPv = Number(updatedPerso.pv ?? 0)
        const newPv = Math.min(currentPv + gain, newPvMax)
        updatedPerso = { ...updatedPerso, [pvMaxKey]: newPvMax, pv: newPv }
      } else {
        updatedPerso = { ...updatedPerso, [stat]: Number(updatedPerso[stat] ?? 0) + gain }
      }

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
    <aside
      className="bg-gray-900 pt-0 pb-3 px-3 overflow-y-auto text-[15px] text-white relative select-none"
      style={{
        width: '420px',       // Largeur fixe (cohérent partout)
        minWidth: '420px',
        maxWidth: '420px',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >

      <CharacterSheetHeader
        edit={edit}
        onToggleEdit={() => setEdit(true)}
        onSave={save}
        tab={tab}
        setTab={setTab}
        TABS={TABS}
      >
        <ImportExportMenu perso={edit ? localPerso : cFiche} onUpdate={onUpdate} />
      </CharacterSheetHeader>

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
            lastStat={lastStat}
            lastGain={lastGain}
            animKey={animKey} // PASSAGE DE LA PROP animKey !!
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
          onDelObj={idx =>
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
            classe: localPerso.classe,
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

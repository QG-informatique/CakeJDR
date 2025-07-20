'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useState, useEffect } from 'react'
import StatsTab from './StatsTab'
import EquipTab from './EquipTab'
import DescriptionPanel from '../character/DescriptionPanel'
import CharacterSheetHeader from '../character/CharacterSheetHeader'

const TABS = [
  { key: 'main', label: 'Statistiques' },
  { key: 'equip', label: 'Équipement' },
  { key: 'desc', label: 'Description' }
]


type Props = {
  perso: any, // Fiche perso initiale
  onUpdate: (perso: any) => void,
  chatBoxRef?: React.RefObject<HTMLDivElement | null>,
  creation?: boolean,
  children?: React.ReactNode,
  allCharacters?: any[], // facultatif, si tu veux passer la liste complète
  logoOnly?: boolean
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
  notes: ''
}

// Lecture de la fiche sélectionnée dans le localStorage
const loadSelectedCharacter = (): any | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('selected_character')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const CharacterSheet: FC<Props> = ({
  perso,
  onUpdate,
  chatBoxRef,
  creation = false,
  children,
  allCharacters = [],
  logoOnly = false
}) => {
  const [edit, setEdit] = useState(creation)
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState<any>(defaultPerso)

  useEffect(() => {
    // Au montage, on tente de récupérer la fiche sélectionnée
    const selected = loadSelectedCharacter()
    if (selected) {
      setLocalPerso(selected)
      setEdit(false)
      return
    }
    // Sinon on charge la fiche passée en props
    setLocalPerso(Object.keys(perso || {}).length ? perso : defaultPerso)
  }, [perso, allCharacters])

  useEffect(() => {
    // Si on désactive l'édition, on remet localPerso à jour depuis props perso
    if (!edit) {
      setLocalPerso(Object.keys(perso || {}).length ? perso : defaultPerso)
    }
  }, [edit, perso])

  const handleChange = (field: string, value: any) => {
    setLocalPerso({ ...localPerso, [field]: value })
  }

  const rollDice = (dice: string): number => {
    const match = dice.match(/d(\d+)/i)
    if (!match) return 0
    const sides = parseInt(match[1])
    return Math.floor(Math.random() * sides) + 1
  }

  const [processing, setProcessing] = useState(false)
  const [dice, setDice] = useState('d6')
  const [lastStat, setLastStat] = useState<string | null>(null)
  const [lastGain, setLastGain] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const cFiche = edit ? localPerso : (Object.keys(perso || {}).length ? perso : defaultPerso)

  const handleLevelUp = async () => {
    if (processing) return
    setProcessing(true)
    let updatedPerso = { ...cFiche, niveau: Number(cFiche.niveau) + 1 } as Record<string, any>
    const pvMaxKey =
      updatedPerso.pv_max !== undefined ? 'pv_max'
      : updatedPerso.pvMax !== undefined ? 'pvMax'
      : 'pv_max'

    for (const stat of ['pv', 'force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme']) {
      const gain = rollDice(dice)

      if (chatBoxRef?.current) {
        const message = document.createElement('p')
        message.innerHTML = `<strong>🎲 ${cFiche.nom} - ${dice.toUpperCase()} - ${stat} :</strong> ${gain}`
        chatBoxRef.current.appendChild(message)
        chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
      }

      setLastStat(stat)
      setLastGain(gain)
      setAnimKey(k => k + 1)

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
        updatedPerso = { ...updatedPerso, [stat]: Number((updatedPerso as any)[stat] ?? 0) + gain }
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
        width: creation ? 'auto' : '420px',
        minWidth: creation ? '600px' : '420px',
        maxWidth: creation ? '100%' : '420px',
        boxSizing: 'border-box',
        overflowX: 'hidden'
      }}
    >

      {!creation && (
        <CharacterSheetHeader
          edit={edit}
          onToggleEdit={() => setEdit(true)}
          onSave={save}
          tab={tab}
          setTab={setTab}
          TABS={TABS}
          logoOnly={logoOnly}
        >
          {children}
        </CharacterSheetHeader>
      )}

      {(creation || tab === 'main') && (
        <StatsTab
          edit={edit}
          perso={localPerso}
          onChange={handleChange}
          setLocalPerso={setLocalPerso}
          localPerso={localPerso}
          dice={dice}
          setDice={setDice}
          onLevelUp={handleLevelUp}
          processing={processing}
          lastStat={lastStat}
          lastGain={lastGain}
          animKey={animKey}
        />
      )}
      {(creation || tab === 'equip') && (
        <EquipTab
          edit={edit}
          localPerso={localPerso}
          setLocalPerso={setLocalPerso}
          onChange={handleChange}
        />
      )}

      {(creation || tab === 'desc') && (
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
        <button
          onClick={save}
          className="mt-3 w-full bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
        >
          Sauver
        </button>
      )}
    </aside>
  )
}

export default CharacterSheet

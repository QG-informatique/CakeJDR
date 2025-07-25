'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  perso: any // Fiche perso initiale
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

// Fonction utilitaire pour récupérer l’ID sélectionné en localStorage
const loadSelectedCharacterId = (): string | null => {
  return typeof window !== 'undefined' ? localStorage.getItem('selectedCharacterId') : null
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
  // NE PAS relier edit à creation sauf à l'init
  const [edit, setEdit] = useState(!!creation)
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState<any>(defaultPerso)
  const [cloudOpen, setCloudOpen] = useState(false)
  const [cloudChars, setCloudChars] = useState<any[]>([])
  const [localList, setLocalList] = useState<any[]>([])
  const { id: roomId } = useParams<{ id: string }>()

  // On met à jour la fiche sélectionnée au chargement/changement
  useEffect(() => {
    const selectedId = loadSelectedCharacterId()
    if (selectedId && allCharacters.length > 0) {
      const found = allCharacters.find(c => c.id?.toString() === selectedId)
      if (found) {
        setLocalPerso(found)
        return
      }
    }
    setLocalPerso(Object.keys(perso || {}).length ? perso : defaultPerso)
  }, [perso, allCharacters])

  useEffect(() => {
    if (!cloudOpen || !roomId) return
    fetch(`/api/roomstorage?roomId=${encodeURIComponent(roomId)}`)
      .then(res => res.json())
      .then(data => setCloudChars(Object.values(data.characters || {})))
      .catch(() => setCloudChars([]))
    try {
      const list = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      setLocalList(Array.isArray(list) ? list : [])
    } catch {
      setLocalList([])
    }
  }, [cloudOpen, roomId])

  // Quand on QUITTE le mode édition, on recharge depuis les props
  useEffect(() => {
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

  const needsDownload = (char: any) => {
    const local = localList.find(c => String(c.id) === String(char.id))
    if (!local) return true
    return (char.updatedAt || 0) > (local.updatedAt || 0)
  }

  const handleDownload = (char: any) => {
    try {
      const list = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      const idx = list.findIndex((c: any) => String(c.id) === String(char.id))
      const withTime = { ...char, updatedAt: char.updatedAt || Date.now() }
      const updated = idx !== -1 ? list.map((c: any, i: number) => i === idx ? withTime : c) : [...list, withTime]
      localStorage.setItem('jdr_characters', JSON.stringify(updated))
      window.dispatchEvent(new Event('jdr_characters_change'))
      setLocalList(updated)
    } catch {}
  }

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

  const CloudList = () => (
    cloudOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setCloudOpen(false)}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80 max-h-[70vh] overflow-auto"
        >
          <h3 className="text-lg font-semibold mb-3">Cloud characters</h3>
          <ul className="space-y-1">
            {cloudChars.map((c, idx) => (
              <li key={idx} className="flex justify-between items-center gap-2">
                <span className="truncate flex-1 text-sm">{c.nom || c.name || `#${idx + 1}`}</span>
                {needsDownload(c) && (
                  <button
                    onClick={() => handleDownload(c)}
                    className="px-2 py-1 bg-emerald-600/70 hover:bg-emerald-600 rounded text-sm"
                  >
                    Download
                  </button>
                )}
              </li>
            ))}
            {cloudChars.length === 0 && (
              <li className="text-center text-sm text-gray-400">No character</li>
            )}
          </ul>
        </div>
      </div>
    ) : null
  )

  return (
    <aside
      className="
        bg-black/10 border border-white/10 backdrop-blur-[2px]
        shadow shadow-black/5 rounded-2xl p-5
        pt-0 pb-3 px-3 overflow-y-auto text-[15px] text-white
        relative select-none
      "
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
          onToggleEdit={() => setEdit(v => !v)}
          onSave={save}
          tab={tab}
          setTab={setTab}
          TABS={TABS}
          logoOnly={logoOnly}
        >
          <button
            onClick={() => setCloudOpen(true)}
            className="ml-2 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow"
            type="button"
          >
            ☁️
          </button>
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
      <CloudList />
    </aside>
  )
}

export default CharacterSheet

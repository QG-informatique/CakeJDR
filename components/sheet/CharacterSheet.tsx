'use client'

import { FC, useState, useEffect, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'
import StatsTab from './StatsTab'
import PortraitPicker from './PortraitPicker'
import EquipPanel from '../character/EquipPanel'
import DescriptionPanel from '../character/DescriptionPanel'
import CharacterSheetHeader, { type SheetDensity } from '../character/CharacterSheetHeader'
import CharacterEditor from '../character/CharacterEditor'
import { useT } from '@/lib/useT'
import { useIsDesktop } from '@/lib/useIsDesktop'
import {
  type Character,
  defaultCharacter,
  normalizeCharacter,
} from '@/types/character'

type Props = {
  perso: Character // Fiche perso initiale
  onUpdate: (perso: Character) => void
}

const DENSITY_KEY = 'sheetDensity'

export const defaultPerso: Character = { ...defaultCharacter }

/** Jet de montée de niveau (ex. « d6 ») : la fiche appartient au joueur, le tirage reste local. */
const rollDice = (dice: string): number => {
  const match = dice.match(/d(\d+)/i)
  if (!match) return 0
  const sides = parseInt(match[1] ?? '0')
  return Math.floor(Math.random() * sides) + 1
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate }) => {
  // La fiche se modifie dans l'écran d'édition (CharacterEditor) ; ici elle
  // ne fait que s'afficher.
  const [editorOpen, setEditorOpen] = useState(false)
  const [portraitOpen, setPortraitOpen] = useState(false)
  // Compact ou complet : un choix d'affichage, gardé dans ce navigateur.
  const [density, setDensity] = useState<SheetDensity>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'full'
    } catch {
      return 'full'
    }
  })
  const chooseDensity = (d: SheetDensity) => {
    setDensity(d)
    try { localStorage.setItem(DENSITY_KEY, d) } catch { /* stockage indisponible */ }
  }
  const [tab, setTab] = useState('main')
  const [localPerso, setLocalPerso] = useState<Character>(() =>
    normalizeCharacter(perso),
  )
  const t = useT()
  const isDesktop = useIsDesktop()
  const TABS = [
    { key: 'main', label: t('statsTab') },
    { key: 'equip', label: t('equipment') },
    { key: 'desc', label: t('description') },
  ]
  const [collapsed, setCollapsed] = useState(
    () =>
      typeof window !== 'undefined' &&
      localStorage.getItem('characterPanelCollapsed') === '1',
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('characterPanelCollapsed', collapsed ? '1' : '0')
    }
  }, [collapsed])

  // La fiche affichée suit celle du parent. L'écran d'édition travaille sur
  // sa propre copie : une fiche reçue pendant qu'on la modifie n'efface rien.
  useEffect(() => {
    const next = Object.keys(perso || {}).length ? perso : defaultPerso
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la fiche affichée suit celle du parent
    setLocalPerso(normalizeCharacter(next))
  }, [perso])

  const [processing, setProcessing] = useState(false)
  const [dice, setDice] = useState('d6')
  const [lastStat, setLastStat] = useState<string | null>(null)
  const [lastGain, setLastGain] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const cFiche: Character = Object.keys(perso || {}).length ? perso : defaultPerso

  const handleLevelUp = useCallback(async () => {
    if (processing) return
    setProcessing(true)
    let updatedPerso: Character = {
      ...cFiche,
      niveau: Number(cFiche.niveau) + 1,
    }
    const pvMaxKey =
      updatedPerso.pv_max !== undefined
        ? 'pv_max'
        : updatedPerso.pvMax !== undefined
          ? 'pvMax'
          : 'pv_max'

    for (const stat of [
      'pv',
      'force',
      'dexterite',
      'constitution',
      'intelligence',
      'sagesse',
      'charisme',
    ]) {
      const gain = rollDice(dice)

      setLastStat(stat)
      setLastGain(gain)
      setAnimKey((k) => k + 1)

      setTimeout(() => {
        setLastStat(null)
        setLastGain(null)
      }, 1200)

      if (stat === 'pv') {
        const currentMax = Number(
          Reflect.get(updatedPerso, pvMaxKey) ?? updatedPerso.pv ?? 0,
        )
        const newPvMax = currentMax + gain
        const currentPv = Number(updatedPerso.pv ?? 0)
        const newPv = Math.min(currentPv + gain, newPvMax)
        updatedPerso = { ...updatedPerso }
        Reflect.set(updatedPerso, pvMaxKey, newPvMax)
        updatedPerso.pv = newPv
      } else {
        updatedPerso = { ...updatedPerso }
        const prev = Number(Reflect.get(updatedPerso, stat) ?? 0)
        Reflect.set(updatedPerso, stat, prev + gain)
      }

      // Mise à jour UI uniquement — pas de sauvegarde intermédiaire
      setLocalPerso({ ...updatedPerso })
      await new Promise((resolve) => setTimeout(resolve, 1200))
    }

    // Une seule sauvegarde à la fin (au lieu de 7) → réduit les appels cloud × 7
    onUpdate(updatedPerso)
    setProcessing(false)
  }, [processing, cFiche, dice, onUpdate])

  const saveFromEditor = (edited: Character) => {
    setEditorOpen(false)
    setLocalPerso(edited)
    onUpdate(edited)
  }

  const pickPortrait = (url: string) => {
    setPortraitOpen(false)
    const next = { ...cFiche, portrait: url || undefined }
    setLocalPerso(normalizeCharacter(next))
    onUpdate(next)
  }

  // When collapsed, render only an expand button so the panel frees all space.
  // Sur téléphone la fiche a son propre onglet : on ne la replie jamais.
  if (collapsed && isDesktop) {
    return (
      <div className="relative w-0 h-0 overflow-visible flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          aria-label={t('expandPanel')}
          title={t('expandPanel')}
          className="ui-btn ui-btn-icon absolute top-0 left-0 z-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <aside
      className="ui-panel relative select-none flex-shrink-0 text-[15px] w-full md:w-[400px] px-3 pb-4 overflow-y-auto"
      style={{ boxSizing: 'border-box', overflowX: 'hidden' }}
    >
      <CharacterSheetHeader
        perso={localPerso}
        onEdit={() => setEditorOpen(true)}
        onPortrait={() => setPortraitOpen(true)}
        tab={tab}
        setTab={setTab}
        TABS={TABS}
        density={density}
        setDensity={chooseDensity}
        onCollapse={isDesktop ? () => setCollapsed(true) : undefined}
      />

      <CharacterEditor
        open={editorOpen}
        character={cFiche}
        onSave={saveFromEditor}
        onClose={() => setEditorOpen(false)}
      />
      {portraitOpen && (
        <PortraitPicker
          current={cFiche.portrait}
          onPick={pickPortrait}
          onClose={() => setPortraitOpen(false)}
        />
      )}

      {tab === 'main' && (
        <StatsTab
          perso={localPerso}
          compact={density === 'compact'}
          dice={dice}
          setDice={setDice}
          onLevelUp={handleLevelUp}
          processing={processing}
          lastStat={lastStat}
          lastGain={lastGain}
          animKey={animKey}
        />
      )}
      {tab === 'equip' && <EquipPanel perso={localPerso} compact={density === 'compact'} />}
      {tab === 'desc' && <DescriptionPanel perso={localPerso} compact={density === 'compact'} />}
    </aside>
  )
}

export default CharacterSheet

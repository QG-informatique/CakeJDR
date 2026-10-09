'use client'

import { FC, useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import StatsTab from './StatsTab'
import PortraitPicker from './PortraitPicker'
import EquipPanel from '../character/EquipPanel'
import DescriptionPanel from '../character/DescriptionPanel'
import CharacterSheetHeader, { type SheetDensity } from '../character/CharacterSheetHeader'
import CharacterEditor from '../character/CharacterEditor'
import LevelUpPanel from '../character/LevelUpPanel'
import { useT } from '@/lib/useT'
import { libraryItemOf, libraryUrl, matchingPion } from '@/lib/library'
import { useIsDesktop } from '@/lib/useIsDesktop'
import { useGameSystem } from '@/lib/roomSettings'
import {
  type Character,
  defaultCharacter,
  normalizeCharacter,
} from '@/types/character'

type Props = {
  perso: Character // Fiche perso initiale
  onUpdate: (perso: Character) => void
  /** Le MJ s'est réservé les fiches : on la lit sans la modifier. */
  readOnly?: boolean
  /** Bandeau au-dessus de la fiche (fiche d'un joueur ouverte par le MJ, fiche verrouillée). */
  notice?: React.ReactNode
  /** Montée de niveau : le MJ la fait faire, le joueur ne la lance plus lui-même. */
  canLevelUp?: boolean
  /** Joueur à qui demander les dés de la montée de niveau (le MJ lui-même sur sa fiche). */
  levelUpTarget?: { id: string; name: string } | null
}

const DENSITY_KEY = 'sheetDensity'

export const defaultPerso: Character = { ...defaultCharacter }

const CharacterSheet: FC<Props> = ({ perso, onUpdate, readOnly = false, notice, canLevelUp = false, levelUpTarget = null }) => {
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
  const system = useGameSystem()
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

  const cFiche: Character = Object.keys(perso || {}).length ? perso : defaultPerso

  // Le MJ augmente lui-même les caractéristiques : un niveau de plus, puis l'édition.
  const levelUpByHand = () => {
    onUpdate({ ...cFiche, niveau: Number(cFiche.niveau) + 1 })
    setEditorOpen(true)
  }

  const saveFromEditor = (edited: Character) => {
    setEditorOpen(false)
    setLocalPerso(edited)
    onUpdate(edited)
  }

  // Un portrait de la bibliothèque propose son pion assorti, sauf si le
  // joueur a déjà choisi un autre pion lui-même.
  const pionFor = (portrait: string | undefined) => {
    const item = libraryItemOf(portrait)
    const pion = item?.categoryId === 'portraits' ? matchingPion(item.itemId) : null
    return pion?.categoryId === 'pions' ? libraryUrl('pions', pion.item.id) : undefined
  }
  const saveImages = (next: Character) => {
    setPortraitOpen(false)
    setLocalPerso(normalizeCharacter(next))
    onUpdate(next)
  }
  const pickPortrait = (url: string) => {
    const keepPion = cFiche.pion && cFiche.pion !== pionFor(cFiche.portrait)
    const portrait = url || undefined
    saveImages({ ...cFiche, portrait, pion: keepPion ? cFiche.pion : pionFor(portrait) ?? cFiche.pion })
  }
  const pickPion = (url: string) => saveImages({ ...cFiche, pion: url || undefined })

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
      {notice}
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
        readOnly={readOnly}
      />

      <CharacterEditor
        open={editorOpen && !readOnly}
        character={cFiche}
        system={system}
        onSave={saveFromEditor}
        onClose={() => setEditorOpen(false)}
      />
      {portraitOpen && !readOnly && (
        <PortraitPicker
          current={cFiche.portrait}
          currentPion={cFiche.pion}
          name={cFiche.nom}
          onPick={pickPortrait}
          onPickPion={pickPion}
          onClose={() => setPortraitOpen(false)}
        />
      )}

      {tab === 'main' && (
        <StatsTab
          perso={localPerso}
          compact={density === 'compact'}
          system={system}
          levelUp={canLevelUp && !readOnly && system.levelUp.length > 0
            ? <LevelUpPanel target={levelUpTarget} onByHand={levelUpByHand} system={system} />
            : null}
        />
      )}
      {tab === 'equip' && <EquipPanel perso={localPerso} compact={density === 'compact'} />}
      {tab === 'desc' && <DescriptionPanel perso={localPerso} compact={density === 'compact'} />}
    </aside>
  )
}

export default CharacterSheet

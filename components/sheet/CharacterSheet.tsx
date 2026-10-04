'use client'

import { FC, useState, useEffect, useCallback } from 'react'
import { ChevronRight } from 'lucide-react'
import StatsTab from './StatsTab'
import EquipTab from './EquipTab'
import DescriptionPanel from '../character/DescriptionPanel'
import CharacterSheetHeader from '../character/CharacterSheetHeader'
import { useT } from '@/lib/useT'
import { useIsDesktop } from '@/lib/useIsDesktop'
import {
  type Character,
  type CharacterChangeHandler,
  type CustomField,
  defaultCharacter,
  normalizeCharacter,
} from '@/types/character'

type Props = {
  perso: Character // Fiche perso initiale
  onUpdate: (perso: Character) => void
  chatBoxRef?: React.RefObject<HTMLDivElement | null>
  creation?: boolean
  children?: React.ReactNode
  logoOnly?: boolean
}

export const defaultPerso: Character = { ...defaultCharacter }

/** Jet de montée de niveau (ex. « d6 ») : la fiche appartient au joueur, le tirage reste local. */
const rollDice = (dice: string): number => {
  const match = dice.match(/d(\d+)/i)
  if (!match) return 0
  const sides = parseInt(match[1] ?? '0')
  return Math.floor(Math.random() * sides) + 1
}

const CharacterSheet: FC<Props> = ({
  perso,
  onUpdate,
  creation = false,
  children,
  logoOnly = false,
}) => {
  // NE PAS relier edit à creation sauf à l'init
  const [edit, setEdit] = useState(!!creation)
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

  // Hors édition, la fiche affichée suit celle du parent. En édition, on n'y
  // touche pas : une fiche reçue entre-temps (chargement, MJ, liste mise à
  // jour) effaçait les modifications en cours avant « Enregistrer ».
  useEffect(() => {
    if (!edit) {
      const next = Object.keys(perso || {}).length ? perso : defaultPerso
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hors édition, la fiche suit celle du parent
      setLocalPerso(normalizeCharacter(next))
    }
  }, [edit, perso])

  const handleChange: CharacterChangeHandler = (field, value) => {
    setLocalPerso({ ...localPerso, [field]: value })
  }

  const [processing, setProcessing] = useState(false)
  const [dice, setDice] = useState('d6')
  const [lastStat, setLastStat] = useState<string | null>(null)
  const [lastGain, setLastGain] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)

  const cFiche: Character = edit
    ? localPerso
    : Object.keys(perso || {}).length
      ? perso
      : defaultPerso

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

  const save = () => {
    setEdit(false)
    const normalized = normalizeCharacter(localPerso)
    setLocalPerso(normalized)
    onUpdate(normalized)
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
      className={`
        ui-panel relative select-none flex-shrink-0 text-[15px]
        w-full md:w-[400px] px-3 pb-4 overflow-y-auto ${creation ? 'pt-4' : ''}
      `}
      style={{
        width: creation ? 'auto' : undefined,
        minWidth: creation ? '600px' : undefined,
        maxWidth: creation ? '100%' : undefined,
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}
    >
      {!creation && (
        <CharacterSheetHeader
          edit={edit}
          onToggleEdit={() => setEdit((v) => !v)}
          onSave={save}
          tab={tab}
          setTab={setTab}
          TABS={TABS}
          logoOnly={logoOnly}
          onCollapse={isDesktop ? () => setCollapsed(true) : undefined}
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
          onAddChamp={(champ) => {
            setLocalPerso({
              ...localPerso,
              champs_perso: [...(localPerso.champs_perso || []), champ],
            })
          }}
          onDelChamp={(id) => {
            setLocalPerso({
              ...localPerso,
              champs_perso: (localPerso.champs_perso || []).filter(
                (c: CustomField) => c.id !== id,
              ),
            })
          }}
          onUpdateChamp={(id, champ) => {
            setLocalPerso({
              ...localPerso,
              champs_perso: (localPerso.champs_perso || []).map(
                (c: CustomField) => (c.id === id ? champ : c),
              ),
            })
          }}
        />
      )}
    </aside>
  )
}

export default CharacterSheet

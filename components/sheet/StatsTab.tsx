'use client'
import { FC } from 'react'
import StatsPanel from '../character/StatsPanel'
import CompetencesPanel from '../character/CompetencesPanel'
import LevelUpPanel from '../character/LevelUpPanel'
import { type Character } from '@/types/character'

interface Props {
  perso: Character
  compact: boolean
  dice: string
  setDice: (d: string) => void
  onLevelUp: () => Promise<void>
  processing: boolean
  lastStat: string | null
  lastGain: number | null
  animKey: number
  /** Fiche verrouillée par le MJ : pas de montée de niveau. */
  readOnly?: boolean
}

const StatsTab: FC<Props> = ({
  perso,
  compact,
  dice,
  setDice,
  onLevelUp,
  processing,
  lastStat,
  lastGain,
  animKey,
  readOnly = false,
}) => (
  <>
    <StatsPanel perso={perso} compact={compact} />
    <CompetencesPanel competences={perso.competences || []} compact={compact} />
    {!readOnly && <LevelUpPanel
      dice={dice}
      setDice={setDice}
      onLevelUp={onLevelUp}
      processing={processing}
      lastStat={lastStat}
      lastGain={lastGain}
      animKey={animKey}
    />}
  </>
)

export default StatsTab

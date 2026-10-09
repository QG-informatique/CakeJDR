'use client'
import { FC } from 'react'
import StatsPanel from '../character/StatsPanel'
import CompetencesPanel from '../character/CompetencesPanel'
import { type Character } from '@/types/character'
import type { GameSystem } from '@/lib/gameSystems'

interface Props {
  perso: Character
  compact: boolean
  /** Montée de niveau, montrée au MJ seulement. */
  levelUp?: React.ReactNode
  system?: GameSystem
}

const StatsTab: FC<Props> = ({
  perso,
  compact,
  levelUp,
  system,
}) => (
  <>
    <StatsPanel perso={perso} compact={compact} system={system} />
    <CompetencesPanel competences={perso.competences || []} compact={compact} />
    {levelUp}
  </>
)

export default StatsTab

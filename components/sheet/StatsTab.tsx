'use client'
import { FC } from 'react'
import StatsPanel from '../character/StatsPanel'
import CompetencesPanel from '../character/CompetencesPanel'
import { type Character } from '@/types/character'

interface Props {
  perso: Character
  compact: boolean
  /** Montée de niveau, montrée au MJ seulement. */
  levelUp?: React.ReactNode
}

const StatsTab: FC<Props> = ({
  perso,
  compact,
  levelUp,
}) => (
  <>
    <StatsPanel perso={perso} compact={compact} />
    <CompetencesPanel competences={perso.competences || []} compact={compact} />
    {levelUp}
  </>
)

export default StatsTab

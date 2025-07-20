'use client'
import { FC } from 'react'
/* eslint-disable @typescript-eslint/no-explicit-any */
import StatsPanel from '../character/StatsPanel'
import CompetencesPanel from '../character/CompetencesPanel'
import LevelUpPanel from '../character/LevelUpPanel'

interface Props {
  edit: boolean
  perso: any
  onChange: (field: string, value: any) => void
  setLocalPerso: (p: any) => void
  localPerso: any
  dice: string
  setDice: (d: string) => void
  onLevelUp: () => Promise<void>
  processing: boolean
  lastStat: string | null
  lastGain: number | null
  animKey: number
}

const StatsTab: FC<Props> = ({
  edit,
  perso,
  onChange,
  setLocalPerso,
  localPerso,
  dice,
  setDice,
  onLevelUp,
  processing,
  lastStat,
  lastGain,
  animKey,
}) => (
  <>
    <StatsPanel edit={edit} perso={perso} onChange={onChange} />
    <CompetencesPanel
      edit={edit}
      competences={localPerso.competences || []}
      onAdd={(comp) =>
        setLocalPerso({
          ...localPerso,
          competences: [...(localPerso.competences || []), comp],
        })
      }
        onDelete={(idx) =>
          setLocalPerso({
            ...localPerso,
            competences: (localPerso.competences || []).filter((_: any, i: number) => i !== idx),
          })
      }
    />
    <LevelUpPanel
      dice={dice}
      setDice={setDice}
      onLevelUp={onLevelUp}
      processing={processing}
      lastStat={lastStat}
      lastGain={lastGain}
      animKey={animKey}
    />
  </>
)

export default StatsTab

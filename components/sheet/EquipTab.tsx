'use client'
import { FC } from 'react'
import EquipPanel from '../character/EquipPanel'
import {
  type Character,
  type CharacterChangeHandler,
  type Objet,
} from '@/types/character'

interface Props {
  edit: boolean
  localPerso: Character
  setLocalPerso: (p: Character) => void
  onChange: CharacterChangeHandler
}

const EquipTab: FC<Props> = ({ edit, localPerso, setLocalPerso, onChange }) => (
  <EquipPanel
    edit={edit}
    armes={localPerso.armes}
    armure={localPerso.armure}
    degats_armes={localPerso.degats_armes}
    modif_armure={localPerso.modif_armure}
    objets={localPerso.objets || []}
    onAddObj={(obj) =>
      setLocalPerso({
        ...localPerso,
        objets: [
          ...(localPerso.objets || []),
          { ...(obj as Objet), id: crypto.randomUUID() },
        ],
      })
    }
    onDelObj={(id) =>
      setLocalPerso({
        ...localPerso,
        objets: (localPerso.objets || []).filter((o) => o.id !== id),
      })
    }
    onChange={onChange}
  />
)

export default EquipTab

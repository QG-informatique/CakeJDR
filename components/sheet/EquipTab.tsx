'use client'
import { FC } from 'react'
/* eslint-disable @typescript-eslint/no-explicit-any */
import EquipPanel from '../character/EquipPanel'

interface Props {
  edit: boolean
  localPerso: any
  setLocalPerso: (p: any) => void
  onChange: (field: string, value: any) => void
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
        objets: [...(localPerso.objets || []), obj],
      })
    }
    onDelObj={(idx) =>
      setLocalPerso({
        ...localPerso,
        objets: (localPerso.objets || []).filter((_: any, i: number) => i !== idx),
      })
    }
    onChange={onChange}
  />
)

export default EquipTab

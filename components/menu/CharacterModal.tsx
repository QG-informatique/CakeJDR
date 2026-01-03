'use client'
import { FC } from "react"
import { useT } from '@/lib/useT'
import {
  type Character,
  type CharacterChangeHandler,
} from '@/types/character'
import StatsPanel from "../character/StatsPanel"
import EquipPanel from "../character/EquipPanel"
import DescriptionPanel from "../character/DescriptionPanel"
import CompetencesPanel from "../character/CompetencesPanel" // ← Le bon nom !

interface Props {
  open: boolean
  character: Character
  onUpdate: (c: Character) => void
  onSave: () => void
  onClose: () => void
}

const CharacterModal: FC<Props> = ({
  open,
  character,
  onUpdate,
  onSave,
  onClose,
}) => {
  const t = useT()
  if (!open || !character) return null

  const handlePanelChange: CharacterChangeHandler = (field, value) => {
    onUpdate({ ...character, [field]: value })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2"
      style={{
        background: "rgba(20,20,40,0.62)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          relative rounded-2xl shadow-xl flex flex-col w-full
          max-w-[98vw] xl:max-w-[2000px]
          bg-black/40 border border-white/10 backdrop-blur-md
          px-3 sm:px-8 py-7 h-[94vh] max-h-[98vh] min-h-[480px]
        "
      >
        <h2 className="text-2xl font-bold mb-5 tracking-wide text-white text-center">
          {t('characterEditing')}
        </h2>
        {/* Flex column: panels scrollent, boutons fixes en bas */}
        <div className="flex flex-col flex-1 min-h-0">
          <div
            className="flex flex-col lg:flex-row gap-5 flex-1 w-full min-h-0"
          >
            {/* Statistics */}
            <div
              className="flex-1 min-w-[260px] bg-white/5 rounded-xl p-4 flex flex-col"
              style={{ minWidth: 320, minHeight: 0, height: "100%", overflowY: "auto" }}
            >
              <h3 className="font-semibold text-lg mb-2 text-emerald-200">
                {t('attributes')}
              </h3>
              <StatsPanel perso={character} edit={true} onChange={handlePanelChange} />
            </div>
            {/* Equipment + Skills in the same column */}
            <div
              className="flex-1 min-w-[260px] bg-white/5 rounded-xl p-0 flex flex-col gap-3"
              style={{ minWidth: 320, minHeight: 0, height: "100%" }}
            >
              {/* Equipment (half height) */}
              <div className="flex-1 flex flex-col min-h-0 p-4 pb-2">
                <h3 className="font-semibold text-lg mb-2 text-yellow-200">
                  {t('equipment')}
                </h3>
                <EquipPanel
                  edit={true}
                  armes={character.armes || ''}
                  degats_armes={character.degats_armes || ''}
                  armure={character.armure || ''}
                  modif_armure={character.modif_armure ?? 0}
                  objets={character.objets || []}
                  onChange={handlePanelChange}
                  onAddObj={(obj) => {
                    const objets = [
                      ...(character.objets || []),
                      { ...obj, id: crypto.randomUUID() },
                    ]
                    handlePanelChange("objets", objets)
                  }}
                  onDelObj={(id) => {
                    const objets = (character.objets || []).filter(
                      (o) => o.id !== id,
                    )
                    handlePanelChange("objets", objets)
                  }}
                />
              </div>
              {/* Skills (half height) */}
              <div className="flex-1 flex flex-col min-h-0 p-4 pt-0">
                <h3 className="font-semibold text-lg mb-2 text-fuchsia-200">
                  {t('skills')}
                </h3>
                <CompetencesPanel
                  competences={character.competences || []}
                  edit={true}
                  onAdd={(comp) => {
                    const nv = [...(character.competences || []), comp]
                    handlePanelChange("competences", nv)
                  }}
                  onDelete={(id) => {
                    const nv = (character.competences || []).filter(
                      (c) => c.id !== id,
                    )
                    handlePanelChange("competences", nv)
                  }}
                />
              </div>
            </div>
            {/* Description */}
            <div
              className="flex-1 min-w-[300px] bg-white/5 rounded-xl p-4 flex flex-col"
              style={{ minWidth: 350, minHeight: 0, height: "100%", overflowY: "auto" }}
            >
              <h3 className="font-semibold text-lg mb-2 text-blue-200">
                {t('description')}
              </h3>
              <DescriptionPanel
                values={character}
                edit={true}
                onChange={handlePanelChange}
                champsPerso={character.champs_perso || []}
                onAddChamp={champ =>
                  handlePanelChange(
                    "champs_perso",
                    [...(character.champs_perso || []), champ]
                  )
                }
                onDelChamp={id =>
                  handlePanelChange(
                    "champs_perso",
                    (character.champs_perso || []).filter(c => c.id !== id)
                  )
                }
                onUpdateChamp={(id, champ) =>
                  handlePanelChange(
                    "champs_perso",
                    (character.champs_perso || []).map(c =>
                      c.id === id ? champ : c
                    )
                  )
                }
              />
            </div>
          </div>
          {/* BOUTONS fixes EN BAS - nouvelle DA */}
          <div className="flex-shrink-0 flex justify-end gap-5 w-full pt-7 pb-1 mt-2">
            <button
              onClick={onClose}
              className="
                inline-flex items-center justify-center
                px-6 py-2.5 rounded-lg font-semibold
                bg-gray-800/70 hover:bg-gray-700/80
                text-gray-200 hover:text-white
                shadow-md transition
                border border-white/10
                backdrop-blur-[2px]
              "
              style={{
                boxShadow: '0 2px 10px -2px #0006, 0 0 0 1px #fff2 inset'
              }}
            >
              {t('cancelBtn')}
            </button>
            <button
              onClick={onSave}
              className="
                inline-flex items-center justify-center
                px-7 py-2.5 rounded-lg font-semibold
                bg-blue-900/80 hover:bg-blue-700/80
                text-blue-100 hover:text-white
                shadow-lg transition
                border border-blue-200/15
                backdrop-blur-[2px]
              "
              style={{
                boxShadow: '0 2px 16px 0 #1e3a8a22, 0 0 0 1.5px #27408155 inset'
              }}
            >
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterModal


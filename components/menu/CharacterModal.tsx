"use client"
import { FC } from "react"
import { Character } from "./CharacterList"
import StatsPanel from "../character/StatsPanel"
import EquipPanel from "../character/EquipPanel"
import DescriptionPanel from "../character/DescriptionPanel"

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
  if (!open || !character) return null

  const handlePanelChange = (field: string, value: any) => {
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
        style={{ }}
      >
        <h2 className="text-2xl font-bold mb-5 tracking-wide text-white text-center">
          Édition du personnage
        </h2>
        {/* Flex column: panels scrollent, boutons fixes en bas */}
        <div className="flex flex-col flex-1 min-h-0">
          <div
            className="flex flex-col lg:flex-row gap-5 flex-1 w-full min-h-0"
            style={{ }}
          >
            {/* Statistiques */}
            <div
              className="flex-1 min-w-[260px] bg-white/5 rounded-xl p-4 flex flex-col"
              style={{ minWidth: 320, minHeight: 0, height: "100%", overflowY: "auto" }}
            >
              <h3 className="font-semibold text-lg mb-2 text-emerald-200">
                Statistiques
              </h3>
              <StatsPanel perso={character} edit={true} onChange={handlePanelChange} />
            </div>
            {/* Equipement */}
            <div
              className="flex-1 min-w-[260px] bg-white/5 rounded-xl p-4 flex flex-col"
              style={{ minWidth: 320, minHeight: 0, height: "100%", overflowY: "auto" }}
            >
              <h3 className="font-semibold text-lg mb-2 text-yellow-200">
                Équipement
              </h3>
              <EquipPanel perso={character} edit={true} onChange={handlePanelChange} />
            </div>
            {/* Description */}
            <div
              className="flex-1 min-w-[300px] bg-white/5 rounded-xl p-4 flex flex-col"
              style={{ minWidth: 350, minHeight: 0, height: "100%", overflowY: "auto" }}
            >
              <h3 className="font-semibold text-lg mb-2 text-blue-200">
                Description
              </h3>
              <DescriptionPanel
                values={character}
                edit={true}
                onChange={handlePanelChange}
                champsPerso={character.champs_perso ?? []}
                onAddChamp={champ =>
                  handlePanelChange(
                    "champs_perso",
                    [...(character.champs_perso ?? []), champ]
                  )
                }
                onDelChamp={i =>
                  handlePanelChange(
                    "champs_perso",
                    (character.champs_perso ?? []).filter((_, idx) => idx !== i)
                  )
                }
                onUpdateChamp={(i, champ) =>
                  handlePanelChange(
                    "champs_perso",
                    (character.champs_perso ?? []).map((c, idx) =>
                      idx === i ? champ : c
                    )
                  )
                }
              />
            </div>
          </div>
          {/* BOUTONS fixes EN BAS */}
          <div className="flex-shrink-0 flex justify-end gap-6 w-full pt-7 pb-1 mt-2">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-2.5 rounded-xl font-semibold shadow"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CharacterModal

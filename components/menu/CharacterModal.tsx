"use client"
import { FC } from 'react'
import CharacterSheet from '../sheet/CharacterSheet'
import { Character } from './CharacterList'

interface Props {
  open: boolean
  character: Character
  onUpdate: (c: Character) => void
  onSave: () => void
  onClose: () => void
}

const CharacterModal: FC<Props> = ({ open, character, onUpdate, onSave, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6" role="dialog" aria-modal="true">
      <div className="relative bg-gray-900 rounded-xl shadow-lg flex flex-col w-[95vw] max-w-[1400px] p-6" style={{ height: '95vh' }}>
        <CharacterSheet perso={character} onUpdate={onUpdate} creation={false} key={character.id} />
        <div className="border-t border-gray-700 mt-4 pt-4 flex justify-end gap-4">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold">Annuler</button>
          <button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}

export default CharacterModal

'use client'
import { useEffect, useState } from 'react'

// Liste des fiches dans localStorage utilisée par MenuAccueil
const STORAGE_KEY = 'jdr_characters'

type Character = { id: number, name: string }

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelect: (char: any) => void
}

export default function GMCharacterSelector({ onSelect }: Props) {
  const [chars, setChars] = useState<Character[]>([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Chargement initial + écoute des modifications
  useEffect(() => {
    const update = () => setChars(loadCharacters())
    update()
    window.addEventListener('storage', update)
    window.addEventListener('jdr_characters_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_characters_change', update as EventListener)
    }
  }, [])

  // Rafraîchissement périodique
  useEffect(() => {
    if (selectedId === null) return
    const interval = setInterval(() => {
      const list = loadCharacters()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = list.find((c: any) => c.id === selectedId)
      if (found) onSelect(found)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedId])

  const loadCharacters = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  }

  const refreshList = () => {
    setChars(loadCharacters())
  }

  const handleSelect = (id: number) => {
    setSelectedId(id)
    const list = loadCharacters()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const found = list.find((c: any) => c.id === id)
    if (found) onSelect(found)
    setOpen(false)
  }

  return (
    <div className="relative inline-block ml-2">
      <button
        onClick={() => { refreshList(); setOpen(o => !o) }}
        className="px-2 py-1 bg-gray-800 text-white rounded text-xs"
      >Changer de perso</button>
      {open && (
        <div className="absolute right-0 mt-2 bg-gray-900 text-white rounded shadow-xl p-2 z-50">
          {chars.length === 0 && <div className="px-2">Aucun perso</div>}
          {chars.map(c => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className="block text-left w-full px-3 py-1 hover:bg-gray-700 rounded"
            >{c.name}</button>
          ))}
        </div>
      )}
    </div>
  )
}

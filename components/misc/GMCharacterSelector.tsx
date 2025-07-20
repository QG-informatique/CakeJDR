'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef } from 'react'
import { User2 } from 'lucide-react'

const STORAGE_KEY = 'jdr_characters'
const SELECTED_KEY = 'selected_character'

type Character = { id: number, name?: string, nom?: string }

type Props = {
  onSelect: (char: any) => void
  buttonLabel?: string
  className?: string
}

export default function GMCharacterSelector({ onSelect, buttonLabel = 'Personnage', className = 'flex items-center gap-1 px-3 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white text-xs border border-purple-500' }: Props) {
  const [chars, setChars] = useState<Character[]>([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lecture initiale de la sélection
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY)
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj?.id !== undefined) setSelectedId(obj.id)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const update = () => setChars(loadCharacters())
    update()
    window.addEventListener('storage', update)
    window.addEventListener('jdr_characters_change', update as EventListener)
    const updateSel = () => {
      try {
        const raw = localStorage.getItem(SELECTED_KEY)
        if (raw) {
          const obj = JSON.parse(raw)
          if (obj?.id !== undefined) setSelectedId(obj.id)
        } else {
          setSelectedId(null)
        }
      } catch {}
    }
    window.addEventListener('selected_character_change', updateSel as EventListener)
    window.addEventListener('storage', updateSel)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_characters_change', update as EventListener)
      window.removeEventListener('selected_character_change', updateSel as EventListener)
      window.removeEventListener('storage', updateSel)
    }
  }, [])

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // Rafraîchir la fiche sélectionnée toutes les 5s si besoin
  useEffect(() => {
    if (selectedId === null) return
    const interval = setInterval(() => {
      const list = loadCharacters()
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

  const handleSelect = (id: number) => {
    setSelectedId(id)
    const list = loadCharacters()
    const found = list.find((c: any) => c.id === id)
    if (found) {
      try {
        localStorage.setItem(SELECTED_KEY, JSON.stringify(found))
        window.dispatchEvent(new Event('selected_character_change'))
      } catch {}
      onSelect(found)
    }
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={className}
        style={{ minWidth: 0 }}
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <User2 size={16} className="mr-1" />
        {buttonLabel}
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded shadow-lg border border-purple-500 z-50 py-1">
          {chars.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-400">Aucun perso</div>
          )}
          {chars.map((c, idx) => (
            <button
              key={`${c.id}-${idx}`}
              onClick={() => handleSelect(c.id)}
              className={`block w-full text-left px-4 py-2 text-sm
                ${selectedId === c.id ? 'bg-purple-100 dark:bg-purple-900 font-semibold' : 'hover:bg-purple-50 dark:hover:bg-purple-800'}`}
            >
              {c.nom || c.name || `Fiche #${idx + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

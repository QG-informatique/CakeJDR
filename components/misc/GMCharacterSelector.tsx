'use client'

import { useEffect, useState, useRef } from 'react'
import { useOthers } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { User2 } from 'lucide-react'

type Character = { id: string | number; name?: string; nom?: string; ownerConnectionId?: number }

type Props = {
  onSelect: (char: Character) => void
  className?: string
}

export default function GMCharacterSelector({
  onSelect,
  className = '',
}: Props) {
  const others = useOthers()
  const [chars, setChars] = useState<Character[]>([])
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useT()

  // RÃ©cupÃ¨re les personnages en temps rÃ©el via les presences
  useEffect(() => {
    const list = Array.from(others)
      .map((o) => o.presence?.character as Character | undefined)
      .filter((c): c is Character => !!c && c.id !== undefined)
    setChars(list)
  }, [others])

  // Ferme le menu au clic en dehors
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // SÃ©lection du personnage
  const handleSelect = (id: string | number) => {
    const found = chars.find((c) => c.id === id)
    if (!found) return

    setSelectedId(id)
    onSelect(found)
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative z-50 ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-center
          rounded-xl shadow border-none
          bg-black/30
          text-pink-400
          hover:bg-pink-200/10
          focus-visible:outline-pink-400
          transition duration-100
          p-2
        `}
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <User2 size={20} className="text-pink-400" />
      </button>

      {open && (
        <div
          className="
            absolute left-0 mt-2 w-56
            bg-black/80
            rounded-2xl
            shadow-2xl
            py-1
            flex flex-col
            animate-fadeIn
            backdrop-blur-[2px]
          "
        >
          {chars.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">
              {t('noActiveChar')}
            </div>
          )}
          {chars.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c.id)}
              className={`
                w-full text-left px-4 py-2 rounded-xl text-base
                font-semibold transition
                ${
                  selectedId === c.id
                    ? 'bg-pink-400/20 text-pink-200'
                    : 'hover:bg-pink-400/10 text-white/90'
                }
              `}
            >
              {c.nom || c.name || `Fiche #${idx + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}


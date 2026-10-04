'use client'

import { useEffect, useState, useRef } from 'react'
import { useOthers } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { User2 } from 'lucide-react'
import { type Character, normalizeCharacter } from '@/types/character'

type Props = {
  onSelect: (char: Character) => void
  /** Revenir à sa propre fiche après avoir consulté celle d'un joueur. */
  onSelectOwn: () => void
  /** Joueur dont la fiche est ouverte, ou null sur sa propre fiche. */
  viewingConnectionId: number | null
  className?: string
}

export default function GMCharacterSelector({
  onSelect,
  onSelectOwn,
  viewingConnectionId,
  className = '',
}: Props) {
  const others = useOthers()
  const [chars, setChars] = useState<Character[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useT()

  // Récupère les personnages en temps réel via les présences
  useEffect(() => {
    const list = Array.from(others)
      .map((o): Character | null => {
        const raw = o.presence?.character as Character | undefined
        if (!raw || raw.id === undefined) return null
        return normalizeCharacter({
          ...raw,
          // La connexion réelle, pas celle notée dans la fiche : elle change
          // à chaque reconnexion du joueur.
          ownerConnectionId: o.connectionId,
        })
      })
      .filter((c): c is Character => c !== null)
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

  const handleSelect = (char: Character) => {
    onSelect(char)
    setOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative z-50 ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          flex items-center justify-center
          rounded-xl shadow border-none
          bg-shade/30
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
            bg-shade/80
            rounded-2xl
            shadow-2xl
            py-1
            flex flex-col
            animate-fadeIn
            backdrop-blur-[2px]
          "
        >
          {viewingConnectionId !== null && (
            <button
              onClick={() => {
                onSelectOwn()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 rounded-xl text-base font-semibold transition hover:bg-pink-400/10 text-ink/90 border-b border-ink/10"
            >
              ← {t('myCharacter')}
            </button>
          )}
          {chars.length === 0 && (
            <div className="px-4 py-3 text-sm text-ink/55 text-center">
              {t('noActiveChar')}
            </div>
          )}
          {chars.map((c, idx) => (
            <button
              key={c.ownerConnectionId ?? c.id}
              onClick={() => handleSelect(c)}
              className={`
                w-full text-left px-4 py-2 rounded-xl text-base
                font-semibold transition
                ${
                  viewingConnectionId === c.ownerConnectionId
                    ? 'bg-pink-400/20 text-pink-200'
                    : 'hover:bg-pink-400/10 text-ink/90'
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


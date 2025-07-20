'use client'
import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'jdr_side_notes'
const HEIGHT_KEY = 'jdr_side_notes_height'

export default function SideNotes() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [height, setHeight] = useState<number>(192) // 48*4 = 192px par défaut
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Charger les notes et la hauteur au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setNotes(saved)
    const savedHeight = localStorage.getItem(HEIGHT_KEY)
    if (savedHeight) setHeight(Number(savedHeight))
  }, [])

  // Sauver les notes à chaque modif
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, notes)
  }, [notes])

  // Sauver la hauteur à chaque modif
  useEffect(() => {
    localStorage.setItem(HEIGHT_KEY, String(height))
  }, [height])

  // Gérer la détection de resize (on le fait à la fermeture OU quand on perd le focus)
  const handleResize = () => {
    if (textareaRef.current) {
      setHeight(textareaRef.current.offsetHeight)
    }
  }

  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 z-50"
      style={{ left: 430 }}
    >
      {open ? (
        <div
          className="
            relative rounded-r-2xl border border-white/10
            bg-black/10 backdrop-blur-[2px] shadow shadow-black/10
            text-white p-2 w-72
          "
        >
          <textarea
            ref={textareaRef}
            className="w-full bg-black/20 rounded p-1 text-sm resize-y border border-white/10"
            style={{ height }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleResize}
            onMouseUp={handleResize}
          />
          <div className="flex justify-between items-center mt-2">
            <button
              className="bg-green-600 px-2 py-0.5 rounded text-xs"
              onClick={() => localStorage.setItem(STORAGE_KEY, notes)}
            >Sauver</button>
            <button
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white px-1 rounded-r border border-white/10"
              onClick={() => {
                handleResize() // Sauvegarde hauteur avant de fermer
                setOpen(false)
              }}
              title="Fermer"
              style={{
                fontSize: '1.1rem',
                width: 26,
                height: 26,
                lineHeight: '22px'
              }}
            >
              ◀
            </button>
          </div>
        </div>
      ) : (
        <button
          className="
            bg-black/25 backdrop-blur-[2px]
            text-white rounded-r-2xl shadow-lg border border-white/10
            flex items-center justify-center
          "
          onClick={() => setOpen(true)}
          title="Notes"
          style={{
            minWidth: 32,
            minHeight: 32,
            fontSize: '1.3rem',
            padding: 0
          }}
        >
          📄
        </button>
      )}
    </div>
  )
}

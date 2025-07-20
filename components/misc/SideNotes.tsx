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
        <div className="relative bg-gray-900 text-white p-2 rounded-r w-72">
          <textarea
            ref={textareaRef}
            className="w-full bg-gray-800 p-1 text-sm rounded resize-y"
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
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-1 rounded-r"
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
          className="bg-gray-800 text-white rounded-r shadow-lg flex items-center justify-center"
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

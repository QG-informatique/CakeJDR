'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'jdr_side_notes'

export default function SideNotes() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setNotes(saved)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, notes)
  }, [notes])

  // Positionné juste à droite de la feuille de personnage (~420px)
  // pour rester visible tout en libérant le reste de l'écran.
  return (
    <div
      className="fixed top-1/2 -translate-y-1/2 z-50"
      style={{ left: 430 }}
    >
      {open ? (
        <div className="relative bg-gray-900 text-white p-2 rounded-r w-72">
          <textarea
            className="w-full h-48 bg-gray-800 p-1 text-sm rounded"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="flex justify-between items-center mt-2">
            <button
              className="bg-green-600 px-2 py-0.5 rounded text-xs"
              onClick={() => localStorage.setItem(STORAGE_KEY, notes)}
            >Sauver</button>
            <button
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-1 rounded-r"
              onClick={() => setOpen(false)}
            >
              ◀
            </button>
          </div>
        </div>
      ) : (
        <button
          className="bg-gray-800 text-white px-1 py-0.5 rounded-r"
          onClick={() => setOpen(true)}
          title="Notes"
        >
          ▶
        </button>
      )}
    </div>
  )
}

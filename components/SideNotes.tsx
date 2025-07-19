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

  return (
    <div className="fixed top-1/2 left-0 -translate-y-1/2 z-50">
      {open ? (
        <div className="relative bg-gray-900 text-white p-2 rounded-r w-64">
          <textarea
            className="w-full h-40 bg-gray-800 p-1 text-sm rounded"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <button
            className="absolute -right-4 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-1 rounded-r"
            onClick={() => setOpen(false)}
          >
            ◀
          </button>
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

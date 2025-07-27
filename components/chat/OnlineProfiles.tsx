'use client'
import { useEffect, useState } from 'react'

interface Profile { pseudo: string; color: string }

const STORAGE_KEY = 'jdr_online'

function readProfiles(): Record<string, Profile> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, Profile>
  } catch {
    return {}
  }
}

export default function OnlineProfiles() {
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})

  useEffect(() => {
    const update = () => setProfiles(readProfiles())
    update()
    window.addEventListener('storage', update)
    window.addEventListener('jdr_online_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_online_change', update as EventListener)
    }
  }, [])

  const entries = Object.entries(profiles)
  if (entries.length === 0) return null

  // flex-row-reverse : le dernier connecté apparaît à gauche de la liste
  const getTextColor = (hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#000' : '#fff'
  }

  return (
    <div
      className="flex flex-row-reverse gap-2 pointer-events-none absolute bottom-4 right-4 z-40"
    >
      {entries.map(([id, p]) => (
        <div
          key={id}
          className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: p.color, color: getTextColor(p.color) }}
        >
          {p.pseudo.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}

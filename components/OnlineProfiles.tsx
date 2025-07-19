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

  return (
    <div className="flex gap-1 mr-2">
      {entries.map(([id, p]) => (
        <div
          key={id}
          className="w-4 h-4 rounded-full border border-white"
          style={{ backgroundColor: p.color }}
          title={p.pseudo}
        />
      ))}
    </div>
  )
}

import { useEffect, useState } from 'react'

export type Profile = { pseudo: string; color: string; isMJ: boolean }

export default function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p.pseudo && p.loggedIn) {
          setProfile({ pseudo: p.pseudo, color: p.color || '#ffffff', isMJ: !!p.isMJ })
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem('jdr_profile')
        if (!raw) { setProfile(null); return }
        const p = JSON.parse(raw)
        if (p.pseudo && p.loggedIn) {
          setProfile({ pseudo: p.pseudo, color: p.color || '#ffffff', isMJ: !!p.isMJ })
        } else {
          setProfile(null)
        }
      } catch { setProfile(null) }
    }
    window.addEventListener('storage', update)
    window.addEventListener('jdr_profile_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_profile_change', update as EventListener)
    }
  }, [])

  return profile
}

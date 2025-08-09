import { useEffect } from 'react'
import type { Profile } from './useProfile'

export default function useOnlineStatus(user: string | null, profile: Profile | null) {
  useEffect(() => {
    if (!user || !profile) return
    const id = localStorage.getItem('jdr_profile_id') || crypto.randomUUID()
    localStorage.setItem('jdr_profile_id', id)
    const updateOnline = () => {
      try {
        const raw = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        const list = new Map(Object.entries(raw))
        list.set(id, { pseudo: user, color: profile.color })
        localStorage.setItem('jdr_online', JSON.stringify(Object.fromEntries(list)))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {}
    }
    updateOnline()
    const handleUnload = () => {
      try {
        const raw = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        const list = new Map(Object.entries(raw))
        list.delete(id)
        localStorage.setItem('jdr_online', JSON.stringify(Object.fromEntries(list)))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {}
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user, profile])
}

import { useEffect } from 'react'
import type { Profile } from './useProfile'

export default function useOnlineStatus(user: string | null, profile: Profile | null) {
  useEffect(() => {
    if (!user || !profile) return
    const id = localStorage.getItem('jdr_profile_id') || crypto.randomUUID()
    localStorage.setItem('jdr_profile_id', id)
    const updateOnline = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        list[id] = { pseudo: user, color: profile.color }
        localStorage.setItem('jdr_online', JSON.stringify(list))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {}
    }
    updateOnline()
    const handleUnload = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        delete list[id]
        localStorage.setItem('jdr_online', JSON.stringify(list))
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

'use client'
import { useEffect } from 'react'
import { useBroadcastEvent } from '@liveblocks/react'

export default function JoinAnnouncer() {
  const broadcast = useBroadcastEvent()
  useEffect(() => {
    try {
      const prof = JSON.parse(localStorage.getItem('jdr_profile') || '{}')
      if (prof.pseudo) {
        broadcast({
          type: 'chat',
          author: 'Système',
          text: `${prof.pseudo} a rejoint la partie`
        })
      }
    } catch {}
  }, [broadcast])
  return null
}

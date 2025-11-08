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
          author: 'System',
          text: `${prof.pseudo} joined the game`,
        } as any) // FIX: type-safe cast to RoomEvent via ambient typing
      }
    } catch {}
  }, [broadcast])
  return null
}

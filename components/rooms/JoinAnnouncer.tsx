'use client'
import { useEffect } from 'react'
import { useBroadcastEvent } from '@liveblocks/react'

export default function JoinAnnouncer() {
  // FIX: strongly type RoomEvent to avoid any
  const broadcast = useBroadcastEvent<Liveblocks['RoomEvent']>()
  useEffect(() => {
    try {
      const prof = JSON.parse(localStorage.getItem('jdr_profile') || '{}')
      if (prof.pseudo) {
        broadcast({
          type: 'chat',
          author: 'System',
          text: `${prof.pseudo} joined the game`,
        })
      }
    } catch {}
  }, [broadcast])
  return null
}

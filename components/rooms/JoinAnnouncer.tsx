'use client'
import { useEffect } from 'react'
import { useBroadcastEvent } from '@liveblocks/react'

export default function JoinAnnouncer() {
  const broadcast = useBroadcastEvent()
  useEffect(() => {
    try {
      const prof = JSON.parse(localStorage.getItem('jdr_profile') || '{}')
      if (prof.pseudo) {
        const id = crypto.randomUUID()
        const ts = Date.now()
        broadcast({
          type: 'chat',
          id,
          ts,
          author: 'System',
          text: `${prof.pseudo} joined the game`,
        } as Liveblocks['RoomEvent'])
      }
    } catch {}
  }, [broadcast])
  return null
}

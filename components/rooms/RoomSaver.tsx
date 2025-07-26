'use client'
import { useEffect, useRef } from 'react'
import { useRoom } from '@liveblocks/react'

interface Props { roomId: string }

export default function RoomSaver({ roomId }: Props) {
  const room = useRoom()

  const lastData = useRef('')

  useEffect(() => {
    async function save(force = false) {
      if (!room) return
      try {
        const chat = localStorage.getItem(`jdr_chat_${roomId}`) || '[]'
        const dice = localStorage.getItem(`jdr_dice_${roomId}`) || '[]'
        const summary = localStorage.getItem('summaryPanel_acts_v1') || '[]'
        const combined = `${chat}|${dice}|${summary}`
        if (!force && combined === lastData.current) return
        lastData.current = combined
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, chatHistory: chat, diceHistory: dice, summary })
        })
      } catch {
        // ignore
      }
    }
    const handleBeforeUnload = () => save(true)
    const interval = setInterval(() => save(false), 1800000)
    window.addEventListener('beforeunload', handleBeforeUnload)

    let prevCount = room.getOthers().length
    const unsubscribe = room.events.others.subscribe(() => {
      const count = room.getOthers().length
      if (count === 0 && prevCount > 0) {
        save(true)
      }
      prevCount = count
    })

    return () => {
      handleBeforeUnload()
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      unsubscribe()
    }
  }, [room, roomId])

  return null
}

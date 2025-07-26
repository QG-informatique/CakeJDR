'use client'
import { useEffect } from 'react'
import { useRoom } from '@liveblocks/react'

interface Props { roomId: string }

export default function RoomSaver({ roomId }: Props) {
  const room = useRoom()

  useEffect(() => {
    async function save() {
      if (!room) return
      try {
        const chat = localStorage.getItem(`jdr_chat_${roomId}`) || '[]'
        const dice = localStorage.getItem(`jdr_dice_${roomId}`) || '[]'
        const summary = localStorage.getItem('summaryPanel_acts_v1') || '[]'
        await fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, chatHistory: chat, diceHistory: dice, summary })
        })
      } catch {
        // ignore
      }
    }
    const interval = setInterval(save, 600000)
    window.addEventListener('beforeunload', save)
    return () => {
      save()
      clearInterval(interval)
      window.removeEventListener('beforeunload', save)
    }
  }, [room, roomId])

  return null
}

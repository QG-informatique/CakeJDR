'use client'
import { useEffect } from 'react'
import { useRoom } from '@liveblocks/react'

async function compress(txt: string) {
  if (typeof CompressionStream === 'undefined') {
    return new TextEncoder().encode(txt)
  }
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  writer.write(new TextEncoder().encode(txt))
  writer.close()
  const buf = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(buf)
}

export default function RoomSaver({ roomName, roomId }: { roomName: string; roomId: string }) {
  const room = useRoom()

  useEffect(() => {
    const updateStatus = async (empty: boolean) => {
      await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, empty }),
        keepalive: true,
      })
    }

    const handleUnload = async () => {
      if (room.getOthers().length === 0) {
        const history = localStorage.getItem('jdr_dice_history')
        if (history) {
          const data = await compress(history)
          navigator.sendBeacon(
            `/api/blob?filename=RoomData/${roomName}.json.gz`,
            data
          )
        }
        await updateStatus(true)
      }
    }
    updateStatus(false)
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [room, roomName, roomId])

  return null
}

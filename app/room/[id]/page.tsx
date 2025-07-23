'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LiveblocksProvider, RoomProvider, useRoom } from '@liveblocks/react'
import HomePageInner from '@/components/app/HomePageInner'

function RoomSaver({ roomName }: { roomName: string }) {
  const room = useRoom()

  useEffect(() => {
    const compress = async (txt: string) => {
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

    const handleUnload = async () => {
      if (room.getOthers().length === 0) {
        const history = localStorage.getItem('jdr_dice_history')
        if (history) {
          const data = await compress(history)
          await fetch(`/api/blob?filename=RoomData/${roomName}.json.gz`, {
            method: 'POST',
            body: data
          })
        }
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [room, roomName])

  return null
}

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()
  const [name, setName] = useState(id)

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        const rooms = data.rooms as Array<{ id: string; name: string }>
        const r = rooms.find(x => x.id === id)
        if (r?.name) setName(r.name)
      })
  }, [id])

  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || 'pk_demo'
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider id={id} initialPresence={{}}>
        <RoomSaver roomName={name} />
        <HomePageInner />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

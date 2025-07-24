'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Room } from '@/app/Room'
import HomePageInner from '@/components/app/HomePageInner'
import JoinAnnouncer from '@/components/rooms/JoinAnnouncer'
import RoomSaver from '@/components/rooms/RoomSaver'

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

  return (
    <Room id={id}>
      <RoomSaver roomName={name} roomId={id} />
      <JoinAnnouncer />
      <HomePageInner />
    </Room>
  )
}

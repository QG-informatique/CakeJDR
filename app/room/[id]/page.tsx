'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Room } from '@/app/Room'
import HomePageInner from '@/components/app/HomePageInner'
import JoinAnnouncer from '@/components/rooms/JoinAnnouncer'
import RoomSaver from '@/components/rooms/RoomSaver'

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .catch(() => {})
  }, [id])

  return (
    <Room id={id}>
      <RoomSaver roomId={id} />
      <JoinAnnouncer />
      <HomePageInner />
    </Room>
  )
}

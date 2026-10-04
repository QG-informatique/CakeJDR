'use client'
import { useParams } from 'next/navigation'
import { Room } from '@/app/Room'
import HomePageInner from '@/components/app/HomePageInner'
import JoinAnnouncer from '@/components/rooms/JoinAnnouncer'

export default function RoomPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <Room id={id}>
      <JoinAnnouncer />
      <HomePageInner />
    </Room>
  )
}

'use client'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Room } from '@/app/Room'
import HomePageInner from '@/components/app/HomePageInner'
import JoinAnnouncer from '@/components/rooms/JoinAnnouncer'

export default function RoomPage() {
  const { id } = useParams() as { id: string }

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .catch(() => {})
  }, [id])

  return (
    <Room id={id}>
      <JoinAnnouncer />
      <HomePageInner />
    </Room>
  )
}

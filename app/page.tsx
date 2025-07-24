"use client"
import HomePageInner from '@/components/app/HomePageInner'
import { Room } from './Room'
import { CollaborativeApp } from './CollaborativeApp'

export default function HomePage() {
  return (
    <Room id="lobby">
      <CollaborativeApp />
      <HomePageInner />
    </Room>
  )
}

'use client'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import HomePageInner from '@/components/app/HomePageInner'

export default function HomePage() {
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || 'pk_demo'
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider id="lobby" initialPresence={{}}>
        <HomePageInner />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

'use client'
import { ReactNode } from 'react'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import { LiveList } from '@liveblocks/client'

export default function RoomsIndexProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
  if (!key) throw new Error('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined')
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider id="rooms-index" initialPresence={{}} initialStorage={{ rooms: new LiveList([]) }}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

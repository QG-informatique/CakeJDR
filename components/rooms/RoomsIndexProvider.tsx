'use client'
import { ReactNode } from 'react'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client'

export default function RoomsIndexProvider({ children }: { children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY
  if (!key) throw new Error('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined')
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider
        id="rooms-index"
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images: new LiveMap(),
          music: new LiveObject({ id: '', playing: false }),
          summary: new LiveObject({ acts: [] }),
          events: new LiveList([]),
          rooms: new LiveList([])
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

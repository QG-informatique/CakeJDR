'use client'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import LiveAvatarStack from '../chat/LiveAvatarStack'

export default function RoomAvatarStack({ id }: { id: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images: new LiveMap(),

            music: new LiveObject({ id: '', playing: false }),
          summary: new LiveObject({ acts: [] }),

          editor: new LiveMap(),
          events: new LiveList([]),
          rooms: new LiveList([])
        }}
      >
        <ClientSideSuspense fallback={null}>
          <LiveAvatarStack className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row-reverse gap-1" size={20} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

'use client'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from '@liveblocks/react/suspense'
import LiveAvatarStack from '../chat/LiveAvatarStack'

export default function RoomAvatarStack({ id }: { id: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={undefined as unknown as Liveblocks['Storage']}
      >
        <ClientSideSuspense fallback={null}>
          <LiveAvatarStack className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row-reverse gap-1" size={20} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

'use client'
import { LiveblocksProvider, RoomProvider, ClientSideSuspense, useStorage } from '@liveblocks/react/suspense'
import { LiveList } from '@liveblocks/client'
import type { RoomInfo } from './RoomList'

interface Props {
  onSelect?: (room: RoomInfo) => void
  selectedId?: string | null
  userName?: string | null
}

function GalleryInner({ onSelect, selectedId, userName }: Props) {
  const rooms = (useStorage(root => (root as unknown as { rooms: RoomInfo[] }).rooms) as RoomInfo[]) || []

  return (
    <section
      className="rounded-xl backdrop-blur-md bg-black/18 border border-white/10 p-3 flex-grow relative overflow-hidden mb-4"
      style={{ boxShadow:'0 4px 18px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}
    >
      <h2 className="text-lg font-semibold mb-2 select-none tracking-wide">Game rooms</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <li key="create" className={`p-2 rounded-lg bg-gray-700/40 flex flex-col gap-2 ${selectedId==='create'? 'ring-2 ring-pink-400' : ''}`}
          onClick={() => onSelect?.({ id:'create', name:'', owner:userName || undefined })}
        >
          <span className="font-semibold">+ Create room</span>
        </li>
        {rooms.map(r => (
          <li
            key={r.id}
            onClick={() => onSelect?.(r)}
            className={`p-2 rounded-lg flex flex-col gap-1 cursor-pointer ${selectedId===r.id ? 'ring-2 ring-pink-400' : 'bg-gray-700/40 hover:bg-gray-700/60'}`}
          >
            <span className="truncate flex-1 flex items-center gap-1">
              {r.name} {r.owner && userName===r.owner && '👑'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function RoomGallery(props: Props) {
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider id="rooms-index" initialStorage={{ rooms: new LiveList<RoomInfo>([]) }}>
        <ClientSideSuspense fallback={null}>
          <GalleryInner {...props} />
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}

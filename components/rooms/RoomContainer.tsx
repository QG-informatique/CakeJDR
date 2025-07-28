'use client'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export type RoomData = {
  id: string
  name: string
  createdAt: string
  metadata?: Record<string, unknown>
}

interface Props {
  owner?: string | null
  selectedId?: string | null
  onSelect?: (room: RoomData) => void
}

export default function RoomContainer({ owner, selectedId, onSelect }: Props) {
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetch('/api/liveblocks/rooms')
      .then(res => res.json())
      .then(data => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let list: RoomData[] = (data.rooms || []).map((r: any) => ({
          id: String(r.id),
          name: r.metadata?.name || String(r.id),
          createdAt: String(r.createdAt),
          metadata: r.metadata as Record<string, unknown>
        }))
        if (owner) list = list.filter(r => (r.metadata as Record<string, unknown>).owner === owner)
        setRooms(list)
      })
      .catch(() => setRooms([]))
  }, [owner])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this room?')) return
    await fetch('/api/liveblocks/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    setRooms(r => r.filter(x => x.id !== id))
  }

  const cardStyle = {
    background: 'linear-gradient(145deg, rgba(34,42,60,0.42), rgba(18,23,35,0.35))',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  } as const

  return (
    <div className="rounded-xl backdrop-blur-md bg-black/20 p-4 border border-white/10 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Rooms</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div
          onClick={() => setShowCreate(true)}
          className="group relative rounded-lg p-3 cursor-pointer flex flex-col items-center justify-center min-h-[90px] text-sm font-semibold text-pink-200 bg-pink-700/40 hover:bg-pink-700/60"
        >
          <Plus className="w-5 h-5" />
          Create
        </div>
        {rooms.map(room => (
          <div
            key={room.id}
            onClick={() => onSelect?.(room)}
            className={`relative rounded-lg p-3 cursor-pointer flex flex-col gap-1 min-h-[90px] transition ${selectedId===room.id ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]' : 'hover:ring-2 hover:ring-emerald-300/40'}`}
            style={{...cardStyle, boxShadow: selectedId===room.id ? '0 0 0 1px rgba(255,255,255,0.06), 0 0 18px -6px rgba(16,185,129,0.45)' : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 6px -4px rgba(0,0,0,0.50)'}}
          >
            <span className="font-semibold text-sm truncate" title={room.name}>{room.name}</span>
            {owner && room.metadata?.owner === owner && (
              <button
                onClick={e => { e.stopPropagation(); handleDelete(room.id) }}
                className="absolute top-1 right-1 text-red-400 hover:text-red-300"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)} style={{background:'rgba(0,0,0,0.45)',backdropFilter:'blur(2px)'}}>
          <div onClick={e => e.stopPropagation()} className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80 text-center">
            <p className="mb-4">Room creation coming soon.</p>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-pink-700 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}

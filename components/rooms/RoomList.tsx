'use client'
import { useEffect, useState } from 'react'
import { useStorage } from '@liveblocks/react'
import { Lock } from 'lucide-react'

export type RoomInfo = { id: string; name: string; password?: string }

interface Props {
  onSelect?: (room: RoomInfo) => void
  selectedId?: string | null
  onCreateClick?: () => void
}

export default function RoomList({ onSelect, selectedId, onCreateClick }: Props) {
  const liveRooms = useStorage(root => root.rooms)
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const displayRooms = liveRooms ? (Array.from(liveRooms) as RoomInfo[]) : rooms
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [myRooms, setMyRooms] = useState<string[]>([])

  useEffect(() => {
    const update = () => {
      fetch('/api/rooms')
        .then(res => (res.ok ? res.json() : Promise.reject()))
        .then(data => setRooms(data.rooms || []))
        .catch(() => setRooms([]))
      try {
        const raw = localStorage.getItem('jdr_my_rooms')
        const list = raw ? JSON.parse(raw) : []
        if (Array.isArray(list)) setMyRooms(list)
        else setMyRooms([])
      } catch {
        setMyRooms([])
      }
    }
    update()
    window.addEventListener('jdr_rooms_change', update)
    return () => window.removeEventListener('jdr_rooms_change', update)
  }, [])

  const deleteRoom = async (room: RoomInfo) => {
    if (!window.confirm('Supprimer cette room ?')) return
    await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: room.id })
    })
    setRooms(r => r.filter(x => x.id !== room.id))
    window.dispatchEvent(new Event('jdr_rooms_change'))
    setMyRooms(r => {
      const next = r.filter(id => id !== room.id)
      localStorage.setItem('jdr_my_rooms', JSON.stringify(next))
      return next
    })
  }

  const joinRoom = (room: RoomInfo) => {
    if (room.password) {
      const saved = localStorage.getItem('room_pw_' + room.id)
      if (saved && saved === room.password) {
        onSelect?.(room)
        return
      }
      setJoiningId(room.id)
      setJoinPassword(saved || '')
      setErrorMsg('')
      return
    }
    onSelect?.(room)
  }

  const confirmJoin = (room: RoomInfo) => {
    if (room.password && joinPassword !== room.password) {
      setErrorMsg('Wrong password')
      return
    }
    if (room.password) {
      localStorage.setItem('room_pw_' + room.id, joinPassword)
    }
    onSelect?.(room)
    setJoiningId(null)
    setErrorMsg('')
  }

  return (
    <div className="rounded-xl backdrop-blur-md bg-black/20 p-4 border border-white/10 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">Rooms</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
        <button
          onClick={onCreateClick}
          className="flex items-center justify-center p-3 rounded-lg bg-pink-700/50 hover:bg-pink-700 text-sm font-semibold"
        >
          + Create
        </button>
        {displayRooms.map(r => (
          <div
            key={r.id}
            className={`p-3 rounded-lg cursor-pointer flex flex-col gap-1 ${selectedId===r.id ? 'ring-2 ring-pink-300' : 'bg-black/30'}`}
            onClick={() => joinRoom(r)}
          >
            <div className="flex justify-between items-center gap-1">
              <span className="truncate flex-1 flex items-center gap-1 text-sm">
                {r.password && <Lock size={12} className="text-pink-300" />} {r.name}
              </span>
              {myRooms.includes(r.id) && <span title="Creator">👑</span>}
              {myRooms.includes(r.id) && (
                <button onClick={(e)=>{e.stopPropagation();deleteRoom(r)}} className="ml-1 text-red-400" title="Delete">🗑️</button>
              )}
            </div>
            {joiningId === r.id && r.password && (
              <>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  className="w-full px-1 py-1 rounded bg-gray-800 text-white border border-white/20 text-xs"
                  placeholder="Password"
                  onKeyDown={e => { if (e.key==='Enter') confirmJoin(r) }}
                />
                {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

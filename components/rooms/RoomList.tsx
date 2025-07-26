'use client'
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'

export type RoomInfo = { id: string; name: string; password?: string }

interface Props {
  onSelect?: (room: RoomInfo) => void
  selectedId?: string | null
  onCreateClick?: () => void
}

export default function RoomList({ onSelect, selectedId, onCreateClick }: Props) {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [myRoom, setMyRoom] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setRooms(data.rooms || []))
      .catch(() => setRooms([]))
    setMyRoom(localStorage.getItem('jdr_my_room'))
  }, [])

  const deleteRoom = async (room: RoomInfo) => {
    if (!window.confirm('Supprimer cette room ?')) return
    await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: room.id })
    })
    setRooms(r => r.filter(x => x.id !== room.id))
    if (room.id === myRoom) {
      localStorage.removeItem('jdr_my_room')
      setMyRoom(null)
    }
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
    <div className="bg-black/80 text-white rounded-xl border border-white/10 shadow-xl backdrop-blur-md p-4 w-72">
      <button
        className="w-full mb-3 px-3 py-2 rounded-md bg-pink-700/60 hover:bg-pink-700 text-sm font-semibold"
        onClick={onCreateClick}
      >
        Créer une nouvelle room
      </button>
      <ul className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {rooms.map(r => (
          <li
            key={r.id}
            className={`p-2 rounded-md flex flex-col gap-1 ${selectedId===r.id ? 'bg-pink-700/40' : 'bg-gray-700/40'}`}
          >
            <div className="flex justify-between items-center gap-2">
              <span className="truncate flex-1 flex items-center gap-1">
                {r.password && <Lock size={12} className="text-pink-300" />} {r.name} {myRoom===r.id && '👑'}
              </span>
              {joiningId === r.id && r.password ? (
                <button
                  className="px-2 py-1 bg-emerald-600/70 hover:bg-emerald-600 rounded text-sm"
                  onClick={() => confirmJoin(r)}
                >
                  Entrer
                </button>
              ) : (
                <button
                  className="px-2 py-1 bg-pink-700/50 hover:bg-pink-700/70 rounded text-sm"
                  onClick={() => joinRoom(r)}
                >
                  {selectedId === r.id ? 'Choisie' : 'Sélectionner'}
                </button>
              )}
              {myRoom===r.id && (
                <button
                  className="px-2 py-1 bg-red-700/60 hover:bg-red-700 rounded text-sm"
                  onClick={() => deleteRoom(r)}
                >
                  🗑️
                </button>
              )}
            </div>
            {joiningId === r.id && r.password && (
              <>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-white/20"
                  placeholder="Mot de passe"
                  onKeyDown={e => { if (e.key==='Enter') confirmJoin(r) }}
                />
                {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

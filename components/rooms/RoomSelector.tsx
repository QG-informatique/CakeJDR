'use client'
import { useState, useEffect, useRef } from 'react'
import { Lock } from 'lucide-react'

export type RoomInfo = { id: string; name: string; password?: string }

interface Props {
  onClose?: () => void
  onSelect?: (room: RoomInfo) => void
}

export default function RoomSelector({ onClose, onSelect }: Props) {
  const [rooms, setRooms] = useState<Array<{id:string,name:string,password?:string}>>([])
  const [name, setName] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)


  // Fetch the list of existing rooms


  useEffect(() => {
    fetch('/api/rooms')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setRooms(data.rooms || []))
      .catch(() => setRooms([]))
  }, [])

  const createRoom = async () => {
    if (!name) return
    setCreating(true)
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
    if (!res.ok) { setCreating(false); return }
    const data = await res.json()
    try {
      const raw = localStorage.getItem('jdr_my_rooms')
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) {
        list.push(data.id)
        localStorage.setItem('jdr_my_rooms', JSON.stringify(list))
      }
    } catch {}
    onClose?.()
    onSelect?.({ id: data.id, name, password: password || undefined })
  }

  const joinRoom = (room: {id:string,name:string,password?:string}) => {
    if (room.password) {
      setJoiningId(room.id)
      setJoinPassword('')
      return
    }
    onClose?.()
    onSelect?.(room)
  }

  const confirmJoin = (room: {id:string,name:string,password?:string}) => {
    if (room.password && joinPassword !== room.password) return
    onClose?.()
    onSelect?.(room)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => onClose?.()}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80"
      >

      <h2 className="text-lg font-semibold mb-2">Available Rooms</h2>

      <div className="max-h-48 overflow-y-auto mb-3 pr-1">
        <ul className="space-y-1">
          {rooms.map(r => (
            <li key={r.id} className="flex flex-col gap-1">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate flex-1 flex items-center gap-1">
                  {r.password && <Lock size={12} className="text-pink-300" />} {r.name}
                </span>
                {joiningId === r.id && r.password ? (
                  <button
                    className="px-2 py-1 bg-emerald-600/70 hover:bg-emerald-600 rounded text-sm"
                    onClick={() => confirmJoin(r)}
                  >Enter</button>
                ) : (
                  <button
                    className="px-2 py-1 bg-pink-700/50 hover:bg-pink-700/70 rounded text-sm"
                    onClick={() => joinRoom(r)}
                  >Select</button>
                )}
              </div>
              {joiningId === r.id && r.password && (
                <input
                  type="password"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-white/20"
                  placeholder="Password"
                  onKeyDown={e => { if (e.key==='Enter') confirmJoin(r) }}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-white/20 pt-3">
        <input
          className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
          placeholder="Room name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') createRoom() }}
        />
        <label className="text-sm flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={withPassword}
            onChange={e => { setWithPassword(e.target.checked); if(!e.target.checked) setPassword('') }}
          />

          Password?

        </label>
        {withPassword && (
          <input
            type="password"
            className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') createRoom() }}
          />
        )}
        {creating ? (
          <div className="w-full h-2 bg-gray-700 rounded overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
          </div>
        ) : (
          <button
            className="w-full px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={createRoom}
          >
            Create
          </button>
        )}
        {errorMsg && (
          <p className="text-red-400 text-sm mt-2 text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  </div>
  )
}

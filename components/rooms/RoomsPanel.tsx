'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

interface Props { onClose?: () => void; style?: React.CSSProperties }

export default function RoomsPanel({ onClose, style }: Props) {
  const [rooms, setRooms] = useState<Array<{id:string,name:string,password?:string}>>([])
  const [name, setName] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [password, setPassword] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close the panel when clicking outside of it
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!panelRef.current) return
      if (!panelRef.current.contains(e.target as Node)) onClose?.()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Fetch the list of existing rooms
  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => setRooms(data.rooms || []))
  }, [])

  const createRoom = async () => {
    if (!name) return
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
    const data = await res.json()
    onClose?.()
    router.push(`/room/${data.id}`)
  }

  const joinRoom = (id: string) => {
    onClose?.()
    router.push(`/room/${id}`)
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-50 bg-black/80 text-white rounded-xl shadow-lg backdrop-blur p-4 w-64"
      style={style}
    >
      <h2 className="text-lg font-semibold mb-2">Available Rooms</h2>
      <div className="max-h-48 overflow-y-auto mb-3 pr-1">
        <ul className="space-y-1">
          {rooms.map(r => (
            <li key={r.id} className="flex justify-between items-center gap-2">
              <span className="truncate flex-1 flex items-center gap-1">
                {r.password && <Lock size={12} className="text-pink-300" />} {r.name}
              </span>
              <button
                className="px-2 py-1 bg-pink-700/50 hover:bg-pink-700/70 rounded text-sm"
                onClick={() => joinRoom(r.id)}
              >
                Join
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-white/20 pt-3">
        <input
          className="w-full mb-2 px-2 py-1 rounded bg-white border text-black"
          placeholder="Room name"
          value={name}
          onChange={e => setName(e.target.value)}
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
            className="w-full mb-2 px-2 py-1 rounded bg-white border text-black"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        )}
        <button
          className="w-full px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
          onClick={createRoom}
        >
          Create
        </button>
      </div>
    </div>
  )
}

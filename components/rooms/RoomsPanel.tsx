'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

interface Props { onClose?: () => void }

export default function RoomsPanel({ onClose }: Props) {
  const [rooms, setRooms] = useState<Array<{id:string,name:string,password?:string}>>([])
  const [name, setName] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()


  // Fetch the list of existing rooms


  useEffect(() => {
    fetch('/api/rooms')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setRooms(data.rooms || []))
      .catch(() => setRooms([]))
  }, [])

  const createRoom = async () => {
    if (!name) return
    try {
      const prof = JSON.parse(localStorage.getItem('jdr_profile') || '{}')
      if (!prof.isMJ) { setErrorMsg('Active MJ mode before creating a room'); return }
      if (localStorage.getItem('jdr_my_room')) { setErrorMsg('You already created a room'); return }
    } catch {}
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
    if (!res.ok) return
    const data = await res.json()
    localStorage.setItem('jdr_my_room', data.id)
    onClose?.()
    router.push(`/room/${data.id}`)
  }

  const joinRoom = (room: {id:string;name:string;password?:string}) => {
    if (room.password) {
      const pwd = prompt('Enter room password')
      if (pwd !== room.password) { alert('Incorrect password'); return }
    }
    onClose?.()
    router.push(`/room/${room.id}`)
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
            <li key={r.id} className="flex justify-between items-center gap-2">
              <span className="truncate flex-1 flex items-center gap-1">
                {r.password && <Lock size={12} className="text-pink-300" />} {r.name}
              </span>
              <button
                className="px-2 py-1 bg-pink-700/50 hover:bg-pink-700/70 rounded text-sm"
                onClick={() => joinRoom(r)}
              >

                Join

              </button>
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
          />
        )}
        <button
          type="button"
          className="w-full px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          onClick={createRoom}
        >

          Create

        </button>
        {errorMsg && (
          <p className="text-red-400 text-sm mt-2 text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<{id:string,name:string}[]>([])
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [withPassword, setWithPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

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
    try {
      const raw = localStorage.getItem('jdr_my_rooms')
      const list = raw ? JSON.parse(raw) : []
      if (Array.isArray(list)) {
        list.push(data.id)
        localStorage.setItem('jdr_my_rooms', JSON.stringify(list))
      }
    } catch {}
    router.push(`/room/${data.id}`)
  }

  const joinRoom = (id:string) => {
    router.push(`/room/${id}`)
  }

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl mb-4">Available Rooms</h1>



      <ul className="mb-6">
        {rooms.map(r => (
          <li key={r.id} className="mb-2">
            {r.name}

            <button onClick={() => joinRoom(r.id)} className="ml-2 underline">Join</button>



          </li>
        ))}
      </ul>

      <details className="mb-4" open={showCreate}>
        <summary
          className="cursor-pointer select-none py-1 px-2 bg-purple-700/60 rounded"
          onClick={() => setShowCreate(v => !v)}
        >

          Create a new room



        </summary>
        {showCreate && (
          <div className="mt-3 space-y-2 text-black">
            <input

              placeholder="Room name"


              value={name}
              onChange={e => setName(e.target.value)}
              className="px-2 py-1 w-full"
            />
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={withPassword}
                onChange={e => {
                  setWithPassword(e.target.checked)
                  if (!e.target.checked) setPassword('')
                }}
              />

              Password protected

            </label>
            {withPassword && (
              <input
                type="password"

                placeholder="Password"


                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-2 py-1 w-full"
              />
            )}
            <button
              onClick={createRoom}
              className="px-4 py-2 bg-blue-600 rounded text-white w-full"
            >

              Confirm

            </button>
            {errorMsg && (
              <p className="text-red-400 text-sm text-center mt-2">{errorMsg}</p>
            )}
          </div>
        )}
      </details>
    </div>
  )
}

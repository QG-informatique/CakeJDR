'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoomsDropdown({ onClose }: { onClose?: () => void }) {
  const [rooms, setRooms] = useState<{id:string,name:string}[]>([])
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [withPassword, setWithPassword] = useState(false)
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
    onClose?.()
    router.push(`/room/${data.id}`)
  }

  const joinRoom = (id: string) => {
    onClose?.()
    router.push(`/room/${id}`)
  }

  return (
    <div className="absolute left-0 right-0 top-20 mx-auto max-w-sm bg-black/80 text-white p-4 rounded-xl shadow-lg backdrop-blur-md z-50">
      <h2 className="text-lg mb-2 font-semibold">Salles disponibles</h2>
      <ul className="mb-4 space-y-1">
        {rooms.map(r => (
          <li key={r.id} className="flex justify-between items-center">
            <span>{r.name}</span>
            <button onClick={() => joinRoom(r.id)} className="underline text-sm">Rejoindre</button>
          </li>
        ))}
      </ul>

      <details open={showCreate} className="text-white">
        <summary
          className="cursor-pointer select-none py-1 px-2 bg-purple-700/60 rounded"
          onClick={() => setShowCreate(v => !v)}
        >
          Créer une salle
        </summary>
        {showCreate && (
          <div className="mt-3 space-y-2 text-black">
            <input
              placeholder="Nom de la salle"
              value={name}
              onChange={e => setName(e.target.value)}
              className="px-2 py-1 w-full"
            />
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={withPassword}
                onChange={e => { setWithPassword(e.target.checked); if(!e.target.checked) setPassword('') }}
              />
              Protéger par mot de passe
            </label>
            {withPassword && (
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-2 py-1 w-full"
              />
            )}
            <button onClick={createRoom} className="px-4 py-2 bg-blue-600 rounded text-white w-full">Valider</button>
          </div>
        )}
      </details>
    </div>
  )
}

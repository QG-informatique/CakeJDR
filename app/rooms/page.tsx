'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<{id:string,name:string}[]>([])
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
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
    router.push(`/room/${data.id}`)
  }

  const joinRoom = (id:string) => {
    router.push(`/room/${id}`)
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl mb-4">Salles disponibles</h1>
      <ul className="mb-6">
        {rooms.map(r => (
          <li key={r.id} className="mb-2">
            {r.name} <button onClick={() => joinRoom(r.id)} className="ml-2 underline">Rejoindre</button>
          </li>
        ))}
      </ul>
      <div className="space-y-2">
        <input placeholder="Nom de la salle" value={name} onChange={e=>setName(e.target.value)} className="text-black px-2 py-1" />
        <input placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)} className="text-black px-2 py-1" type="password" />
        <button onClick={createRoom} className="px-4 py-2 bg-blue-600 rounded">Créer</button>
      </div>
    </div>
  )
}

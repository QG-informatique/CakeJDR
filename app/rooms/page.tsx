'use client'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { useRouter } from 'next/navigation'
import RoomAvatarStack from '@/components/rooms/RoomAvatarStack'

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Array<{ id: string; name: string; createdAt?: string; updatedAt?: string; usersConnected?: number }>>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [withPassword, setWithPassword] = useState(false)
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()
  const t = useT()

  useEffect(() => {
    fetch('/api/rooms/list')
      .then(res => res.json())
      .then(data => {
        setRooms(Array.isArray(data.rooms) ? data.rooms : [])
        const saved = localStorage.getItem('jdr_my_room')
        if (saved) {
          const match = data.rooms?.find((r: { id: string }) => r.id === saved)
          if (match) setSelectedId(saved)
        }
      })
  }, [])

  const createRoom = async () => {
    if (!name || creating) return
    if (localStorage.getItem('jdr_my_room')) {
      setErrorMsg(t('alreadyCreatedRoom'))
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || t('creationFailed'))
        return
      }
      const data = await res.json()
      const newRoom = { id: data.id, name, createdAt: new Date().toISOString() }
      setRooms(r => (r.some(x => x.id === newRoom.id) ? r : [...r, newRoom]))
      setSelectedId(newRoom.id)
      localStorage.setItem('jdr_my_room', newRoom.id)
      setName('')
      setPassword('')
      setShowCreate(false)
    } finally {
      setCreating(false)
    }
  }

  const joinRoom = (id: string) => {
    localStorage.setItem('jdr_my_room', id)
    router.push(`/room/${id}`)
  }

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl mb-4">{t('availableRooms')}</h1>



      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6 pb-1">
        {rooms.map(r => (
          <div
            key={r.id}
            onClick={() => { setSelectedId(r.id); localStorage.setItem('jdr_my_room', r.id) }}
            className={`p-3 rounded-lg flex flex-col gap-2 cursor-pointer ${selectedId===r.id ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]' : 'bg-black/30 hover:ring-2 hover:ring-emerald-300/40'}`}
          >
            <span className="truncate block">{r.name || t('unnamed')}</span>
            <span className="text-xs text-white/60">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>

            <RoomAvatarStack id={r.id} />

            <button
              className="text-sm underline"
              onClick={e => { e.stopPropagation(); joinRoom(r.id) }}
            >
              {t('enter')}
            </button>
          </div>
        ))}
      </div>

      <details className="mb-4" open={showCreate}>
        <summary
          className="cursor-pointer select-none py-1 px-2 bg-purple-700/60 rounded"
          onClick={() => setShowCreate(v => !v)}
        >

          {t('createRoom')}



        </summary>
        {showCreate && (
          <div className="mt-3 space-y-2 text-black">
            <input

              placeholder={t('roomName')}


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

              {t('passwordProtected')}

            </label>
            {withPassword && (
              <input
                type="password"

                placeholder={t('password')}


                value={password}
                onChange={e => setPassword(e.target.value)}
                className="px-2 py-1 w-full"
              />
            )}
            <button
              onClick={createRoom}
              disabled={creating}
              className="px-4 py-2 bg-blue-600 rounded text-white w-full disabled:opacity-50"
            >
              {creating ? t('creating') : t('confirm')}
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

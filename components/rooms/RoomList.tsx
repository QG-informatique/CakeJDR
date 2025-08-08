'use client'
import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { Lock } from 'lucide-react'
import RoomAvatarStack from './RoomAvatarStack'

export type RoomInfo = {
  id: string
  name: string
  password?: string
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
}

interface Props {
  onSelect?: (room: RoomInfo) => void
  selectedId?: string | null
  onCreateClick?: () => void
}

export async function fetchRooms() {
  const res = await fetch('/api/rooms/list')
  if (!res.ok) throw new Error('failed')
  const data = await res.json()
  return Array.isArray(data.rooms) ? (data.rooms as RoomInfo[]) : []
}

export default function RoomList({ onSelect, selectedId, onCreateClick }: Props) {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [myRoom, setMyRoom] = useState<string | null>(null)
  const [revealIds, setRevealIds] = useState<Record<string, boolean>>({})
  const [verifying, setVerifying] = useState(false)
  const t = useT()

  useEffect(() => {
    const update = () => {
      fetchRooms()
        .then(setRooms)
        .catch(() => setRooms([]))
      setMyRoom(localStorage.getItem('jdr_my_room'))
    }
    update()
    window.addEventListener('jdr_rooms_change', update)
    return () => window.removeEventListener('jdr_rooms_change', update)
  }, [])

  const deleteRoom = async (room: RoomInfo) => {
    if (!window.confirm(t('deleteRoomConfirm'))) return
    await fetch('/api/rooms', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: room.id })
    })
    setRooms(r => r.filter(x => x.id !== room.id))
    window.dispatchEvent(new Event('jdr_rooms_change'))
    if (room.id === myRoom) {
      localStorage.removeItem('jdr_my_room')
      setMyRoom(null)
    }
  }

  const renameRoom = async (room: RoomInfo) => {
    const newName = window.prompt('Nouveau nom ?', room.name)
    if (!newName || newName === room.name) return
    await fetch('/api/rooms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: room.id, name: newName })
    })
    setRooms(r => r.map(x => x.id === room.id ? { ...x, name: newName } : x))
    window.dispatchEvent(new Event('jdr_rooms_change'))
  }

  // --- NEW: vérification côté serveur
  const verifyPassword = async (roomId: string, password: string) => {
    const res = await fetch('/api/rooms/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: roomId, password })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Invalid password')
    }
    return true
  }

  const joinRoom = async (room: RoomInfo) => {
    // Room protégée → on tente auto-join avec mot de passe local (si stocké),
    // sinon on affiche le champ
    if (room.password) {
      const saved = localStorage.getItem('room_pw_' + room.id) || ''
      if (saved) {
        try {
          setVerifying(true); setErrorMsg('')
          await verifyPassword(room.id, saved)
          onSelect?.(room)
          return
        } catch {
          // mauvais mot de passe stocké → on demande à l’utilisateur
        } finally {
          setVerifying(false)
        }
      }
      setJoiningId(room.id)
      setJoinPassword(saved)
      setErrorMsg('')
      return
    }
    onSelect?.(room)
  }

  const confirmJoin = async (room: RoomInfo) => {
    try {
      setVerifying(true); setErrorMsg('')
      await verifyPassword(room.id, joinPassword)
      // Option: mémoriser pour confort (tu peux supprimer si tu préfères)
      if (room.password) {
        localStorage.setItem('room_pw_' + room.id, joinPassword)
      }
      onSelect?.(room)
      setJoiningId(null)
      setErrorMsg('')
    } catch {
      setErrorMsg(t('wrongPassword'))
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="rounded-xl backdrop-blur-md bg-black/20 p-4 border border-white/10 shadow-lg">
      <h2 className="text-lg font-semibold mb-2">{t('rooms')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-3">
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center justify-center p-3 rounded-lg bg-[#ff90cc]/60 hover:bg-[#ff90cc] text-center"
        >
          <span className="text-2xl">🧁</span>
          <span className="text-sm font-semibold mt-1">{t('createRoom')}</span>
        </button>
        {rooms.map(r => (
          <div
            key={r.id}
            className={`relative p-3 rounded-lg cursor-pointer flex flex-col gap-1 ${selectedId===r.id ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]' : 'bg-black/30 hover:ring-2 hover:ring-emerald-300/40'}`}
            onClick={() => joinRoom(r)}
          >
            <div className="flex justify-between items-center gap-1">
              <span className="truncate flex-1 flex items-center gap-1 text-sm">
                {r.password && <Lock size={12} className="text-pink-300" />} {r.name || t('unnamed')}
              </span>
              {myRoom===r.id && <span title={t('creator')}>👑</span>}
              {myRoom===r.id && (
                <>
                  <button onClick={(e)=>{e.stopPropagation();renameRoom(r)}} className="ml-1 text-yellow-300" title={t('rename')}>✏️</button>
                  <button onClick={(e)=>{e.stopPropagation();deleteRoom(r)}} className="ml-1 text-red-400" title={t('delete')}>🗑️</button>
                </>
              )}
            </div>
            <span className="text-xs text-white/60 truncate">
              {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : new Date(r.createdAt ?? '').toLocaleDateString()}
            </span>
            <RoomAvatarStack id={r.id} />
            <span
              className="text-[10px] text-white/40 cursor-pointer select-none"
              onClick={e => { e.stopPropagation(); setRevealIds(prev => ({ ...prev, [r.id]: !prev[r.id] })) }}
            >
              {revealIds[r.id] ? r.id : t('idLabel')}
            </span>

            {joiningId === r.id && r.password && (
              <>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  className="w-full px-1 py-1 rounded bg-gray-800 text-white border border-white/20 text-xs"
                  placeholder={t('password')}
                  onKeyDown={e => { if (e.key==='Enter') confirmJoin(r) }}
                  disabled={verifying}
                />
                {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
                {verifying && <p className="text-emerald-300 text-[10px]">{t('verifying' as never) ?? 'Vérification…'}</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

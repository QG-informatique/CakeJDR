'use client'
import { useState, useEffect, useRef } from 'react'
import { useT } from '@/lib/useT'
import { Lock } from 'lucide-react'

export type RoomInfo = {
  id: string
  name: string
  hasPassword?: boolean // FIX: boolean flag only
  createdAt?: string
  updatedAt?: string
}

interface Props {
  onClose?: () => void
  onSelect?: (room: RoomInfo) => void
}

export default function RoomSelector({ onClose, onSelect }: Props) {
  const [rooms, setRooms] = useState<RoomInfo[]>([])
  const [name, setName] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinPassword, setJoinPassword] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)
  const t = useT()


  // Fetch the list of existing rooms


  useEffect(() => {
    fetch('/api/rooms/list')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setRooms(data.rooms || []))
      .catch(() => setRooms([]))
  }, [])

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

  const createRoom = async () => {
    if (!name) return
    if (localStorage.getItem('jdr_my_room')) { setErrorMsg(t('alreadyCreatedRoom')); return }
    setCreating(true)
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
    if (!res.ok) { setCreating(false); return }
    const data = await res.json()
    localStorage.setItem('jdr_my_room', data.id)
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw) {
        const prof = JSON.parse(raw)
        prof.isMJ = true
        localStorage.setItem('jdr_profile', JSON.stringify(prof))
        window.dispatchEvent(new Event('jdr_profile_change'))
      }
    } catch {}
    onClose?.()
    onSelect?.({ id: data.id, name, hasPassword: Boolean(password), createdAt: new Date().toISOString() })
  }

  const joinRoom = (room: RoomInfo) => {
    if (room.hasPassword) {
      setJoiningId(room.id)
      setJoinPassword('')
      return
    }
    onClose?.()
    onSelect?.(room)
  }

  const confirmJoin = async (room: RoomInfo) => {
    try {
      if (room.hasPassword) {
        await verifyPassword(room.id, joinPassword)
      }
      onClose?.()
      onSelect?.(room)
    } catch {
      // keep modal open
      return
    }
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

      <h2 className="text-lg font-semibold mb-2">{t('availableRooms')}</h2>

      <div className="max-h-48 overflow-y-auto mb-3 pr-1">
        <ul className="space-y-1">
          {rooms.map(r => (
            <li key={r.id} className="flex flex-col gap-1">
              <div className="flex justify-between items-center gap-2">
                <span className="truncate flex-1 flex items-center gap-1">
                  {r.hasPassword && <Lock size={12} className="text-pink-300" />} {r.name || t('unnamed')}
                </span>
                {joiningId === r.id && r.hasPassword ? (
                  <button
                    className="px-2 py-1 bg-emerald-600/70 hover:bg-emerald-600 rounded text-sm"
                    onClick={() => confirmJoin(r)}
                  >{t('enter')}</button>
                ) : (
                  <button
                    className="px-2 py-1 bg-pink-700/50 hover:bg-pink-700/70 rounded text-sm"
                    onClick={() => joinRoom(r)}
                  >{t('select')}</button>
                )}
              </div>
              <span className="text-xs text-white/60">
                {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : new Date(r.createdAt ?? '').toLocaleDateString()}
              </span>
              {joiningId === r.id && r.hasPassword && (
                <input
                  type="password"
                  value={joinPassword}
                  onChange={e => setJoinPassword(e.target.value)}
                  className="w-full px-2 py-1 rounded bg-gray-800 text-white border border-white/20"
                  placeholder={t('password')}
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
          placeholder={t('roomName')}
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

          {t('password')}?

        </label>
        {withPassword && (
          <input
            type="password"
            className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
            placeholder={t('password')}
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
            {t('create')}
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

'use client'
import { useState } from 'react'
import type { RoomInfo } from './RoomList'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (room: RoomInfo) => void
}

export default function RoomCreateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [withPassword, setWithPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!open) return null

  const createRoom = async () => {
    if (!name) return
    try {
      const prof = JSON.parse(localStorage.getItem('jdr_profile') || '{}')
      if (!prof.isMJ) { setErrorMsg('Active MJ mode before creating a room'); return }
      if (localStorage.getItem('jdr_my_room')) { setErrorMsg('You already created a room'); return }
    } catch {}
    setCreating(true)
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
    if (!res.ok) { setCreating(false); return }
    const data = await res.json()
    localStorage.setItem('jdr_my_room', data.id)
    onCreated?.({ id: data.id, name, password: password || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} style={{ background:'rgba(0,0,0,0.45)', backdropFilter:'blur(2px)' }}>
      <div onClick={e => e.stopPropagation()} className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80">
        <h2 className="text-lg font-semibold mb-2">Créer une room</h2>
        <input
          className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
          placeholder="Nom"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter') createRoom() }}
        />
        <label className="text-sm flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={withPassword}
            onChange={e => { setWithPassword(e.target.checked); if(!e.target.checked) setPassword('') }}
          />
          Mot de passe ?
        </label>
        {withPassword && (
          <input
            type="password"
            className="w-full mb-2 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') createRoom() }}
          />
        )}
        {creating ? (
          <div className="w-full h-2 bg-gray-700 rounded overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 animate-pulse" style={{ width:'100%' }} />
          </div>
        ) : (
          <button
            className="w-full px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={createRoom}
          >
            Créer
          </button>
        )}
        {errorMsg && (
          <p className="text-red-400 text-sm mt-2 text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { RoomInfo } from './RoomList'
import { useT } from '@/lib/useT'
import { createRoom as createRoomApi } from '@/lib/roomsApi'
import { DEFAULT_SYSTEM, GAME_SYSTEMS, GAME_SYSTEM_IDS, type GameSystemId } from '@/lib/gameSystems'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (room: RoomInfo) => void
}

export default function RoomCreateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [system, setSystem] = useState<GameSystemId>(DEFAULT_SYSTEM)
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const t = useT()

  if (!open) return null

  const createRoom = async () => {
    if (!name || creating) return
    setCreating(true)
    setErrorMsg('')
    try {
      const data = await createRoomApi({ name, system })
      const room = {
        id: data.id,
        name,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('jdr_my_room', data.id)
      window.dispatchEvent(new Event('jdr_rooms_change'))
      onCreated?.(room)
      onClose()
    } catch (error) {
      // Le serveur refuse au-delà de MAX_ROOMS_PER_ACCOUNT tables.
      const message = error instanceof Error ? error.message : ''
      setErrorMsg(message === 'room limit reached' ? t('roomLimitReached') : message || t('creationFailed'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div onClick={(e) => e.stopPropagation()} className="bg-shade/80 text-ink rounded-2xl border border-ink/10 shadow-2xl backdrop-blur-md p-5 w-80">
        <h2 className="text-lg font-semibold mb-2">{t('createRoom')}</h2>
        <input
          className="w-full mb-2 px-2 py-1 rounded bg-surface text-ink placeholder-ink border border-ink/20 focus:outline-none focus:ring-2 focus:ring-gm/30"
          placeholder={t('name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void createRoom() }}
        />
        <fieldset className="mb-3 flex flex-col gap-1.5">
          <legend className="mb-1 text-sm text-ink/70">{t('gameSystem')}</legend>
          {GAME_SYSTEM_IDS.map((id) => (
            <label
              key={id}
              className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-sm ${system === id ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-ink/15 hover:bg-surface-hover'}`}
            >
              <input
                type="radio"
                name="game-system"
                className="mt-1"
                checked={system === id}
                onChange={() => setSystem(id)}
              />
              <span className="flex flex-col">
                <span className="font-semibold">{GAME_SYSTEMS[id].name}</span>
                <span className="text-xs text-ink/60">{t(GAME_SYSTEMS[id].pitch)}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {creating ? (
          <div className="w-full h-2 bg-surface-hover rounded overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '100%' }} />
          </div>
        ) : (
          <button
            className="w-full px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={() => void createRoom()}
          >
            {t('createRoom')}
          </button>
        )}
        {errorMsg && (
          <p className="text-red-400 text-sm mt-2 text-center">{errorMsg}</p>
        )}
      </div>
    </div>
  )
}

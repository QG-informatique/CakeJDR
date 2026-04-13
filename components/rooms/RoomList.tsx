'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { Lock } from 'lucide-react'
import RoomAvatarStack from './RoomAvatarStack'
import {
  deleteRoomById,
  fetchRooms as fetchRoomsApi,
  renameRoomById,
  verifyRoomPassword,
} from '@/lib/roomsApi'

export type RoomInfo = {
  id: string
  name: string
  hasPassword?: boolean
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
}

interface Props {
  onSelect?: (room: RoomInfo) => void
  onEnter?: (room: RoomInfo) => void
  selectedId?: string | null
  onCreateClick?: () => void
}

export async function fetchRooms() {
  return (await fetchRoomsApi()) as RoomInfo[]
}

export default function RoomList({
  onSelect,
  onEnter,
  selectedId,
  onCreateClick,
}: Props) {
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
    await deleteRoomById(room.id)
    setRooms((r) => r.filter((x) => x.id !== room.id))
    window.dispatchEvent(new Event('jdr_rooms_change'))
    if (room.id === myRoom) {
      localStorage.removeItem('jdr_my_room')
      setMyRoom(null)
    }
  }

  const renameRoom = async (room: RoomInfo) => {
    const newName = window.prompt('Nouveau nom ?', room.name)
    if (!newName || newName === room.name) return
    await renameRoomById(room.id, newName)
    setRooms((r) => r.map((x) => (x.id === room.id ? { ...x, name: newName } : x)))
    window.dispatchEvent(new Event('jdr_rooms_change'))
  }

  const verifyPassword = async (roomId: string, password: string) => {
    await verifyRoomPassword(roomId, password)
    return true
  }

  const handleEnter = (room: RoomInfo) => {
    onSelect?.(room)
    onEnter?.(room)
  }

  const joinRoom = async (room: RoomInfo) => {
    if (room.hasPassword) {
      const saved = localStorage.getItem('room_pw_' + room.id) || ''
      if (saved) {
        try {
          setVerifying(true)
          setErrorMsg('')
          await verifyPassword(room.id, saved)
          handleEnter(room)
          return
        } catch {
          // Fall through and show the password prompt.
        } finally {
          setVerifying(false)
        }
      }
      setJoiningId(room.id)
      setJoinPassword(saved)
      setErrorMsg('')
      return
    }
    handleEnter(room)
  }

  const confirmJoin = async (room: RoomInfo) => {
    try {
      setVerifying(true)
      setErrorMsg('')
      await verifyPassword(room.id, joinPassword)
      if (room.hasPassword) {
        localStorage.setItem('room_pw_' + room.id, joinPassword)
      }
      handleEnter(room)
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
        {rooms.map((r) => (
          <div
            key={r.id}
            className={`relative p-3 rounded-lg cursor-pointer flex flex-col gap-1 ${selectedId === r.id ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]' : 'bg-black/30 hover:ring-2 hover:ring-emerald-300/40'}`}
            onDoubleClick={() => joinRoom(r)}
          >
            <div className="flex justify-between items-center gap-1">
              <span className="truncate flex-1 flex items-center gap-1 text-sm">
                {r.hasPassword && <Lock size={12} className="text-pink-300" />} {r.name || t('unnamed')}
              </span>
              {myRoom === r.id && <span title={t('creator')}>👑</span>}
              {myRoom === r.id && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); void renameRoom(r) }} className="ml-1 text-yellow-300" title={t('rename')}>✏️</button>
                  <button onClick={(e) => { e.stopPropagation(); void deleteRoom(r) }} className="ml-1 text-red-400" title={t('delete')}>🗑️</button>
                </>
              )}
            </div>
            <span className="text-xs text-white/60 truncate">
              {r.updatedAt
                ? new Date(r.updatedAt).toLocaleDateString()
                : r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString()
                  : ''}
            </span>
            <RoomAvatarStack id={r.id} />
            <span
              className="text-[10px] text-white/40 cursor-pointer select-none"
              onClick={(e) => { e.stopPropagation(); setRevealIds((prev) => ({ ...prev, [r.id]: !prev[r.id] })) }}
            >
              {revealIds[r.id] ? r.id : t('idLabel')}
            </span>

            {joiningId === r.id && r.hasPassword && (
              <>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-1 py-1 rounded bg-gray-800 text-white border border-white/20 text-xs"
                  placeholder={t('password')}
                  onKeyDown={(e) => { if (e.key === 'Enter') void confirmJoin(r) }}
                  disabled={verifying}
                />
                {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
                {verifying && (
                  <p className="text-emerald-300 text-[10px]">
                    {t('verifying')}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

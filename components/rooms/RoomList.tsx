'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { CheckCircle2, Lock, LogIn } from 'lucide-react'
import RoomAvatarStack from './RoomAvatarStack'
import {
  deleteRoomById,
  fetchRooms as fetchRoomsApi,
  joinRoomByCode,
  ownsRoom,
  renameRoomById,
  verifyAndStoreRoomToken,
} from '@/lib/roomsApi'
import { fetchAdminStatus } from '@/lib/adminApi'

export type RoomInfo = {
  id: string
  name: string
  hasPassword?: boolean
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
  /** Rôle de l'appelant dans cette table : `gm` ou `player`. */
  role?: string
  /** Code d'invitation, renvoyé uniquement au MJ. */
  joinCode?: string
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
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

  // Le badge admin ne sert qu'à afficher les boutons : le serveur revérifie tout.
  useEffect(() => {
    fetchAdminStatus()
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => setIsAdmin(false))
  }, [])

  /** Gérable si on détient le secret de propriété de la room, ou si on est admin. */
  const canManage = (roomId: string) => isAdmin || ownsRoom(roomId)

  /** Rejoint une table via son code d'invitation : le seul moyen d'y accéder. */
  const joinByCode = async () => {
    const code = inviteCode.trim()
    if (!code || joining) return
    setJoining(true)
    setErrorMsg('')
    try {
      await joinRoomByCode(code)
      setInviteCode('')
      const next = await fetchRooms()
      setRooms(next)
      window.dispatchEvent(new Event('jdr_rooms_change'))
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Code invalide')
    } finally {
      setJoining(false)
    }
  }

  const deleteRoom = async (room: RoomInfo) => {
    if (!window.confirm(t('deleteRoomConfirm'))) return
    try {
      await deleteRoomById(room.id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Suppression refusée')
      return
    }
    setRooms((r) => r.filter((x) => x.id !== room.id))
    window.dispatchEvent(new Event('jdr_rooms_change'))
    if (room.id === myRoom) {
      localStorage.removeItem('jdr_my_room')
      setMyRoom(null)
    }
  }

  const renameRoom = async (room: RoomInfo) => {
    const newName = window.prompt(t('newNamePrompt'), room.name)
    if (!newName || newName === room.name) return
    try {
      await renameRoomById(room.id, newName)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Renommage refusé')
      return
    }
    setRooms((r) => r.map((x) => (x.id === room.id ? { ...x, name: newName } : x)))
    window.dispatchEvent(new Event('jdr_rooms_change'))
  }

  // Vérifie le mot de passe ET mémorise le token d'accès : sans lui, la
  // connexion Liveblocks de la room protégée est rejetée en 401.
  const verifyPassword = async (roomId: string, password: string) => {
    await verifyAndStoreRoomToken(roomId, password)
    return true
  }

  const handleEnter = (room: RoomInfo) => {
    onSelect?.(room)
    onEnter?.(room)
  }

  const handleSelect = (room: RoomInfo) => {
    setJoiningId(null)
    setErrorMsg('')
    onSelect?.(room)
  }

  const joinRoom = async (room: RoomInfo) => {
    if (room.hasPassword) {
      setJoiningId(room.id)
      setJoinPassword('')
      setErrorMsg('')
      return
    }
    handleEnter(room)
  }

  const confirmJoin = async (room: RoomInfo) => {
    try {
      setVerifying(true)
      setErrorMsg('')
      // Le mot de passe n'est jamais persisté : seul le token signé renvoyé
      // par le serveur est conservé, en sessionStorage, pour 10 minutes.
      await verifyPassword(room.id, joinPassword)
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') void joinByCode() }}
          placeholder="Code d'invitation"
          aria-label="Code d'invitation"
          maxLength={12}
          className="w-44 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 font-mono text-sm tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 focus:border-emerald-400/40 focus:outline-none"
        />
        <button
          onClick={() => void joinByCode()}
          disabled={joining || !inviteCode.trim()}
          className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500/90 disabled:opacity-40"
        >
          {joining ? '...' : 'Rejoindre'}
        </button>
        <span className="text-xs text-white/40">
          Une table ne se rejoint qu&apos;avec son code.
        </span>
      </div>
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
            className={`relative p-3 rounded-xl border cursor-pointer flex flex-col gap-2 transition ${selectedId === r.id ? 'bg-emerald-500/15 border-emerald-300 ring-2 ring-emerald-300 shadow-[0_0_16px_2px_rgba(110,231,183,0.35)]' : 'bg-black/30 border-white/10 hover:border-emerald-300/60 hover:ring-2 hover:ring-emerald-300/30'}`}
            onClick={() => handleSelect(r)}
            onDoubleClick={() => void joinRoom(r)}
          >
            {selectedId === r.id && (
              <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-300 px-2 py-0.5 text-[11px] font-semibold text-emerald-950">
                <CheckCircle2 size={12} />
                Selected
              </div>
            )}
            <div className="flex justify-between items-center gap-1 pt-6">
              <span className="truncate flex-1 flex items-center gap-1 text-sm">
                {r.hasPassword && <Lock size={12} className="text-pink-300" />} {r.name || t('unnamed')}
              </span>
              {myRoom === r.id && <span title={t('creator')}>👑</span>}
              {canManage(r.id) && (
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
            {r.joinCode ? (
              <span
                className="cursor-pointer select-none font-mono text-[11px] tracking-widest text-emerald-300/80"
                title="Code d'invitation — partage-le pour inviter un joueur"
                onClick={(e) => { e.stopPropagation(); void navigator.clipboard?.writeText(r.joinCode!) }}
              >
                {r.joinCode}
              </span>
            ) : (
              <span
                className="text-[10px] text-white/40 cursor-pointer select-none"
                onClick={(e) => { e.stopPropagation(); setRevealIds((prev) => ({ ...prev, [r.id]: !prev[r.id] })) }}
              >
                {revealIds[r.id] ? r.id : t('idLabel')}
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                void joinRoom(r)
              }}
              className={`mt-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${selectedId === r.id ? 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.35)]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <LogIn size={16} />
              {selectedId === r.id ? 'Enter selected room' : t('enter')}
            </button>

            {joiningId === r.id && r.hasPassword && (
              <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-1">
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-1 py-1 rounded bg-gray-800 text-white border border-white/20 text-xs"
                  placeholder={t('password')}
                  onKeyDown={(e) => { if (e.key === 'Enter') void confirmJoin(r) }}
                  disabled={verifying}
                  autoFocus
                />
                <button
                  onClick={() => void confirmJoin(r)}
                  disabled={verifying}
                  className="w-full px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {verifying ? t('verifying') : t('confirm')}
                </button>
                {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

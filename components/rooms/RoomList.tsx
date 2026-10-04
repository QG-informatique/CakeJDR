'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { AlertTriangle, CheckCircle2, Crown, DoorOpen, LogIn, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  deleteRoomById,
  fetchRooms as fetchRoomsApi,
  joinRoomByCode,
  renameRoomById,
} from '@/lib/roomsApi'
import { fetchAdminStatus } from '@/lib/adminApi'
import { roomDeletionDate } from '@/lib/roomLifecycle'

export type RoomInfo = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
  /** Rôle de l'appelant dans cette table : `gm` ou `player`. */
  role?: string
  /** Code d'invitation, renvoyé uniquement au MJ. */
  joinCode?: string
  /** Salle de démonstration : jamais supprimée pour inactivité. */
  isDemo?: boolean
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
  const [errorMsg, setErrorMsg] = useState('')
  const [myRoom, setMyRoom] = useState<string | null>(null)
  const [revealIds, setRevealIds] = useState<Record<string, boolean>>({})
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

  /** Le MJ gère sa table depuis n'importe quel appareil ; l'admin, toutes. */
  const canManage = (room: RoomInfo) => isAdmin || room.role === 'gm'

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
      setErrorMsg(e instanceof Error ? e.message : t('inviteInvalidCode'))
    } finally {
      setJoining(false)
    }
  }

  const deleteRoom = async (room: RoomInfo) => {
    if (!window.confirm(t('deleteRoomConfirm'))) return
    try {
      await deleteRoomById(room.id)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t('roomDeleteRefused'))
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
      setErrorMsg(e instanceof Error ? e.message : t('roomRenameRefused'))
      return
    }
    setRooms((r) => r.map((x) => (x.id === room.id ? { ...x, name: newName } : x)))
    window.dispatchEvent(new Event('jdr_rooms_change'))
  }

  const handleEnter = (room: RoomInfo) => {
    onSelect?.(room)
    onEnter?.(room)
  }

  const handleSelect = (room: RoomInfo) => {
    setErrorMsg('')
    onSelect?.(room)
  }


  return (
    <section className="ui-panel flex flex-col gap-3 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <DoorOpen size={16} className="text-accent" />
        {t('rooms')}
      </h2>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === 'Enter') void joinByCode() }}
          placeholder={t('inviteCodePlaceholder')}
          aria-label={t('inviteCodePlaceholder')}
          maxLength={12}
          className="ui-input w-44 font-mono tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-ink/30"
        />
        <button
          onClick={() => void joinByCode()}
          disabled={joining || !inviteCode.trim()}
          className="ui-btn"
        >
          {joining ? '...' : t('inviteJoin')}
        </button>
        <span className="text-xs text-ink/45">
          {t('inviteOnlyHint')}
        </span>
      </div>
      {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}
      <div className="grid max-h-[28rem] grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
        <button
          onClick={onCreateClick}
          className="ui-well flex min-h-[7.5rem] flex-col items-center justify-center gap-1.5 !border-dashed text-sm font-semibold text-ink/65 transition hover:!border-accent hover:text-accent"
        >
          <Plus size={20} />
          {t('createRoom')}
        </button>
        {rooms.map((r) => {
          const selected = selectedId === r.id
          return (
            <div
              key={r.id}
              className={`ui-well relative flex cursor-pointer flex-col gap-1.5 p-3 transition ${selected ? '!border-accent ring-1 ring-accent' : 'hover:!border-[var(--c-line-strong)]'}`}
              onClick={() => handleSelect(r)}
              onDoubleClick={() => handleEnter(r)}
            >
              <div className="flex items-center gap-1.5">
                {selected && <CheckCircle2 size={15} className="shrink-0 text-accent" />}
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {r.name || t('unnamed')}
                </span>
                {myRoom === r.id && (
                  <span title={t('creator')} className="shrink-0 text-gm"><Crown size={14} /></span>
                )}
                {canManage(r) && (
                  <span className="flex shrink-0 items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); void renameRoom(r) }}
                      className="ui-btn ui-btn-ghost ui-btn-icon !h-7 !min-h-7 !w-7"
                      title={t('rename')}
                      aria-label={t('rename')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void deleteRoom(r) }}
                      className="ui-btn ui-btn-ghost ui-btn-danger ui-btn-icon !h-7 !min-h-7 !w-7"
                      title={t('delete')}
                      aria-label={t('delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                )}
              </div>
              <span className="flex items-center justify-between gap-2 text-xs text-ink/55">
                <span className="truncate">
                  {r.updatedAt
                    ? new Date(r.updatedAt).toLocaleDateString()
                    : r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString()
                      : ''}
                </span>
                {/* Compté par le serveur : ouvrir le menu ne connecte plus à chaque table. */}
                {(r.usersConnected ?? 0) > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-accent">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {t('onlineCount').replace('{n}', String(r.usersConnected))}
                  </span>
                )}
              </span>
              {r.role === 'gm' && !r.isDemo && (() => {
                // Table bientôt supprimée faute de visite : seul le MJ est prévenu,
                // et il suffit d'y entrer pour la garder.
                const until = roomDeletionDate(r.updatedAt)
                if (!until) return null
                return (
                  <span className="flex items-start gap-1 rounded-md bg-amber-500/15 px-2 py-1 text-[11px] leading-snug text-amber-200">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    {t('roomInactiveWarning').replace('{date}', until.toLocaleDateString())}
                  </span>
                )
              })()}
              {r.joinCode ? (
                <span
                  className="w-fit cursor-pointer select-none font-mono text-[11px] tracking-widest text-accent-soft/80 hover:text-accent-soft"
                  title={t('inviteCodeTitle')}
                  onClick={(e) => { e.stopPropagation(); void navigator.clipboard?.writeText(r.joinCode!) }}
                >
                  {r.joinCode}
                </span>
              ) : (
                <span
                  className="w-fit cursor-pointer select-none text-[10px] text-ink/40"
                  onClick={(e) => { e.stopPropagation(); setRevealIds((prev) => ({ ...prev, [r.id]: !prev[r.id] })) }}
                >
                  {revealIds[r.id] ? r.id : t('idLabel')}
                </span>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEnter(r)
                }}
                className={`ui-btn mt-auto w-full ${selected ? 'ui-btn-primary' : ''}`}
              >
                <LogIn size={15} />
                {t('enter')}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'
import { AlertTriangle, Check, CheckCircle2, Copy, Crown, DoorOpen, LogIn, Pencil, Plus, Trash2, Users } from 'lucide-react'
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
  /** Membres, MJ en premier, et qui est dans la table en ce moment. */
  members?: Array<{ pseudo: string; role: string; color?: string; online?: boolean }>
  /** Présents qui ne sont pas membres : visiteurs de la démo, admin. */
  guestsOnline?: number
}

const formatDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString() : '')

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
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

  const copyCode = (room: RoomInfo) => {
    if (!room.joinCode) return
    void navigator.clipboard?.writeText(room.joinCode)
    setCopiedId(room.id)
    window.setTimeout(() => setCopiedId((id) => (id === room.id ? null : id)), 1500)
  }


  return (
    <section className="ui-panel flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <DoorOpen size={16} className="text-accent" />
          {t('rooms')}
        </h2>
        <button onClick={onCreateClick} className="ui-btn ui-btn-primary ml-auto">
          <Plus size={15} />
          {t('createRoom')}
        </button>
      </div>

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
      {rooms.length === 0 && (
        <p className="ui-well px-4 py-6 text-center text-sm text-ink/55">{t('noRoomYet')}</p>
      )}
      <ul className="flex max-h-[44rem] flex-col gap-3 overflow-y-auto">
        {rooms.map((r) => {
          const selected = selectedId === r.id
          const members = r.members ?? []
          const gm = members.find((m) => m.role === 'gm')
          // Les joueurs présents en premier.
          const players = members
            .filter((m) => m.role !== 'gm')
            .sort((a, b) => Number(!!b.online) - Number(!!a.online))
          const online = r.usersConnected ?? 0
          return (
            <li
              key={r.id}
              className={`ui-well relative flex cursor-pointer flex-col gap-3 p-4 transition ${selected ? '!border-accent ring-1 ring-accent' : 'hover:!border-[var(--c-line-strong)]'}`}
              onClick={() => handleSelect(r)}
              onDoubleClick={() => handleEnter(r)}
            >
              {/* Nom, rôle, présence, puis les actions du MJ */}
              <div className="flex flex-wrap items-center gap-2">
                {selected && <CheckCircle2 size={17} className="shrink-0 text-accent" />}
                <span className="min-w-0 truncate text-lg font-bold">
                  {r.name || t('unnamed')}
                </span>
                {r.role && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.role === 'gm' ? 'bg-gm/15 text-gm-soft' : 'bg-ink/10 text-ink/70'}`}>
                    {r.role === 'gm' ? t('roleGm') : t('rolePlayer')}
                  </span>
                )}
                {online > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    {t('onlineCount').replace('{n}', String(online))}
                  </span>
                )}
                {canManage(r) && (
                  <span className="ml-auto flex shrink-0 items-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); void renameRoom(r) }}
                      className="ui-btn ui-btn-ghost ui-btn-icon"
                      title={t('rename')}
                      aria-label={t('rename')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void deleteRoom(r) }}
                      className="ui-btn ui-btn-ghost ui-btn-danger ui-btn-icon"
                      title={t('delete')}
                      aria-label={t('delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/55">
                {gm && (
                  <span className="flex items-center gap-1">
                    <Crown size={12} className="text-gm" />
                    {t('roomGm').replace('{n}', gm.pseudo)}
                    {gm.online && <span className="h-1.5 w-1.5 rounded-full bg-accent" title={t('roomOnline')} />}
                  </span>
                )}
                {r.createdAt && <span>{t('roomCreatedOn').replace('{d}', formatDate(r.createdAt))}</span>}
                {r.updatedAt && <span>{t('roomLastPlayed').replace('{d}', formatDate(r.updatedAt))}</span>}
              </div>

              {/* Les joueurs de la table ; ceux qui y sont en ce moment sont allumés. */}
              <div className="flex flex-col gap-1.5">
                <span className="ui-label flex items-center gap-1.5">
                  <Users size={12} />
                  {t('roomMembersTitle').replace('{n}', String(players.length))}
                </span>
                {players.length === 0 ? (
                  <span className="text-xs text-ink/45">{t('roomNoPlayers')}</span>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {players.map((m) => (
                      <li
                        key={m.pseudo}
                        title={m.online ? `${m.pseudo} — ${t('roomOnline')}` : m.pseudo}
                        className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs ${m.online ? 'border-accent/60 text-ink' : 'border-[var(--c-panel-line)] text-ink/55'}`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.online ? '' : 'opacity-50'}`}
                          style={{ background: m.color || '#6b7280' }}
                        >
                          {m.pseudo.charAt(0).toUpperCase()}
                        </span>
                        {m.pseudo}
                        {m.online && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      </li>
                    ))}
                  </ul>
                )}
                {(r.guestsOnline ?? 0) > 0 && (
                  <span className="text-xs text-ink/45">
                    {t('roomGuestsOnline').replace('{n}', String(r.guestsOnline))}
                  </span>
                )}
              </div>

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

              <div className="flex flex-wrap items-end gap-3">
                {r.joinCode && (
                  <div className="flex flex-col gap-0.5" title={t('inviteCodeTitle')}>
                    <span className="ui-label">{t('roomInviteCode')}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-mono text-base tracking-[0.2em] text-accent-soft">{r.joinCode}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyCode(r) }}
                        className="ui-btn ui-btn-ghost !min-h-7 !px-2 text-xs"
                      >
                        {copiedId === r.id ? <Check size={13} /> : <Copy size={13} />}
                        {copiedId === r.id ? t('codeCopied') : t('copyCode')}
                      </button>
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEnter(r)
                  }}
                  className={`ui-btn ml-auto !min-h-9 !px-5 ${selected ? 'ui-btn-primary' : ''}`}
                >
                  <LogIn size={15} />
                  {t('enter')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

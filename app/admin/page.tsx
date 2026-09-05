'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react'
import { fetchRooms } from '@/lib/roomsApi'
import {
  adminClearPassword,
  adminDeleteRooms,
  adminLogin,
  adminLogout,
  adminRenameRoom,
  fetchAdminStatus,
} from '@/lib/adminApi'
import type { RoomInfoResponse } from '@/types/api'

type SortKey = 'createdAt' | 'name' | 'usersConnected'

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [configured, setConfigured] = useState(true)

  const [password, setPassword] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const [rooms, setRooms] = useState<RoomInfoResponse[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const data = await fetchAdminStatus()
      setIsAdmin(data.isAdmin)
      setConfigured(data.configured)
    } catch {
      setIsAdmin(false)
    } finally {
      setChecking(false)
    }
  }, [])

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true)
    setError(null)
    try {
      setRooms(await fetchRooms())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible')
      setRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  useEffect(() => {
    if (isAdmin) void loadRooms()
  }, [isAdmin, loadRooms])

  useEffect(() => {
    if (!status) return
    const timer = setTimeout(() => setStatus(null), 4000)
    return () => clearTimeout(timer)
  }, [status])

  const visibleRooms = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    const list = needle
      ? rooms.filter(
          (r) =>
            r.name?.toLowerCase().includes(needle) ||
            r.id.toLowerCase().includes(needle),
        )
      : [...rooms]
    return list.sort((a, b) => {
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortKey === 'usersConnected')
        return (b.usersConnected ?? 0) - (a.usersConnected ?? 0)
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    })
  }, [rooms, filter, sortKey])

  const allVisibleSelected =
    visibleRooms.length > 0 && visibleRooms.every((r) => selected.has(r.id))

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) visibleRooms.forEach((r) => next.delete(r.id))
      else visibleRooms.forEach((r) => next.add(r.id))
      return next
    })
  }

  const handleLogin = async () => {
    if (!password || loggingIn) return
    setLoggingIn(true)
    setLoginError(null)
    try {
      await adminLogin(password)
      setPassword('')
      await refreshStatus()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Echec de connexion'
      setLoginError(
        msg === 'too many attempts'
          ? 'Trop de tentatives. Reessaie dans quelques minutes.'
          : msg === 'admin not configured on this server'
            ? 'ADMIN_PASSWORD / ADMIN_SESSION_SECRET absents du serveur.'
            : 'Mot de passe incorrect.',
      )
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await adminLogout().catch(() => {})
    setRooms([])
    setSelected(new Set())
    await refreshStatus()
  }

  const runAction = async (label: string, fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      setStatus(label)
      await loadRooms()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action echouee')
    } finally {
      setBusy(false)
    }
  }

  const deleteIds = (ids: string[]) => {
    if (!ids.length) return
    const names = ids
      .map((id) => rooms.find((r) => r.id === id)?.name || id)
      .join('\n  - ')
    const confirmed = window.confirm(
      `Supprimer definitivement ${ids.length} room(s) ?\n\n  - ${names}\n\nCette action est irreversible.`,
    )
    if (!confirmed) return
    void runAction(`${ids.length} room(s) supprimee(s)`, async () => {
      const res = await adminDeleteRooms(ids)
      setSelected(new Set())
      if (res.failed.length) {
        throw new Error(
          `${res.deleted.length} supprimee(s), ${res.failed.length} en echec : ` +
            res.failed.map((f) => `${f.id} (${f.error})`).join(', '),
        )
      }
    })
  }

  const handleRename = (room: RoomInfoResponse) => {
    const next = window.prompt('Nouveau nom de la room :', room.name)
    if (!next || next === room.name) return
    void runAction(`Room renommee en "${next}"`, async () => {
      await adminRenameRoom(room.id, next)
    })
  }

  const handleClearPassword = (room: RoomInfoResponse) => {
    if (!window.confirm(`Retirer le mot de passe de "${room.name}" ?`)) return
    void runAction('Mot de passe retire', async () => {
      await adminClearPassword(room.id)
    })
  }

  /* ------------------------------------------------------------------ */

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white/60">
        <Loader2 className="animate-spin" size={20} />
      </main>
    )
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={18} className="text-amber-300" />
            <h1 className="text-lg font-semibold">Acces administrateur</h1>
          </div>
          {!configured && (
            <p className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-xs text-amber-200">
              Le serveur n&apos;a pas de mot de passe admin configure. Ajoute{' '}
              <code className="rounded bg-black/40 px-1">ADMIN_PASSWORD</code> et{' '}
              <code className="rounded bg-black/40 px-1">
                ADMIN_SESSION_SECRET
              </code>{' '}
              dans ton <code>.env.local</code>, puis redemarre le serveur.
            </p>
          )}
          <label
            htmlFor="admin-password"
            className="mb-1 block text-xs text-white/50"
          >
            Mot de passe
          </label>
          <input
            id="admin-password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleLogin()
            }}
            disabled={loggingIn}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-indigo-400/40 focus:outline-none"
            placeholder="mot de passe admin"
          />
          {loginError && (
            <p className="mb-3 text-sm text-red-400">{loginError}</p>
          )}
          <button
            onClick={() => void handleLogin()}
            disabled={loggingIn || !password}
            className="w-full rounded-xl bg-indigo-600/80 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500/90 disabled:opacity-50"
          >
            {loggingIn ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <ShieldCheck size={22} className="text-emerald-400" />
          <h1 className="text-xl font-semibold">Panel admin</h1>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            session active
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => void loadRooms()}
              disabled={loadingRooms}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingRooms ? 'animate-spin' : ''}
              />
              Rafraichir
            </button>
            <button
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              <LogOut size={14} />
              Quitter le mode admin
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom ou id..."
            aria-label="Filtrer les rooms"
            className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none"
          />
          <label htmlFor="admin-sort" className="text-xs text-white/50">
            Trier
          </label>
          <select
            id="admin-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-sm [&>option]:bg-neutral-900"
          >
            <option value="createdAt">Plus recentes</option>
            <option value="name">Nom (A vers Z)</option>
            <option value="usersConnected">Connectes</option>
          </select>
          <button
            onClick={() => deleteIds(Array.from(selected))}
            disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/80 px-3 py-2 text-sm font-semibold hover:bg-red-500/90 disabled:opacity-40"
          >
            <Trash2 size={14} />
            Supprimer la selection ({selected.size})
          </button>
        </div>

        {status && (
          <p className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {status}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/25">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="p-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Tout selectionner"
                  />
                </th>
                <th className="p-3">Nom</th>
                <th className="p-3">Id</th>
                <th className="p-3">Creee le</th>
                <th className="p-3">Connectes</th>
                <th className="p-3">Etat</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRooms.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggle(r.id)}
                      aria-label={`Selectionner ${r.name || r.id}`}
                    />
                  </td>
                  <td className="max-w-[220px] truncate p-3 font-medium">
                    {r.name || <span className="text-white/40">sans nom</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-white/40">{r.id}</td>
                  <td className="p-3 text-white/60">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                  </td>
                  <td className="p-3 tabular-nums text-white/60">
                    {r.usersConnected ?? 0}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 text-xs">
                      {r.hasPassword && (
                        <span className="rounded bg-pink-500/15 px-1.5 py-0.5 text-pink-300">
                          MDP
                        </span>
                      )}
                      {!r.hasOwner && (
                        <span
                          className="rounded bg-white/10 px-1.5 py-0.5 text-white/50"
                          title="Room creee avant le systeme de propriete : seul l'admin peut la gerer"
                        >
                          orpheline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleRename(r)}
                        disabled={busy}
                        title="Renommer"
                        aria-label={`Renommer ${r.name || r.id}`}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 disabled:opacity-40"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleClearPassword(r)}
                        disabled={busy || !r.hasPassword}
                        title="Retirer le mot de passe"
                        aria-label={`Retirer le mot de passe de ${r.name || r.id}`}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 hover:bg-white/10 disabled:opacity-30"
                      >
                        <Unlock size={14} />
                      </button>
                      <button
                        onClick={() => deleteIds([r.id])}
                        disabled={busy}
                        title="Supprimer"
                        aria-label={`Supprimer ${r.name || r.id}`}
                        className="rounded-lg border border-red-400/20 bg-red-500/10 p-1.5 text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleRooms.length && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-white/40">
                    {loadingRooms ? 'Chargement...' : 'Aucune room'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-white/30">
          {rooms.length} room(s) au total. La session admin expire au bout de 8 h.
        </p>
      </div>
    </main>
  )
}

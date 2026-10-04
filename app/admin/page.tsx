'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Crown,
  KeyRound,
  Loader2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { fetchRooms } from '@/lib/roomsApi'
import {
  adminDeleteRooms,
  adminRenameRoom,
  fetchAdminStatus,
} from '@/lib/adminApi'
import type { RoomInfoResponse } from '@/types/api'

type SortKey = 'createdAt' | 'lastActiveAt' | 'name' | 'usersConnected'

export default function AdminPage() {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

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
            r.id.toLowerCase().includes(needle) ||
            r.members?.some((m) => m.pseudo.toLowerCase().includes(needle)),
        )
      : [...rooms]
    return list.sort((a, b) => {
      if (sortKey === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortKey === 'usersConnected')
        return (b.usersConnected ?? 0) - (a.usersConnected ?? 0)
      if (sortKey === 'lastActiveAt')
        return (a.lastActiveAt ?? '').localeCompare(b.lastActiveAt ?? '')
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

  /* ------------------------------------------------------------------ */

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center text-ink/60">
        <Loader2 className="animate-spin" size={20} />
      </main>
    )
  }

  // Les droits viennent du compte (`users.is_admin`) : plus de mot de passe
  // admin séparé, il suffit d'être connecté avec le bon compte.
  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-shade/60 p-6 text-ink shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={18} className="text-amber-300" />
            <h1 className="text-lg font-semibold">Accès administrateur</h1>
          </div>
          <p className="mb-4 text-sm text-ink/70">
            Cette page est réservée au compte administrateur. Connecte-toi avec ce
            compte pour y accéder.
          </p>
          <a
            href="/connexion?callbackUrl=/admin"
            className="block w-full rounded-xl bg-indigo-600/80 px-4 py-2 text-center font-semibold text-ink transition hover:bg-indigo-500/90"
          >
            Se connecter
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 text-ink">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <ShieldCheck size={22} className="text-emerald-400" />
          <h1 className="text-xl font-semibold">Panel admin</h1>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
            compte admin
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => void loadRooms()}
              disabled={loadingRooms}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-sm hover:bg-ink/10 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingRooms ? 'animate-spin' : ''}
              />
              Rafraichir
            </button>
            <a
              href="/menu-accueil"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 bg-ink/5 px-3 py-1.5 text-sm hover:bg-ink/10"
            >
              <ArrowLeft size={14} />
              Retour au menu
            </a>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer par nom, id ou joueur..."
            aria-label="Filtrer les rooms"
            className="min-w-[220px] flex-1 rounded-lg border border-ink/10 bg-ink/5 px-3 py-2 text-sm placeholder:text-ink/30 focus:outline-none"
          />
          <label htmlFor="admin-sort" className="text-xs text-ink/50">
            Trier
          </label>
          <select
            id="admin-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-ink/10 bg-ink/5 px-2 py-2 text-sm [&>option]:bg-surface-deep"
          >
            <option value="createdAt">Plus recentes</option>
            <option value="lastActiveAt">Inactives depuis longtemps</option>
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

        <div className="overflow-x-auto rounded-xl border border-ink/10 bg-shade/25">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-ink/40">
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
                <th className="p-3">Accès</th>
                <th className="p-3">Dernière activité</th>
                <th className="p-3">Connectes</th>
                <th className="p-3">Etat</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRooms.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink/5 hover:bg-ink/5"
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
                    {r.name || <span className="text-ink/40">sans nom</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-ink/40">{r.id}</td>
                  <td className="p-3 text-xs">
                    {r.members && r.members.length > 0 ? (
                      <ul className="m-0 list-none space-y-0.5 p-0">
                        {r.members.map((m) => (
                          <li key={m.pseudo} className="flex items-center gap-1">
                            {m.role === 'gm' && (
                              <Crown size={12} className="text-pink-400" aria-label="MJ" />
                            )}
                            <span className={m.role === 'gm' ? 'text-ink' : 'text-ink/60'}>
                              {m.pseudo}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-ink/40">personne</span>
                    )}
                    {r.joinCode && (
                      <span className="mt-1 block font-mono text-ink/40">code {r.joinCode}</span>
                    )}
                  </td>
                  <td
                    className="p-3 text-ink/60"
                    title={r.createdAt ? `Créée le ${new Date(r.createdAt).toLocaleString()}` : undefined}
                  >
                    {r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3 tabular-nums text-ink/60">
                    {r.usersConnected ?? 0}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 text-xs">
                      {r.isDemo && (
                        <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-sky-300">
                          démo
                        </span>
                      )}
                      {!r.hasOwner && (
                        <span
                          className="rounded bg-ink/10 px-1.5 py-0.5 text-ink/50"
                          title="Table absente de la base : aucun joueur n'y a accès, seul l'admin la voit"
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
                        className="rounded-lg border border-ink/10 bg-ink/5 p-1.5 hover:bg-ink/10 disabled:opacity-40"
                      >
                        <Pencil size={14} />
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
                  <td colSpan={8} className="p-6 text-center text-ink/40">
                    {loadingRooms ? 'Chargement...' : 'Aucune room'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-ink/30">
          {rooms.length} table(s) au total.
        </p>
      </div>
    </main>
  )
}

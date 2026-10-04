'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { Trash2 } from 'lucide-react'
import { useT } from '@/lib/useT'

type OwnedRoom = { id: string; name: string }

/**
 * Suppression du compte, à la demande du joueur (RGPD).
 *
 * Tout part avec le compte : fiches, appartenances, et les tables dont il est
 * le MJ, pour tous leurs joueurs. La fenêtre liste ces tables et demande de
 * retaper son pseudo, pour qu'aucun clic distrait ne suffise.
 */
export default function DeleteAccount({ pseudo }: { pseudo: string }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [rooms, setRooms] = useState<OwnedRoom[] | null>(null)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    fetch('/api/rooms/list', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const list = Array.isArray(d?.rooms) ? d.rooms : []
        setRooms(
          list
            .filter((r: { role?: string }) => r.role === 'gm')
            .map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })),
        )
      })
      .catch(() => !cancelled && setRooms([]))
    return () => {
      cancelled = true
    }
  }, [open])

  const close = () => {
    if (deleting) return
    setOpen(false)
    setTyped('')
    setError('')
    setRooms(null)
  }

  // Échap ferme la fenêtre, comme un clic hors de la carte.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const confirmed = typed.trim().toLowerCase() === pseudo.toLowerCase()

  const remove = async () => {
    if (!confirmed || deleting) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch('/api/me', { method: 'DELETE' })
      if (res.status === 403) {
        setError(t('deleteAccountAdmin'))
        setDeleting(false)
        return
      }
      if (!res.ok) throw new Error(String(res.status))
      // Le navigateur garde des copies locales : elles partent aussi.
      try {
        localStorage.removeItem('jdr_characters')
        localStorage.removeItem('selectedCharacterId')
        localStorage.removeItem('jdr_my_room')
      } catch {}
      await signOut({ redirectTo: '/menu' })
    } catch {
      setError(t('deleteAccountError'))
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-ink/50 underline-offset-2 transition hover:text-rose-300 hover:underline"
      >
        <Trash2 size={12} />
        {t('deleteAccount')}
      </button>

      {open && (
        // Clic hors de la carte pour fermer ; l'équivalent clavier est Échap.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-shade/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-rose-400/30 bg-surface-deep/95 p-6 text-ink shadow-2xl">
            <h2 id="delete-account-title" className="m-0 text-xl font-bold text-rose-300">
              {t('deleteAccountTitle')}
            </h2>
            <p className="m-0 text-sm text-ink/80">{t('deleteAccountWarn')}</p>

            {rooms === null ? (
              <p className="m-0 text-sm text-ink/50">{t('pseudoChecking')}</p>
            ) : rooms.length > 0 ? (
              <div className="text-sm">
                <p className="m-0 mb-1 text-ink/80">{t('deleteAccountTables')}</p>
                <ul className="m-0 max-h-32 list-disc space-y-0.5 overflow-auto pl-5 text-rose-200">
                  {rooms.map((r) => (
                    <li key={r.id}>{r.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <label className="block space-y-1 text-sm">
              <span className="text-ink/80">
                {t('deleteAccountConfirmHint')} <strong>{pseudo}</strong>
              </span>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="w-full rounded-lg border border-ink/20 bg-shade/40 px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-rose-300/30"
              />
            </label>

            {error && <p className="m-0 text-sm text-rose-300">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={deleting}
                className="rounded-lg bg-ink/10 px-4 py-2 text-sm hover:bg-ink/20 disabled:opacity-40"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={!confirmed || deleting || rooms === null}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('deleteAccountConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

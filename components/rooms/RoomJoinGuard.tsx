'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  roomId: string
  hasPassword?: boolean
  // Optionnel: callback après succès (sinon navigate par défaut)
  onSuccessNavigate?: boolean
}

export default function RoomJoinGuard({ roomId, hasPassword = false, onSuccessNavigate = true }: Props) {
  const [open, setOpen] = useState(false)
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  async function verifyAndJoin() {
    setBusy(true); setErr(null)
    try {
      const res = await fetch('/api/rooms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: roomId, password: pwd }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Mot de passe incorrect')
      }
      if (onSuccessNavigate) router.push(`/room/${roomId}`)
      setOpen(false)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur'
      setErr(message)
    } finally {
      setBusy(false)
    }
  }

  // Bouton à utiliser dans ta liste de rooms
  // - si pas de mot de passe → join direct
  // - si protégé → ouvre la modal
  return (
    <>
      <button
        className="mt-2 rounded bg-black text-white px-3 py-1 disabled:opacity-50"
        onClick={() => (hasPassword ? setOpen(true) : router.push(`/room/${roomId}`))}
        disabled={busy}
      >
        Rejoindre
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[320px] rounded-xl bg-white p-4 shadow">
            <h3 className="text-lg font-semibold mb-3">Mot de passe de la room</h3>
            <input
              type="password"
              autoFocus
              className="w-full rounded border px-3 py-2 mb-2"
              placeholder="Entrez le mot de passe"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') verifyAndJoin() }}
              disabled={busy}
            />
            {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-1 rounded border" onClick={() => setOpen(false)} disabled={busy}>Annuler</button>
              <button className="px-3 py-1 rounded bg-black text-white disabled:opacity-50" onClick={verifyAndJoin} disabled={busy || !pwd.trim()}>
                {busy ? 'Vérif…' : 'Entrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

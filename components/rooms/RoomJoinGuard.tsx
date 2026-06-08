'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyRoomPassword } from '@/lib/roomsApi'
import { useT } from '@/lib/useT'

type Props = {
  roomId: string
  hasPassword?: boolean
  onSuccessNavigate?: boolean
}

export default function RoomJoinGuard({ roomId, hasPassword = false, onSuccessNavigate = true }: Props) {
  const [open, setOpen] = useState(false)
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()
  const t = useT()

  async function verifyAndJoin() {
    setBusy(true)
    setErr(null)
    try {
      const result = await verifyRoomPassword(roomId, pwd)
      // Stocker le token signé pour l'auth Liveblocks (valide 10 min)
      if (result.accessToken && result.ts != null) {
        sessionStorage.setItem(`room_token_${roomId}`, result.accessToken)
        sessionStorage.setItem(`room_token_ts_${roomId}`, String(result.ts))
      }
      if (onSuccessNavigate) router.push(`/room/${roomId}`)
      setOpen(false)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('wrongPassword')
      setErr(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        className="mt-2 rounded-xl bg-black/60 text-white px-3 py-1 border border-white/10 hover:bg-black/80 disabled:opacity-50 transition-all"
        onClick={() => (hasPassword ? setOpen(true) : router.push(`/room/${roomId}`))}
        disabled={busy}
      >
        {t('select')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="w-[340px] rounded-2xl border border-white/12 bg-black/60 backdrop-blur-[16px] p-6 shadow-2xl text-white"
            style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)' }}
          >
            <h3 className="text-base font-semibold mb-4">{t('password')}</h3>
            <input
              type="password"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 mb-3 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/40 transition-all"
              placeholder={t('password')}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void verifyAndJoin() }}
              disabled={busy}
            />
            {err && <p className="text-sm text-red-400 mb-3">{err}</p>}
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                {t('cancel')}
              </button>
              <button
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600/80 border border-indigo-500/40 text-white hover:bg-indigo-500/90 disabled:opacity-50 transition-all active:scale-95"
                onClick={() => void verifyAndJoin()}
                disabled={busy || !pwd.trim()}
              >
                {busy ? t('verifying') : t('enter')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

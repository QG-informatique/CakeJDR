'use client'

import { useEffect, useState } from 'react'
import { useLostConnectionListener } from '@liveblocks/react/suspense'
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react'
import { useT } from '@/lib/useT'

type State = 'ok' | 'lost' | 'restored' | 'failed'

/**
 * Bandeau affiché quand la connexion temps réel à la table se coupe.
 *
 * Liveblocks se reconnecte seul et renvoie au retour ce qui a été modifié
 * entre-temps ; le bandeau sert à ce que le joueur le sache, au lieu de voir
 * la table se figer sans explication. Si la reconnexion échoue pour de bon,
 * il propose de recharger la page.
 */
export default function ConnectionBanner() {
  const t = useT()
  const [state, setState] = useState<State>('ok')

  useLostConnectionListener((event) => setState(event))

  // « Connexion rétablie » s'efface tout seul.
  useEffect(() => {
    if (state !== 'restored') return
    const timer = window.setTimeout(() => setState('ok'), 3000)
    return () => window.clearTimeout(timer)
  }, [state])

  if (state === 'ok') return null

  const tone =
    state === 'restored'
      ? 'border-emerald-300/40 bg-emerald-900/90 text-emerald-100'
      : state === 'failed'
        ? 'border-rose-300/40 bg-rose-950/90 text-rose-100'
        : 'border-amber-300/40 bg-amber-950/90 text-amber-100'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed left-1/2 top-3 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-2 text-sm shadow-lg backdrop-blur ${tone}`}
    >
      {state === 'restored' ? (
        <CheckCircle2 size={16} className="shrink-0" />
      ) : (
        <WifiOff size={16} className="shrink-0" />
      )}
      <span>
        {state === 'lost'
          ? t('connectionLost')
          : state === 'restored'
            ? t('connectionRestored')
            : t('connectionFailed')}
      </span>
      {state === 'failed' && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-1 inline-flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25"
        >
          <RefreshCw size={12} />
          {t('reloadPage')}
        </button>
      )}
    </div>
  )
}

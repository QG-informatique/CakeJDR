'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Info, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useIsDemoRoom } from '@/lib/useIsDemoRoom'

/**
 * Bandeau affiché dans la salle de démonstration.
 *
 * Il dit ce qu'un visiteur a besoin de savoir : il peut tout essayer, mais
 * rien n'est conservé. Sans cette précision, quelqu'un pourrait croire avoir
 * perdu son travail alors que la salle a simplement été remise à zéro.
 */
export default function DemoBanner() {
  const isDemo = useIsDemoRoom()
  const [dismissed, setDismissed] = useState(false)
  const { status } = useSession()
  const t = useT()

  if (!isDemo || dismissed) return null

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-30 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-amber-400/30 bg-[color-mix(in_srgb,var(--c-panel-head)_88%,#f59e0b)] px-3 py-2 text-amber-100 shadow-lg">
      <Info size={16} className="shrink-0 text-amber-300" />
      <p className="m-0 text-xs leading-snug">
        {t('demoBannerText')}
        {status === 'unauthenticated' && (
          <>
            {' '}
            <Link
              href="/connexion"
              className="font-semibold text-inherit underline underline-offset-2 hover:text-ink"
            >
              {t('demoBannerCta')}
            </Link>{' '}
            {t('demoBannerCtaSuffix')}
          </>
        )}
      </p>
      <button
        onClick={() => setDismissed(true)}
        aria-label={t('demoBannerHide')}
        className="shrink-0 rounded p-0.5 text-amber-200/70 transition hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Info, X } from 'lucide-react'
import { useT } from '@/lib/useT'

/**
 * Bandeau affiché dans la salle de démonstration.
 *
 * Il dit ce qu'un visiteur a besoin de savoir : il peut tout essayer, mais
 * rien n'est conservé. Sans cette précision, quelqu'un pourrait croire avoir
 * perdu son travail alors que la salle a simplement été remise à zéro.
 */
export default function DemoBanner() {
  const { id } = useParams<{ id: string }>()
  const [isDemo, setIsDemo] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { status } = useSession()
  const t = useT()

  useEffect(() => {
    let cancelled = false
    fetch('/api/demo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsDemo(Boolean(d?.roomId) && d.roomId === id)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  if (!isDemo || dismissed) return null

  return (
    <div className="pointer-events-auto fixed left-1/2 top-2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-500/12 px-3 py-2 text-amber-100 shadow-lg backdrop-blur">
      <Info size={16} className="shrink-0 text-amber-300" />
      <p className="m-0 text-xs leading-snug">
        {t('demoBannerText')}
        {status === 'unauthenticated' && (
          <>
            {' '}
            <Link
              href="/connexion"
              className="font-semibold text-inherit underline underline-offset-2 hover:text-white"
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
        className="shrink-0 rounded p-0.5 text-amber-200/70 transition hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  )
}

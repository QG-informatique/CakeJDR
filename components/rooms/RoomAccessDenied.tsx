'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Lock, LogIn } from 'lucide-react'
import { useT } from '@/lib/useT'
import type { TranslationKey } from '@/lib/translations'

export type DeniedReason = 'sign-in' | 'not-member' | 'other'

const MESSAGE: Record<DeniedReason, TranslationKey> = {
  'sign-in': 'roomDeniedSignIn',
  'not-member': 'roomDeniedNotMember',
  other: 'roomDeniedOther',
}

/**
 * Écran affiché quand l'accès à une table est refusé.
 *
 * Il dit pourquoi et quoi faire. Sans lui, un refus laissait la salle sur
 * « Loading... » indéfiniment — par exemple pour quelqu'un qui ouvre le lien
 * d'une table sans y avoir été invité.
 */
export default function RoomAccessDenied({ reason }: { reason: DeniedReason }) {
  const t = useT()
  // Après la connexion, on revient sur cette table plutôt qu'à l'accueil.
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-ink/10 bg-shade/50 px-8 py-9 text-center text-ink backdrop-blur-md">
        <Lock size={28} className="text-gm" aria-hidden="true" />
        <h1 className="m-0 text-xl font-bold">{t('roomDeniedTitle')}</h1>
        <p className="m-0 text-sm text-ink/70">{t(MESSAGE[reason])}</p>
        <div className="flex w-full flex-col gap-2">
          {reason === 'sign-in' && (
            <Link
              href={`/connexion?callbackUrl=${encodeURIComponent(pathname)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/85 px-4 py-2.5 font-semibold text-ink no-underline transition hover:bg-emerald-500/90"
            >
              <LogIn size={17} aria-hidden="true" />
              {t('authSignIn')}
            </Link>
          )}
          <Link
            href="/menu-accueil"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/5 px-4 py-2.5 text-ink/85 no-underline transition hover:bg-ink/10"
          >
            <Home size={17} aria-hidden="true" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

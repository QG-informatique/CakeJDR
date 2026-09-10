'use client'

import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { Home, Lock, LogIn } from 'lucide-react'
import { useT } from '@/lib/useT'
import type { TranslationKey } from '@/lib/translations'

export type DeniedReason = 'sign-in' | 'not-member' | 'password' | 'other'

const MESSAGE: Record<DeniedReason, TranslationKey> = {
  'sign-in': 'roomDeniedSignIn',
  'not-member': 'roomDeniedNotMember',
  password: 'roomDeniedPassword',
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
  const { openSignIn } = useClerk()

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-black/50 px-8 py-9 text-center text-white backdrop-blur-md">
        <Lock size={28} className="text-pink-400" aria-hidden="true" />
        <h1 className="m-0 text-xl font-bold">{t('roomDeniedTitle')}</h1>
        <p className="m-0 text-sm text-white/70">{t(MESSAGE[reason])}</p>
        <div className="flex w-full flex-col gap-2">
          {reason === 'sign-in' && (
            <button
              onClick={() => openSignIn()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/85 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500/90"
            >
              <LogIn size={17} aria-hidden="true" />
              {t('authSignIn')}
            </button>
          )}
          <Link
            href="/menu-accueil"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/85 no-underline transition hover:bg-white/10"
          >
            <Home size={17} aria-hidden="true" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}

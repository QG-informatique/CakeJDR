'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import CakeLogo from '@/components/ui/CakeLogo'
import SignInButtons from './SignInButtons'
import { useT } from '@/lib/useT'

/** Contenu de la page `/connexion`. */
export default function SignInPanel({ error, redirectTo }: { error?: string; redirectTo: string }) {
  const t = useT()

  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-ink/10 bg-shade/40 px-8 py-10 text-center text-ink backdrop-blur-md">
        <CakeLogo large showText={false} />
        <div className="space-y-2">
          <h1 className="m-0 text-2xl font-bold">{t('authSignInTitle')}</h1>
          <p className="m-0 text-sm text-ink/60">{t('authSignInIntro')}</p>
        </div>
        {error && (
          <p role="alert" className="m-0 w-full rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {t('authSignInError')}
          </p>
        )}
        <SignInButtons redirectTo={redirectTo} />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink/60 no-underline transition hover:text-ink"
        >
          <Home size={15} aria-hidden="true" />
          {t('backToHome')}
        </Link>
      </div>
    </div>
  )
}

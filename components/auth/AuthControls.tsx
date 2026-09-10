'use client'

import { Show, UserButton, useClerk } from '@clerk/nextjs'
import VisitDemoButton from './VisitDemoButton'
import { useT } from '@/lib/useT'

/**
 * Contrôles de compte Clerk.
 *
 * Les fenêtres sont ouvertes via `useClerk()` plutôt qu'en enveloppant un
 * bouton dans `<SignInButton>` / `<SignUpButton>` : avec un enfant
 * personnalisé, ces composants ne transmettaient pas le clic.
 *
 * Pas de position fixe ici : la barre d'outils du menu les place, à côté du
 * bouton de langue, pour que les deux ne se chevauchent pas.
 */
export default function AuthControls() {
  const { openSignIn, openSignUp } = useClerk()
  const t = useT()

  return (
    <div className="flex items-center gap-2">
      <Show when="signed-out">
        <VisitDemoButton />
        <button
          onClick={() => openSignIn()}
          className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/85 backdrop-blur transition hover:bg-white/10"
        >
          {t('authSignIn')}
        </button>
        <button
          onClick={() => openSignUp()}
          className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500/90"
        >
          {t('authCreateAccount')}
        </button>
      </Show>

      <Show when="signed-in">
        <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
      </Show>
    </div>
  )
}

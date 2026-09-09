'use client'

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

/**
 * Contrôles de compte Clerk.
 *
 * Étape intermédiaire de la phase 1 : ils cohabitent pour l'instant avec
 * l'ancien profil stocké dans le navigateur, le temps de basculer l'identité
 * côté serveur. L'ancien pseudo local disparaîtra ensuite.
 */
export default function AuthControls() {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white/85 backdrop-blur transition hover:bg-white/10">
            Se connecter
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="rounded-lg bg-emerald-600/80 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-500/90">
            Créer un compte
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
      </Show>
    </div>
  )
}

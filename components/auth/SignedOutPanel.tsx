'use client'

import { useClerk } from '@clerk/nextjs'
import { LogIn, UserPlus } from 'lucide-react'
import CakeLogo from '@/components/ui/CakeLogo'
import VisitDemoButton from './VisitDemoButton'

/**
 * Écran d'accueil pour qui n'a pas de compte.
 *
 * Remplace l'ancienne saisie de pseudo : celui-ci vivait dans le navigateur,
 * ce qui ne permettait ni de retrouver ses parties ailleurs, ni d'empêcher
 * quiconque d'emprunter le nom d'un autre.
 */
export default function SignedOutPanel() {
  const { openSignIn, openSignUp } = useClerk()

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/40 px-8 py-10 text-center backdrop-blur-md">
      <CakeLogo huge showText={false} />

      <div className="space-y-2">
        <h1 className="m-0 text-2xl font-bold text-white">CakeJDR</h1>
        <p className="m-0 text-sm text-white/60">
          Ta table de jeu de rôle en ligne : fiches de personnage, dés, canvas
          partagé et musique, au même endroit.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <button
          onClick={() => openSignUp()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600/85 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500/90"
        >
          <UserPlus size={17} />
          Créer un compte
        </button>
        <button
          onClick={() => openSignIn()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-white/85 transition hover:bg-white/10"
        >
          <LogIn size={17} />
          Se connecter
        </button>
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-white/10 pt-5">
        <p className="m-0 text-xs text-white/40">
          Envie de voir à quoi ça ressemble avant de t&apos;inscrire ?
        </p>
        <VisitDemoButton />
      </div>
    </div>
  )
}

'use client'

import { useClerk } from '@clerk/nextjs'
import { LogIn, UserPlus } from 'lucide-react'
import CakeLogo from '@/components/ui/CakeLogo'
import HeroDie from '@/components/ui/HeroDie'
import VisitDemoButton from './VisitDemoButton'

/**
 * Écran d'accueil pour qui n'a pas de compte.
 *
 * Remplace l'ancienne saisie de pseudo : celui-ci vivait dans le navigateur,
 * ce qui ne permettait ni de retrouver ses parties ailleurs, ni d'empêcher
 * quiconque d'emprunter le nom d'un autre.
 */
/** Emplacement ou le de revient se poser entre deux lancers. */
const DOCK_ID = 'hero-die-dock'

export default function SignedOutPanel() {
  const { openSignIn, openSignUp } = useClerk()

  return (
    <>
    <HeroDie dockId={DOCK_ID} />
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-white/10 bg-black/40 px-8 py-10 text-center backdrop-blur-md">
      <CakeLogo large showText={false} />

      {/* Le de lui-meme est rendu dans un calque fixe (HeroDie), pour pouvoir
          etre lance sur tout l'ecran ; cette boite ne fait que lui reserver
          sa place dans la mise en page. */}
      <div id={DOCK_ID} aria-hidden="true" style={{ width: 104, height: 140 }} />

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
        <p className="m-0 text-xs text-white/50">
          Pas encore de compte ? Découvre une partie de démonstration en
          invité — tu peux tout essayer, rien n&apos;est conservé.
        </p>
        <VisitDemoButton />
      </div>
    </div>
    </>
  )
}

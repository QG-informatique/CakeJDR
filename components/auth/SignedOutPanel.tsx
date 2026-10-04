'use client'

import CakeLogo from '@/components/ui/CakeLogo'
import HeroDie from '@/components/ui/HeroDie'
import SignInButtons from './SignInButtons'
import VisitDemoButton from './VisitDemoButton'
import { useT } from '@/lib/useT'

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
  const t = useT()

  return (
    <>
    <HeroDie dockId={DOCK_ID} />
    <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-ink/10 bg-shade/40 px-8 py-10 text-center backdrop-blur-md">
      <CakeLogo large showText={false} />

      {/* Le de lui-meme est rendu dans un calque fixe (HeroDie), pour pouvoir
          etre lance sur tout l'ecran ; cette boite ne fait que lui reserver
          sa place dans la mise en page. */}
      <div id={DOCK_ID} aria-hidden="true" style={{ width: 104, height: 140 }} />

      <div className="space-y-2">
        <h1 className="m-0 text-2xl font-bold text-ink">CakeJDR</h1>
        <p className="m-0 text-sm text-ink/60">
          {t('authTagline')}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2">
        <SignInButtons />
        <p className="m-0 text-xs text-ink/50">{t('authSignInIntro')}</p>
      </div>

      <div className="flex w-full flex-col items-center gap-2 border-t border-ink/10 pt-5">
        <p className="m-0 text-xs text-ink/50">
          {t('authGuestPitch')}
        </p>
        <VisitDemoButton />
      </div>
    </div>
    </>
  )
}

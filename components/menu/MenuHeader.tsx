'use client'
import { FC, useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dice6, LogOut } from 'lucide-react'
import CakeLogo from '../ui/CakeLogo'

export type User = {
  pseudo: string
  isMJ: boolean
  color: string
}

interface MenuHeaderProps {
  user: User | null
  onLogout?: () => void
  scale?: number
  topPadding?: number
  bottomPadding?: number
}

/* Ajuste ces constantes pour caler précisément */
const SIDE_WIDTH  = 120         // largeur réservée à gauche et à droite
const HEADER_PAD  = 16          // padding horizontal global (0 pour coller)
const DICE_SIZE   = 112         // (w-28 h-28) => 112px, tu peux ajuster
const BUTTON_H    = 56          // hauteur bouton déconnexion (h-14 => 56px)

const MenuHeader: FC<MenuHeaderProps> = ({
  user,
  onLogout,
  scale = 1,
  topPadding = 48,
  bottomPadding = 32
}) => {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'spin'>('idle')
  const btnRef = useRef<HTMLButtonElement | null>(null)

  const handleClickPlay = () => {
    if (!user || phase !== 'idle') return
    setPhase('spin')
    setTimeout(() => {
      router.push('/')
    }, 260)
  }

  useLockBodyScroll(false)

  return (
    <header
      className="relative w-full select-none"
      style={{
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        paddingInline: HEADER_PAD,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
    >
      {/* Logo parfaitement centré (ignore colonnes grâce à inset-0) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <CakeLogo xl showText={false} className="scale-[2]" />
      </div>

      {/* Ligne principale sans padding interne parasite */}
      <div className="relative z-10 flex items-center w-full">
        {/* Colonne gauche */}
        <div
          className="flex items-center justify-start"
          style={{ width: SIDE_WIDTH, minWidth: SIDE_WIDTH }}
        >
          {user && (
            <button
              ref={btnRef}
              type="button"
              aria-label="Aller à la table de jeu"
              disabled={phase !== 'idle'}
              onClick={handleClickPlay}
              className={`
                group relative inline-flex items-center justify-center
                rounded-2xl
                transition
                focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2 focus:ring-offset-black
                overflow-hidden
                ${phase === 'spin' ? 'animate-diceSpin' : ''}
                ${phase !== 'idle' ? 'cursor-wait' : 'cursor-pointer'}
              `}
              style={{
                width: DICE_SIZE,
                height: DICE_SIZE,
                background: 'rgba(20,26,40,0.18)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                boxShadow:
                  '0 0 0 1px rgba(180,200,255,0.10), 0 4px 20px -4px rgba(0,0,0,0.55), 0 0 22px -6px rgba(80,120,200,0.25)',
                border: '1px solid rgba(160,190,255,0.18)'
              }}
            >
              <Dice6
                className={`
                  w-16 h-16 text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]
                  transition-transform duration-400
                  ${phase === 'idle' ? 'group-hover:scale-[1.12]' : ''}
                `}
              />
              {phase === 'idle' && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition duration-400"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(180,200,255,0.10), rgba(60,90,140,0.05) 55%, rgba(40,55,90,0.02) 75%, transparent 90%)'
                  }}
                />
              )}
            </button>
          )}
        </div>

        {/* Centre flexible (logo déjà centré en absolu, ceci absorbe l'espace) */}
        <div className="flex-1" />

        {/* Colonne droite : bouton déconnexion calé à l'extrême droite */}
        <div
          className="flex items-center justify-end"
          style={{ width: SIDE_WIDTH, minWidth: SIDE_WIDTH }}
        >
          {user && onLogout && (
            <button
              onClick={onLogout}
              disabled={phase !== 'idle'}
              className={`
                inline-flex items-center justify-center
                px-6 rounded-md
                bg-gradient-to-br from-slate-700/80 to-slate-800/80
                hover:from-slate-600/80 hover:to-slate-700/80
                font-semibold text-sm text-white
                shadow-lg shadow-black/40
                transition
                focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2 focus:ring-offset-black
                ${phase !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              style={{ height: BUTTON_H }}
            >
              <LogOut size={18} className="mr-2" />
              Déconnexion
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes diceSpin {
          0% { transform: rotate3d(1,1,0,0deg) scale(1); }
          40% { transform: rotate3d(.6,1,.2,200deg) scale(.9); }
          70% { transform: rotate3d(.4,1,.3,310deg) scale(1.08); }
          100% { transform: rotate3d(.3,1,.4,360deg) scale(1.03); }
        }
        .animate-diceSpin {
          animation: diceSpin 0.55s cubic-bezier(.55,.3,.3,1);
        }
      `}</style>
    </header>
  )
}

/* Hook conservé */
function useLockBodyScroll(lock: boolean) {
  useLayoutEffect(() => {
    if (!lock) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [lock])
}

export default MenuHeader

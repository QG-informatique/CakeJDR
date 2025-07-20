'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Login from '@/components/login/Login'
import RpgBackground from '@/components/ui/RpgBackground'

/**
 * Variants framer-motion pour la scène globale
 */
const containerVariants = {
  enter: {
    opacity: 0,
    scale: 0.975,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      opacity: { duration: 0.55, ease: [0.4, 0.0, 0.2, 1] },
      scale:   { duration: 0.55, ease: [0.4, 0.0, 0.2, 1] },
      filter:  { duration: 0.65, ease: 'easeOut' }
    }
  },
  exit: {
    opacity: 0,
    scale: 1.02,
    filter: 'blur(10px)',
    transition: {
      opacity: { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
      scale:   { duration: 0.5, ease: [0.65, 0, 0.35, 1] },
      filter:  { duration: 0.5, ease: 'easeIn' }
    }
  }
}

/**
 * Overlay radial optionnel pendant la sortie (donne une sensation de "focalisation").
 * Tu peux le désactiver en retirant <motion.div ...> plus bas.
 */
const radialVariants = {
  enter: { opacity: 0 },
  visible: { opacity: 0, transition: { duration: 0.4 } },
  exit: {
    opacity: 1,
    transition: { duration: 0.55, ease: 'easeOut' }
  }
}

export default function MenuPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleLogin = () => {
    if (leaving) return
    setLeaving(true)
  }

  // Lecture éventuelle du profil
  useEffect(() => {
    setMounted(true)                // déclenche l'animation d'entrée
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw && JSON.parse(raw).loggedIn) {
        // On joue malgré tout la petite anim avant de partir
        setTimeout(() => {
          handleLogin()
        }, 120) // petit délai pour voir le fondu initial
      }
    } catch {}
  }, []) // eslint-disable-line

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Fond animé */}
      <div className="absolute inset-0 -z-20">
        <RpgBackground />
      </div>

      {/* Overlay de bruit/grain subtil (optionnel) */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] mix-blend-overlay bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)]" />

      {/* AnimatePresence pour gérer entrée & sortie */}
      <AnimatePresence mode="wait">
        {!leaving && mounted && (
          <motion.div
            key="loginScene"
            className="absolute inset-0 flex items-center justify-center"
            variants={containerVariants}
            initial="enter"
            animate="visible"
            exit="exit"
            onAnimationComplete={(def) => {
              if (def === 'exit') {
                router.push('/menu-accueil')
              }
            }}
          >
            <Login onLogin={handleLogin} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial overlay pendant la sortie (facultatif) */}
      <AnimatePresence>
        {leaving && (
          <motion.div
            key="radial"
            className="pointer-events-none absolute inset-0"
            variants={radialVariants}
            initial="enter"
            animate="exit"      // on saute directement à 'exit' pour qu'il apparaisse pendant la sortie
            exit="exit"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(18,27,45,0.0), rgba(6,10,18,0.85) 70%)'
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

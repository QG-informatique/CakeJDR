'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useBackground } from '@/components/context/BackgroundContext'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import Login from '@/components/login/Login'

const containerVariants: Variants = {
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

const radialVariants: Variants = {
  enter: { opacity: 0 },
  visible: { opacity: 0, transition: { duration: 0.4 } },
  exit: {
    opacity: 1,
    transition: { duration: 0.55, ease: 'easeOut' }
  }
}

export default function MenuPage() {
  const router = useRouter()
  const { setBackground } = useBackground()
  const [leaving, setLeaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const handleLogin = () => {
    if (leaving) return
    setLeaving(true)
  }

  useEffect(() => {
    setMounted(true)
    setBackground('rpg')
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw && JSON.parse(raw).loggedIn) {
        setTimeout(() => {
          handleLogin()
        }, 120)
      }
    } catch {}
  }, []) // eslint-disable-line

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 
        Correction :
        SUPPRESSION de la ligne suivante, car c'est elle qui créait l'effet de "ronds transparents" sur le fond :
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15] mix-blend-overlay bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
      */}

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

      <AnimatePresence>
        {leaving && (
          <motion.div
            key="radial"
            className="pointer-events-none absolute inset-0"
            variants={radialVariants}
            initial="enter"
            animate="exit"
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

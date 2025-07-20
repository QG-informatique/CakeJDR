'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Login from '@/components/login/Login'
import AnimatedDiceBackground from '@/components/ui/RpgBackground'

export default function MenuPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  // Lance la transition de sortie après login
  const handleLogin = () => setLeaving(true)

  // Si l’utilisateur est déjà loggé, on saute l’écran de connexion
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw && JSON.parse(raw).loggedIn) handleLogin()
    } catch {}
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      onAnimationComplete={() => {
        if (leaving) router.push('/menu-accueil')
      }}
      className="relative min-h-screen w-full overflow-hidden flex items-start justify-center pt-16"
    >
      {/* Fond animé de dés */}
      <AnimatedDiceBackground />

      {/* Formulaire de connexion + logo */}
      <Login onLogin={handleLogin} />
    </motion.div>
  )
}

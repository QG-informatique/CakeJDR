'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Login from '@/components/login/Login'
import AnimatedDiceBackground from '@/components/ui/RpgBackground'

export default function MenuPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  const handleLogin = () => setLeaving(true)

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
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Fond animé (ne doit pas influer sur la hauteur) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <AnimatedDiceBackground />
      </div>

      {/* Centre absolu */}
      <Login onLogin={handleLogin} />
    </motion.div>
  )
}

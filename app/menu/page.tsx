'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Login from '@/components/login/Login'
import RpgBackground from '@/components/ui/RpgBackground'

export default function MenuPage() {
  const router = useRouter()
  const [leaving, setLeaving] = useState(false)

  const handleLogin = () => {
    setLeaving(true)
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (!raw) return
      const prof = JSON.parse(raw)
      if (prof.loggedIn) handleLogin()
    } catch {}
  }, [])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      onAnimationComplete={() => { if (leaving) router.push('/menu-accueil') }}
      className="relative w-screen h-screen overflow-hidden flex items-center justify-center"
    >
      <RpgBackground />
      <Login onLogin={handleLogin} />
    </motion.div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
// Déplacement fichier pour organisation
import Login from '@/components/login/Login'

export default function MenuPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Correction login : redirection vers l\'accueil après connexion
    router.push('/')
  }

  return <Login onLogin={handleLogin} />
}

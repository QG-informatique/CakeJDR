'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Ancienne page de saisie du pseudo.
 *
 * L'identité passe désormais par un compte : cette page n'a plus de contenu
 * propre et renvoie vers l'accueil, qui affiche soit le menu, soit les options
 * de connexion. Elle est conservée parce que des liens et des redirections y
 * pointent encore.
 */
export default function MenuPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/menu-accueil')
  }, [router])

  return null
}

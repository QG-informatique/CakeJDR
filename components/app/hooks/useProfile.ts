'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export type Profile = {
  pseudo: string
  color: string
  isMJ: boolean
  /** Faux pour un visiteur sans compte. */
  signedIn: boolean
  /** Identifiant du compte, absent pour un visiteur. */
  id?: string
}

type ApiUser = { id: string; pseudo: string; color: string; isAdmin: boolean }

/** Profil affiché à qui n'a pas de compte. */
const VISITOR: Profile = {
  pseudo: 'Visiteur',
  color: '#9ca3af',
  isMJ: false,
  signedIn: false,
}

/**
 * Profil du joueur courant.
 *
 * Auparavant lu dans `localStorage`, ce qui permettait à n'importe qui de se
 * renommer ou de se déclarer MJ en éditant son navigateur. La source est
 * désormais le compte Clerk, complété par les préférences stockées en base.
 *
 * L'interface renvoyée est inchangée : les composants qui l'utilisent n'ont
 * pas eu à bouger.
 */
export default function useProfile(): Profile | null {
  const { isLoaded, isSignedIn } = useUser()
  const [account, setAccount] = useState<ApiUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setAccount(null)
      setChecked(true)
      return
    }
    let cancelled = false
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setAccount((d?.user as ApiUser) ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecked(true)
      })
    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn])

  if (!isLoaded || !checked) return null
  if (!isSignedIn) return VISITOR
  if (!account) return VISITOR

  return {
    id: account.id,
    pseudo: account.pseudo,
    color: account.color,
    // Le rôle de MJ par table arrive avec les rôles de salle ; en attendant,
    // seul l'administrateur dispose des outils du MJ.
    isMJ: account.isAdmin,
    signedIn: true,
  }
}

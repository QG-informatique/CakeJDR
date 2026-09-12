'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

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
 * désormais la session de connexion, complétée par les préférences stockées
 * en base.
 */
export default function useProfile(): Profile | null {
  const { status } = useSession()
  const isLoaded = status !== 'loading'
  const isSignedIn = status === 'authenticated'
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
    // Le rôle de MJ est propre à chaque table ; seul l'administrateur dispose
    // des outils du MJ partout.
    isMJ: account.isAdmin,
    signedIn: true,
  }
}

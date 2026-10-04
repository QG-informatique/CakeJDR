'use client'
import { useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

const noSubscribe = () => () => {}

export default function Portal({ children }: { children: React.ReactNode }) {
  // Faux côté serveur, vrai dans le navigateur : `document.body` n'existe qu'ici.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  if (!mounted) return null

  return createPortal(children, document.body)
}

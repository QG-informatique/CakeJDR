'use client'
import { useSyncExternalStore } from 'react'

// Même seuil que le préfixe `lg:` de Tailwind : au-dessus, la table affiche
// fiche, canevas et chat côte à côte ; en dessous, un onglet à la fois.
const QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  )
}

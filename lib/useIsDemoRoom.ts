'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/** Vrai dans la salle de démonstration (`/api/demo` donne son identifiant). */
export function useIsDemoRoom() {
  const { id } = useParams<{ id: string }>()
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/demo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsDemo(Boolean(d?.roomId) && d.roomId === id)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  return isDemo
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/** Vrai dans la salle de démonstration ou dans la copie d'un visiteur (`/api/demo`). */
export function useIsDemoRoom() {
  const { id } = useParams<{ id: string }>()
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/demo?room=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setIsDemo(d?.isDemo === true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

  return isDemo
}

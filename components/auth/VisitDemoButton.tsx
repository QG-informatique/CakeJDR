'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'
import { useT } from '@/lib/useT'

/**
 * Entrée visiteur.
 *
 * Mène directement à la salle de démonstration, sans compte. Le but est qu'on
 * puisse voir à quoi ressemble une partie — la table, une fiche remplie, le
 * canvas — avant de décider de s'inscrire. Chaque visiteur reçoit sa propre
 * copie de la démo (`/api/demo` en POST), et la retrouve s'il revient.
 *
 * Le bouton disparaît si aucune salle de démonstration n'est configurée,
 * plutôt que de mener à une page d'erreur.
 */
/** Copie de démo reçue la dernière fois, pour la retrouver en revenant. */
const DEMO_KEY = 'jdr_demo_room'

export default function VisitDemoButton({ className = '' }: { className?: string }) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const router = useRouter()
  const t = useT()

  useEffect(() => {
    let cancelled = false
    fetch('/api/demo', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRoomId(typeof d?.roomId === 'string' ? d.roomId : null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!roomId) return null

  const enter = async () => {
    if (entering) return
    setEntering(true)
    try {
      // Le menu redirige vers l'accueil s'il n'a jamais été vu : on le marque
      // pour que le visiteur atterrisse bien dans la salle.
      sessionStorage.setItem('visitedMenu', 'true')
    } catch {}
    let previous: string | null = null
    try {
      previous = localStorage.getItem(DEMO_KEY)
    } catch {}
    const own = await fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ previous }),
    })
      .then((r) => r.json())
      .then((d) => (typeof d?.roomId === 'string' ? d.roomId : null))
      .catch(() => null)
    const target = own ?? roomId
    if (target !== roomId) {
      try {
        localStorage.setItem(DEMO_KEY, target)
      } catch {}
    }
    router.push(`/room/${target}`)
  }

  return (
    <button
      onClick={enter}
      disabled={entering}
      className={`inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-ink/5 px-3 py-1.5 text-sm text-ink/80 transition hover:bg-ink/10 hover:text-ink disabled:opacity-50 ${className}`}
    >
      <Eye size={15} />
      {entering ? t('authOpening') : t('authVisitGuest')}
    </button>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye } from 'lucide-react'

/**
 * Entrée visiteur.
 *
 * Mène directement à la salle de démonstration, sans compte. Le but est qu'on
 * puisse voir à quoi ressemble une partie — la table, une fiche remplie, le
 * canvas — avant de décider de s'inscrire.
 *
 * Le bouton disparaît si aucune salle de démonstration n'est configurée,
 * plutôt que de mener à une page d'erreur.
 */
export default function VisitDemoButton({ className = '' }: { className?: string }) {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [entering, setEntering] = useState(false)
  const router = useRouter()

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

  const enter = () => {
    if (entering) return
    setEntering(true)
    try {
      // Le menu redirige vers l'accueil s'il n'a jamais été vu : on le marque
      // pour que le visiteur atterrisse bien dans la salle.
      sessionStorage.setItem('visitedMenu', 'true')
    } catch {}
    router.push(`/room/${roomId}`)
  }

  return (
    <button
      onClick={enter}
      disabled={entering}
      className={`inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50 ${className}`}
    >
      <Eye size={15} />
      {entering ? 'Ouverture…' : 'Visiter en invité'}
    </button>
  )
}

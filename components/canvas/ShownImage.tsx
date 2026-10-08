'use client'

import { useEffect, useState } from 'react'
import { useBroadcastEvent, useEventListener, useSelf } from '@liveblocks/react'
import { X } from 'lucide-react'
import { useT } from '@/lib/useT'

// Le MJ montre une rencontre en grand à toute la table. L'événement ne revient
// pas chez celui qui l'envoie : le MJ se l'affiche par un événement de la page.
const LOCAL_EVENT = 'cakejdr-show-image'

type Shown = { url: string; label: string }

export function useShowImage() {
  const broadcast = useBroadcastEvent()
  return (url: string, label: string) => {
    broadcast({ type: 'show-image', url, label })
    window.dispatchEvent(new CustomEvent<Shown>(LOCAL_EVENT, { detail: { url, label } }))
  }
}

/** Image montrée par le MJ, par-dessus tout l'écran. Chacun la ferme d'un clic. */
export default function ShownImage() {
  const t = useT()
  const broadcast = useBroadcastEvent()
  const isGM = useSelf((me) => me.info?.role === 'gm')
  const [shown, setShown] = useState<Shown | null>(null)

  useEventListener(({ event, user }) => {
    if (event.type !== 'show-image' && event.type !== 'show-close') return
    // Le rôle vient de la session posée par le serveur : un joueur ne peut
    // pas imposer une image à toute la table.
    if (user?.info?.role !== 'gm') return
    setShown(event.type === 'show-image' ? { url: event.url, label: event.label } : null)
  })

  useEffect(() => {
    const onLocal = (e: Event) => setShown((e as CustomEvent<Shown>).detail)
    window.addEventListener(LOCAL_EVENT, onLocal)
    return () => window.removeEventListener(LOCAL_EVENT, onLocal)
  }, [])

  useEffect(() => {
    if (!shown) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShown(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shown])

  if (!shown) return null
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-shade/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={shown.label || t('shownByGm')}
    >
      {/* Un clic n'importe où (image comprise) ferme l'image chez soi. */}
      <button className="absolute inset-0 cursor-default" onClick={() => setShown(null)} tabIndex={-1} aria-label={t('close')} />
      <img
        src={shown.url}
        alt={shown.label}
        className="pointer-events-none relative max-h-[78dvh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
      <p className="pointer-events-none relative text-center text-sm text-white/85">
        {shown.label && <b className="font-semibold text-white">{shown.label}</b>}
        {shown.label && ' · '}
        {t('shownByGm')}
      </p>
      <div className="relative flex flex-wrap justify-center gap-2">
        <button onClick={() => setShown(null)} className="ui-btn ui-btn-ghost !text-white">
          <X size={14} /> {t('close')}
        </button>
        {isGM && (
          <button
            onClick={() => {
              broadcast({ type: 'show-close' })
              setShown(null)
            }}
            className="ui-btn ui-btn-primary"
          >
            {t('closeForAll')}
          </button>
        )}
      </div>
    </div>
  )
}

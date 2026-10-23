'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useBroadcastEvent, useEventListener, useSelf, useStorage } from '@liveblocks/react'
import { X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { adventureIn } from '@/lib/autoGm'
import { useRoomCampaign } from '@/components/autogm/useRoomCampaign'

// Le MJ montre une rencontre en grand à toute la table. L'événement ne revient
// pas chez celui qui l'envoie : le MJ se l'affiche par un événement de la page.
const LOCAL_EVENT = 'cakejdr-show-image'

type Story = { adventure: string; scene: string }
type Shown = { url: string; label: string; story?: Story }

export function useShowImage() {
  const broadcast = useBroadcastEvent()
  return (url: string, label: string, story?: Story) => {
    broadcast({ type: 'show-image', url, label, ...(story ? { story } : {}) })
    window.dispatchEvent(new CustomEvent<Shown>(LOCAL_EVENT, { detail: { url, label, story } }))
  }
}

// Sous le récit d'une scène montrée, l'emplacement où le panneau du MJ
// automatique pose les choix de la scène : on vote sans fermer l'image.
type Slot = { scene: string; el: HTMLElement } | null
let storySlot: Slot = null
const slotListeners = new Set<() => void>()
function setStorySlot(next: Slot) {
  if (storySlot?.el === next?.el && storySlot?.scene === next?.scene) return
  storySlot = next
  slotListeners.forEach((l) => l())
}
const subscribeSlot = (l: () => void) => {
  slotListeners.add(l)
  return () => {
    slotListeners.delete(l)
  }
}

/** L'emplacement sous le récit, s'il est ouvert sur cette scène. */
export function useStorySlot(scene: string | undefined): HTMLElement | null {
  const slot = useSyncExternalStore(subscribeSlot, () => storySlot, () => null)
  return slot && scene && slot.scene === scene ? slot.el : null
}

/**
 * Image montrée par le MJ, par-dessus tout l'écran. Chacun la ferme d'un clic.
 * Celle d'une scène du MJ automatique porte son récit : on lit l'histoire sur
 * l'image, qui reste ensuite dans le panneau du MJ automatique. Elle se ferme
 * d'elle-même quand l'aventure passe à la scène suivante.
 */
export default function ShownImage() {
  const t = useT()
  const { lang } = useLanguage()
  const broadcast = useBroadcastEvent()
  const isGM = useSelf((me) => me.info?.role === 'gm')
  const [shown, setShown] = useState<Shown | null>(null)
  const current = useStorage((root) => root.autoGm?.scene)
  const custom = useRoomCampaign()
  const reached = useRef(false)
  const storyScene = shown?.story?.scene
  const slotRef = useCallback(
    (el: HTMLDivElement | null) => setStorySlot(el && storyScene ? { scene: storyScene, el } : null),
    [storyScene],
  )

  // L'image d'une scène se ferme quand la partie a quitté cette scène (pas
  // avant d'y être arrivée : l'image peut précéder la scène de peu).
  useEffect(() => {
    reached.current = false
  }, [shown])
  useEffect(() => {
    if (!storyScene) return
    if (current === storyScene) reached.current = true
    else if (reached.current) setShown(null)
  }, [current, storyScene])

  useEventListener(({ event, user }) => {
    if (event.type !== 'show-image' && event.type !== 'show-close') return
    // Le rôle vient de la session posée par le serveur : un joueur ne peut
    // pas imposer une image à toute la table.
    if (user?.info?.role !== 'gm') return
    setShown(event.type === 'show-image' ? { url: event.url, label: event.label, story: event.story } : null)
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
  const scene = shown.story ? adventureIn(shown.story.adventure, lang, custom)?.scenes[shown.story.scene] : undefined
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-3 bg-shade/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={shown.label || t('shownByGm')}
    >
      {/* Un clic n'importe où (image comprise) ferme l'image chez soi. */}
      <button className="absolute inset-0 cursor-default" onClick={() => setShown(null)} tabIndex={-1} aria-label={t('close')} />
      {scene ? (
        <div className="pointer-events-none relative flex max-w-[min(100%,64rem)] flex-col overflow-hidden rounded-2xl shadow-2xl">
          <img src={shown.url} alt={shown.label} className="max-h-[50dvh] w-full object-contain sm:max-h-[85dvh]" />
          {/* Le récit : sous l'image sur téléphone, posé sur son bas ailleurs. */}
          <div className="pointer-events-auto max-h-[35dvh] overflow-y-auto bg-black/80 px-4 py-3 text-white sm:absolute sm:inset-x-0 sm:bottom-0 sm:max-h-[60%] sm:bg-gradient-to-t sm:from-black/90 sm:via-black/80 sm:to-black/40 sm:px-6 sm:pb-5 sm:pt-8">
            {scene.chapter && <p className="text-xs uppercase tracking-wide text-white/65">{scene.chapter}</p>}
            <h2 className="text-lg font-semibold">{scene.title}</h2>
            {scene.narration.map((p, i) => (
              <p key={i} className="mt-1.5 text-sm leading-relaxed text-white/90 sm:text-base">{p}</p>
            ))}
            <div ref={slotRef} />
          </div>
        </div>
      ) : (
        <img
          src={shown.url}
          alt={shown.label}
          className="pointer-events-none relative max-h-[78dvh] max-w-full rounded-2xl object-contain shadow-2xl"
        />
      )}
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

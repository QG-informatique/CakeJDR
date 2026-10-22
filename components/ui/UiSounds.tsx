'use client'

import { useEffect } from 'react'
import { playUiSound } from '@/lib/sound'

/**
 * Un petit son à chaque bouton pressé, dans toute l'application : un retour
 * sonore pour les menus, les choix et les actions de combat. Le volume se
 * règle dans le salon d'attente et dans les options de la musique.
 */
export default function UiSounds() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const el = (e.target as Element | null)?.closest?.('button, [role="tab"], a.ui-btn, input[type="checkbox"], select')
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
      // Le bouton « Tester le son » joue déjà le sien.
      if (el.hasAttribute('data-no-ui-sound')) return
      playUiSound(el.classList.contains('ui-btn-primary') ? 'confirm' : 'click')
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [])
  return null
}

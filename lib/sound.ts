'use client'

import { useSyncExternalStore } from 'react'

/**
 * Volumes de la musique et des sons de l'interface, gardés dans ce
 * navigateur. Le lecteur de musique, le salon d'attente du MJ automatique et
 * les sons des boutons lisent tous les mêmes valeurs.
 *
 * Les sons de l'interface sont fabriqués à la volée (Web Audio) : rien à
 * télécharger, aucun fichier sous licence.
 */
export type SoundKind = 'music' | 'ui'

const KEYS: Record<SoundKind, string> = { music: 'jdr_music_volume', ui: 'jdr_ui_volume' }
const DEFAULTS: Record<SoundKind, number> = { music: 5, ui: 40 }
const EVENT = 'jdr-sound-volume'

export function soundVolume(kind: SoundKind): number {
  if (typeof window === 'undefined') return DEFAULTS[kind]
  try {
    const raw = localStorage.getItem(KEYS[kind])
    const n = raw === null ? Number.NaN : Number(raw)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : DEFAULTS[kind]
  } catch {
    return DEFAULTS[kind]
  }
}

export function setSoundVolume(kind: SoundKind, value: number) {
  try {
    localStorage.setItem(KEYS[kind], String(Math.round(Math.min(Math.max(value, 0), 100))))
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function useSoundVolume(kind: SoundKind) {
  const value = useSyncExternalStore(subscribe, () => soundVolume(kind), () => DEFAULTS[kind])
  return [value, (v: number) => setSoundVolume(kind, v)] as const
}

/** Demande au lecteur de musique de rejoindre la musique de la table (clic de l'utilisateur). */
export const MUSIC_JOIN_EVENT = 'jdr-music-join'

let ctx: AudioContext | null = null

/**
 * Petit son de l'interface : `click` pour un bouton, `confirm` pour un bouton
 * principal, `test` pour essayer le volume.
 */
export function playUiSound(kind: 'click' | 'confirm' | 'test' = 'click') {
  const volume = soundVolume('ui') / 100
  if (volume <= 0 || typeof window === 'undefined') return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const notes = kind === 'test' ? [523, 659, 784] : kind === 'confirm' ? [660, 880] : [520]
    const start = ctx.currentTime
    notes.forEach((freq, i) => {
      const at = start + i * 0.07
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, at)
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.18 * volume, at + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(at)
      osc.stop(at + 0.1)
    })
  } catch {
    // Pas de Web Audio (vieux navigateur) : l'interface reste muette.
  }
}

'use client'

import { useSyncExternalStore } from 'react'
import { useParams } from 'next/navigation'

/**
 * Volumes de la musique et des sons de l'interface, gardés dans ce
 * navigateur. Le lecteur de musique, le salon d'attente du MJ automatique et
 * les sons des boutons lisent tous les mêmes valeurs. Le volume de la musique
 * est retenu par salle ; une salle jamais réglée reprend le dernier volume choisi.
 *
 * Les sons de l'interface sont fabriqués à la volée (Web Audio) : rien à
 * télécharger, aucun fichier sous licence.
 */
export type SoundKind = 'music' | 'ui'

const KEYS: Record<SoundKind, string> = { music: 'jdr_music_volume', ui: 'jdr_ui_volume' }
const DEFAULTS: Record<SoundKind, number> = { music: 5, ui: 40 }
const EVENT = 'jdr-sound-volume'

const roomKey = (kind: SoundKind, room?: string) => (kind === 'music' && room ? `${KEYS.music}:${room}` : null)

export function soundVolume(kind: SoundKind, room?: string): number {
  if (typeof window === 'undefined') return DEFAULTS[kind]
  try {
    const perRoom = roomKey(kind, room)
    const raw = (perRoom && localStorage.getItem(perRoom)) ?? localStorage.getItem(KEYS[kind])
    const n = raw === null ? Number.NaN : Number(raw)
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : DEFAULTS[kind]
  } catch {
    return DEFAULTS[kind]
  }
}

export function setSoundVolume(kind: SoundKind, value: number, room?: string) {
  try {
    const v = String(Math.round(Math.min(Math.max(value, 0), 100)))
    localStorage.setItem(KEYS[kind], v)
    const perRoom = roomKey(kind, room)
    if (perRoom) localStorage.setItem(perRoom, v)
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
  const room = useParams<{ id?: string }>()?.id
  const value = useSyncExternalStore(subscribe, () => soundVolume(kind, room), () => DEFAULTS[kind])
  return [value, (v: number) => setSoundVolume(kind, v, room)] as const
}

/** Demande au lecteur de musique de rejoindre la musique de la table (clic de l'utilisateur). */
export const MUSIC_JOIN_EVENT = 'jdr-music-join'

let ctx: AudioContext | null = null

/** Le contexte audio partagé, réveillé au besoin ; `null` sans Web Audio. */
function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/**
 * Petit son de l'interface : `click` pour un bouton, `confirm` pour un bouton
 * principal, `test` pour essayer le volume.
 */
export function playUiSound(kind: 'click' | 'confirm' | 'test' = 'click') {
  const volume = soundVolume('ui') / 100
  if (volume <= 0 || typeof window === 'undefined') return
  try {
    const ac = audio()
    if (!ac) return
    const notes = kind === 'test' ? [523, 659, 784] : kind === 'confirm' ? [660, 880] : [520]
    const start = ac.currentTime
    notes.forEach((freq, i) => {
      const at = start + i * 0.07
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, at)
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.18 * volume, at + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
      osc.connect(gain).connect(ac.destination)
      osc.start(at)
      osc.stop(at + 0.1)
    })
  } catch {
    // Pas de Web Audio (vieux navigateur) : l'interface reste muette.
  }
}

/** Sons du combat du MJ automatique : un par type d'action. */
export type CombatSound = 'strike' | 'spell' | 'heal' | 'shield' | 'miss' | 'hurt' | 'down'

/** Un ton bref, de `from` à `to` Hz, qui s'éteint en `length` secondes. */
function tone(ac: AudioContext, at: number, type: OscillatorType, from: number, to: number, length: number, level: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + length)
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(level, at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/** Un souffle de bruit filtré : choc d'arme, ou lame qui fend l'air. */
function noise(ac: AudioContext, at: number, length: number, level: number, from: number, to: number) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * length), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(from, at)
  filter.frequency.exponentialRampToValueAtTime(to, at + length)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(level, at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  src.connect(filter).connect(gain).connect(ac.destination)
  src.start(at)
  src.stop(at + length + 0.02)
}

/**
 * Joue le son d'une action de combat, au volume des sons de l'interface.
 * Fabriqué à la volée comme les sons des boutons : rien à télécharger.
 */
export function playCombatSound(kind: CombatSound) {
  const volume = soundVolume('ui') / 100
  if (volume <= 0 || typeof window === 'undefined') return
  const ac = audio()
  if (!ac) return
  try {
    const t = ac.currentTime
    const v = 0.22 * volume
    switch (kind) {
      case 'strike': // Coup d'arme : choc sourd et claquement.
        noise(ac, t, 0.12, v * 1.4, 2400, 600)
        tone(ac, t, 'sine', 140, 55, 0.18, v * 1.2)
        break
      case 'miss': // La lame fend l'air.
        noise(ac, t, 0.22, v * 0.8, 500, 2600)
        break
      case 'spell': // Sort : trois notes qui montent, scintillantes.
        ;[660, 990, 1320].forEach((f, i) => tone(ac, t + i * 0.05, 'triangle', f, f * 1.5, 0.3, v * 0.7))
        noise(ac, t, 0.3, v * 0.3, 3000, 6000)
        break
      case 'heal': // Soins : accord doux.
        ;[523, 659, 784].forEach((f, i) => tone(ac, t + i * 0.06, 'sine', f, f, 0.6, v * 0.6))
        break
      case 'shield': // Défense : bouclier qui tinte.
        tone(ac, t, 'square', 880, 840, 0.25, v * 0.35)
        tone(ac, t, 'sine', 1760, 1700, 0.35, v * 0.4)
        break
      case 'hurt': // Un ennemi touche un héros.
        tone(ac, t, 'sawtooth', 180, 70, 0.22, v * 0.6)
        noise(ac, t, 0.1, v, 900, 300)
        break
      case 'down': // Quelqu'un tombe.
        tone(ac, t, 'triangle', 330, 82, 0.6, v * 0.8)
        break
    }
  } catch {
    // Pas de Web Audio : le combat reste muet.
  }
}

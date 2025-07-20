'use client'
import React, { useState, useEffect, useRef } from 'react'
import CakeLogo from '@/components/ui/CakeLogo'

const PROFILE_KEY = 'jdr_profile'
const CUBE_SIZE = 200 // taille du cube en px

type FaceType = 'input' | 'button' | 'pips'

interface FaceDef {
  rotX: number
  rotY: number
  type: FaceType
  value?: number // pour les pips
}

/**
 * Génère les positions (ligne, col) des pips pour une valeur 1..6 sur une grille 3x3.
 * Grille indexée 0..2.
 */
function pipPattern(value: number): Array<{ r: number; c: number }> {
  // positions de base
  const center = { r: 1, c: 1 }
  const corners = [
    { r: 0, c: 0 },
    { r: 0, c: 2 },
    { r: 2, c: 0 },
    { r: 2, c: 2 }
  ]
  const mids = [
    { r: 0, c: 1 },
    { r: 2, c: 1 }
  ]

  switch (value) {
    case 1:
      return [center]
    case 2:
      return [corners[0], corners[3]]
    case 3:
      return [corners[0], center, corners[3]]
    case 4:
      return corners
    case 5:
      return [...corners, center]
    case 6:
      return [...corners, ...mids]
    default:
      return []
  }
}

/**
 * Composant qui dessine les pips pour une valeur de dé.
 */
function DicePips({ value, size }: { value: number; size: number }) {
  const dotSize = size * 0.14
  const gap = (size - 3 * dotSize) / 4 // espace entre colonnes / lignes
  const dots = pipPattern(value)
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        pointerEvents: 'none', // ne bloque pas le drag
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-label={`Face de dé affichant ${value}`}
    >
      {dots.map((d, i) => {
        const top = gap + d.r * (dotSize + gap)
        const left = gap + d.c * (dotSize + gap)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top,
              left,
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #fff, #bbb 70%)',
              boxShadow: '0 0 4px rgba(255,255,255,0.4), inset 0 0 3px rgba(0,0,0,0.7)',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))'
            }}
          />
        )
      })}
    </div>
  )
}

export default function Login({ onLogin }: { onLogin: (p: string) => void }) {
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(false)
  const origin = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const frame = useRef<number>()

  // Charger le pseudo existant
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) setPseudo(JSON.parse(raw).pseudo || '')
    } catch {}
  }, [])

  // Soumission du pseudo
  const handleLogin = () => {
    const name = pseudo.trim()
    if (!name) { setError('Choisis un pseudo'); return }
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
    const profile = {
      ...saved,
      pseudo: name,
      color: saved.color || '#1d4ed8',
      isMJ: saved.isMJ ?? false,
      loggedIn: true
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new Event('jdr_profile_change'))
    setError(null)
    onLogin(name)
  }

  // Drag pour rotation
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingRef.current = true
    origin.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    if (frame.current) cancelAnimationFrame(frame.current)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return
    const dx = e.clientX - origin.current.x
    const dy = e.clientY - origin.current.y
    const turnY = rotation.y + dx * 0.4
    const turnX = rotation.x - dy * 0.4
    setRotation({ x: turnX, y: turnY })
    velocity.current = { x: dx * 0.4, y: dy * 0.4 }
    origin.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = () => {
    draggingRef.current = false
    const decay = () => {
      velocity.current.x *= 0.95
      velocity.current.y *= 0.95
      if (Math.abs(velocity.current.x) < 0.01 && Math.abs(velocity.current.y) < 0.01) return
      setRotation(r => ({ x: r.x - velocity.current.y, y: r.y + velocity.current.x }))
      frame.current = requestAnimationFrame(decay)
    }
    frame.current = requestAnimationFrame(decay)
  }

  /**
   * Attribution des faces :
   * - rotX / rotY identiques à ta version initiale.
   * - On mappe chaque face à une valeur de dé si type 'pips'.
   *   (ordre choisi pour avoir une distribution logique)
   */
  const faces: FaceDef[] = [
    { rotX: 0, rotY: 0, type: 'input', value: 6 },      // face avant / valeur 6
    { rotX: 0, rotY: 90, type: 'pips', value: 5 },      // droite
    { rotX: 0, rotY: 180, type: 'button', value: 1 },   // arrière / valeur 1
    { rotX: 0, rotY: -90, type: 'pips', value: 2 },     // gauche
    { rotX: 90, rotY: 0, type: 'pips', value: 3 },      // dessus
    { rotX: -90, rotY: 0, type: 'pips', value: 4 }      // dessous
  ]

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      <CakeLogo xl />
      <div style={{ width: CUBE_SIZE, height: CUBE_SIZE, perspective: 600 }}>
        <div
          onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          style={{
            width: CUBE_SIZE,
            height: CUBE_SIZE,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: draggingRef.current ? 'none' : 'transform 0.3s ease-out',
            cursor: draggingRef.current ? 'grabbing' : 'grab',
            position: 'relative',
            userSelect: 'none'
          }}
        >
          {faces.map(({ rotX, rotY, type, value }, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                width: CUBE_SIZE,
                height: CUBE_SIZE,
                background: 'linear-gradient(145deg,#181818,#0f0f0f)',
                border: '4px solid #D6336C',
                borderRadius: '16px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 0 12px rgba(214,51,108,0.15)',
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(${CUBE_SIZE / 2}px)`,
                backfaceVisibility: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                positionAnchor: 'center'
              }}
            >
              {type === 'input' && (
                <input
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  placeholder="Pseudo"
                  className="px-2 py-1 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                  style={{ width: CUBE_SIZE * 0.6, textAlign: 'center', userSelect: 'text', pointerEvents: 'auto' }}
                />
              )}
              {type === 'button' && (
                <button
                  onClick={handleLogin}
                  className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded font-semibold shadow"
                  style={{ pointerEvents: 'auto' }}
                >
                  Entrer
                </button>
              )}
              {type === 'pips' && value && (
                <DicePips value={value} size={CUBE_SIZE} />
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-pink-400 text-sm">{error}</p>}
    </div>
  )
}

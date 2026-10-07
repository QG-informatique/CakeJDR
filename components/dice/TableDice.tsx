'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { useRoom, useStorage } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { levelUpLabel } from '@/lib/checks'
import { DICE_REVEAL_DELAY_MS } from '@/lib/dicePayload'
import { FACES, PIPS, toCss } from '@/lib/cubeMath'
import { verifyDiceEvent } from '@/components/chat/useDiceVerification'
import type { SessionEvent } from '@/components/app/hooks/useEventLog'
import { type DiceThrow, simulateThrow } from './diceThrow'

/** Les dés restent posés un moment après l'affichage du résultat, puis s'effacent. */
export const THROW_HOLD_MS = 2500
export const THROW_FADE_MS = 400

/** Inclinaison du regard : assez pour voir un cube, pas trop pour lire la face du dessus. */
const TILT_X = -14
const TILT_Y = 16
const FRAME_MS = 1000 / 60

const NEUTRAL = { bg: 'linear-gradient(145deg,#1b2030,#0f121b)', border: 'var(--color-accent)', text: '#eef2ff' }
const CRIT = { bg: 'linear-gradient(145deg,#2a1f06,#1a1200)', border: '#c9a227', text: '#fde68a', glow: 'rgba(253,197,0,0.55)' }
const FUMBLE = { bg: 'linear-gradient(145deg,#200808,#100404)', border: '#b91c1c', text: '#fca5a5', glow: 'rgba(220,38,38,0.55)' }

type Active = { ev: SessionEvent; plan: DiceThrow }

type Props = {
  /** Appelé quand les dés d'un lancer ont disparu de la table. */
  onDone?: (id: string) => void
}

/**
 * Les dés lancés sur la table, vus par toute la table.
 *
 * Chaque lancer tiré par le serveur arrive dans la liste partagée des
 * événements, avec l'heure où son résultat s'affiche. Chaque navigateur rejoue
 * alors le même lancer (`diceThrow.ts`) : les dés partent d'un bord, roulent,
 * rebondissent et s'arrêtent sur le résultat du serveur juste avant qu'il
 * n'apparaisse dans le chat. La couleur du critique ou de l'échec n'apparaît
 * qu'une fois le dé posé.
 *
 * Un lancer dont la signature du serveur ne correspond pas n'est pas montré.
 */
export default function TableDice({ onDone }: Props) {
  const room = useRoom()
  const events = useStorage((root) => root.events)
  const boxRef = useRef<HTMLDivElement>(null)
  const seen = useRef(new Set<string>())
  const [active, setActive] = useState<Active[]>([])
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (!events) return
    const now = Date.now()
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const ev = events[i] as SessionEvent
      // Les lancers anciens ne se rejouent pas, à l'arrivée sur la table non plus.
      if (now > ev.ts + THROW_HOLD_MS + 60_000) break
      if (ev.kind === 'chat' || seen.current.has(ev.id)) continue
      seen.current.add(ev.id)
      if (now > ev.ts + THROW_HOLD_MS || ev.ts - now > DICE_REVEAL_DELAY_MS + 2000) continue
      if (typeof ev.dice !== 'number' || typeof ev.result !== 'number') continue
      const results = ev.rolls?.results ?? [ev.result]
      const dice = ev.dice
      void verifyDiceEvent(room.id, ev).then((check) => {
        if (check === 'unverified') return
        const box = boxRef.current
        const plan = simulateThrow(ev.id, dice, results, box?.clientWidth || 600, box?.clientHeight || 400)
        // Quatre lancers à la fois au plus : au-delà, le plus ancien laisse la place.
        setActive((prev) => [...prev.slice(-3), { ev, plan }])
      })
    }
  }, [events, room.id])

  const finish = (id: string) => {
    setActive((prev) => prev.filter((a) => a.ev.id !== id))
    doneRef.current?.(id)
  }

  return (
    <div ref={boxRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {active.map((a) => (
        <Throw key={a.ev.id} ev={a.ev} plan={a.plan} onEnd={finish} />
      ))}
    </div>
  )
}

function Throw({ ev, plan, onEnd }: { ev: SessionEvent; plan: DiceThrow; onEnd: (id: string) => void }) {
  const t = useT()
  const dieRefs = useRef<(HTMLDivElement | null)[]>([])
  const cubeRefs = useRef<(HTMLDivElement | null)[]>([])
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([])
  const [settled, setSettled] = useState(false)
  const [fading, setFading] = useState(false)
  const endRef = useRef(onEnd)
  useEffect(() => {
    endRef.current = onEnd
  }, [onEnd])

  const start = ev.ts - DICE_REVEAL_DELAY_MS
  const size = plan.size
  const half = size / 2

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const draw = () => {
      const elapsed = Date.now() - start
      plan.dice.forEach((d, i) => {
        const die = dieRefs.current[i]
        const cube = cubeRefs.current[i]
        const shadow = shadowRefs.current[i]
        const last = d.frames.length - 1
        const f = d.frames[reduced ? last : Math.max(0, Math.min(last, Math.floor(elapsed / FRAME_MS)))]
        if (!die || !cube || !shadow || !f) return
        // Avant l'heure du lancer (horloge en avance sur le serveur), rien ne paraît.
        die.style.opacity = elapsed < 0 ? '0' : '1'
        shadow.style.opacity = elapsed < 0 ? '0' : String(0.5 * (1 - Math.min(f.lift, 40) / 80))
        die.style.transform = `translate3d(${f.x - half}px, ${f.y - half - f.lift}px, 0)`
        cube.style.transform = `rotateX(${TILT_X}deg) rotateY(${TILT_Y}deg) ${toCss(f.m)}`
        const k = 1 - Math.min(f.lift, 40) / 80
        shadow.style.transform = `translate3d(${f.x - half}px, ${f.y + half * 0.62}px, 0) scale(${k})`
      })
      if (!reduced && elapsed <= plan.settleMs) raf = requestAnimationFrame(draw)
    }
    draw()

    const now = Date.now()
    const timers = [
      window.setTimeout(() => setSettled(true), Math.max(0, start + plan.settleMs - now)),
      window.setTimeout(() => setFading(true), Math.max(0, ev.ts + THROW_HOLD_MS - now)),
      window.setTimeout(() => endRef.current(ev.id), Math.max(0, ev.ts + THROW_HOLD_MS + THROW_FADE_MS - now)),
    ]
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [ev, plan, start, half])

  const dice = ev.dice ?? 6
  const border = Math.max(2, Math.round(size / 28))
  const levelUp = ev.rolls?.levelUp

  return (
    <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${THROW_FADE_MS}ms ease` }}>
      {plan.dice.map((d, i) => (
        <Fragment key={i}>
          <div
            ref={(el) => { shadowRefs.current[i] = el }}
            className="absolute left-0 top-0"
            style={{
              width: size,
              height: size * 0.28,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6), transparent 70%)',
              opacity: 0,
              willChange: 'transform',
            }}
          />
          <div
            ref={(el) => { dieRefs.current[i] = el }}
            className="absolute left-0 top-0"
            style={{ width: size, height: size, perspective: size * 5, opacity: 0, willChange: 'transform' }}
          >
            <div
              ref={(el) => { cubeRefs.current[i] = el }}
              style={{ position: 'relative', width: size, height: size, transformStyle: 'preserve-3d' }}
            >
              {FACES.map((f, k) => {
                const value = d.labels[k] ?? 1
                const top = settled && k === d.top
                const tone = top && value === dice ? CRIT : top && value === 1 ? FUMBLE : null
                const look = tone ?? NEUTRAL
                return (
                  <div
                    key={k}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: look.bg,
                      border: `${border}px solid ${look.border}`,
                      borderRadius: size * 0.16,
                      boxShadow: tone
                        ? `0 0 ${size * 0.4}px ${size * 0.1}px ${tone.glow}, inset 0 0 10px rgba(0,0,0,0.6)`
                        : 'inset 0 0 10px rgba(0,0,0,0.6)',
                      transform: `rotateX(${f.rx}deg) rotateY(${f.ry}deg) translateZ(${half}px)`,
                      backfaceVisibility: 'hidden',
                      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                    }}
                  >
                    {dice === 6 ? (
                      <Pips value={value} size={size} border={border} color={tone ? look.text : '#f4f6ff'} />
                    ) : (
                      <span
                        className="select-none font-black tabular-nums"
                        style={{ fontSize: size * (value >= 100 ? 0.32 : value >= 10 ? 0.42 : 0.5), color: look.text }}
                      >
                        {value}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {levelUp && settled && (
              <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {t(levelUpLabel(i))}
              </span>
            )}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function Pips({ value, size, border, color }: { value: number; size: number; border: number; color: string }) {
  const inner = size - border * 2
  const dot = size * 0.15
  const gap = (inner - 3 * dot) / 4
  return (
    <>
      {(PIPS[value] ?? []).map(([row, col]) => (
        <span
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            top: gap + row * (dot + gap),
            left: gap + col * (dot + gap),
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${color}, color-mix(in srgb, ${color} 70%, #000) 70%)`,
            boxShadow: 'inset 0 0 3px rgba(0,0,0,0.7)',
          }}
        />
      ))}
    </>
  )
}

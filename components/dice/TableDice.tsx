'use client'

import { Fragment, type Ref, type RefObject, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useBroadcastEvent, useEventListener, useRoom, useStorage } from '@liveblocks/react'
import { Hand } from 'lucide-react'
import { useT } from '@/lib/useT'
import { levelUpLabel } from '@/lib/checks'
import { CUBE_ROTATIONS, FACES, type Mat, PIPS, toCss } from '@/lib/cubeMath'
import {
  autoThrow, type DiceThrow, dieRotation, dieSize, finalLabels, FRAME_MS, homePoint, MAX_THROW_MS,
  MAX_THROW_SPEED, MIN_THROW_SPEED, randomSeed, seeded, simulateThrow, startLabels, steerLabels,
  type ThrowParams, TILT_X, TILT_Y,
} from '@/lib/diceThrow'
import { verifyDiceEvent } from '@/components/chat/useDiceVerification'
import type { SessionEvent } from '@/components/app/hooks/useEventLog'

/** Les dés restent posés un moment après l'affichage du résultat, puis s'effacent. */
export const THROW_HOLD_MS = 2500
export const THROW_FADE_MS = 400

const NEUTRAL = { bg: 'linear-gradient(145deg,#1b2030,#0f121b)', border: 'var(--color-accent)', text: '#eef2ff' }
const CRIT = { bg: 'linear-gradient(145deg,#2a1f06,#1a1200)', border: '#c9a227', text: '#fde68a', glow: 'rgba(253,197,0,0.55)' }
const FUMBLE = { bg: 'linear-gradient(145deg,#200808,#100404)', border: '#b91c1c', text: '#fca5a5', glow: 'rgba(220,38,38,0.55)' }
type Tone = typeof CRIT | typeof FUMBLE

/** Le dé tenu en main est soulevé de la table. */
const HELD_LIFT = 18
/** Rythme des positions envoyées aux autres joueurs pendant qu'on tient le dé. */
const HOLD_SEND_MS = 50
/** Sans nouvelles du joueur qui tient le dé, il retourne à sa place. */
const HOLD_TIMEOUT_MS = 3000

export type TableDiceHandle = {
  /** Lance le dé sans geste (bouton « Lancer »). */
  throwNow: () => void
}

export type ThrowResult = { id: string; results: number[]; levelUp?: boolean }

type Props = {
  ref?: Ref<TableDiceHandle>
  /** Dé en main : type et nombre (une demande du MJ peut en compter plusieurs). */
  dice: number
  count: number
  disabled: boolean
  /** Nom montré aux autres pendant qu'on tient le dé. */
  name: string
  /** Envoie le geste au serveur, qui tire le résultat ; `null` en cas d'échec. */
  onThrow: (p: ThrowParams) => Promise<ThrowResult | null>
  /** Appelé quand les dés d'un lancer ont disparu de la table. */
  onDone?: (id: string) => void
}

type Active = {
  key: string
  seed: number
  id: string | null
  own: boolean
  dice: number
  plan: DiceThrow
  /** Passage du plateau du lanceur au mien. */
  sx: number
  sy: number
  size: number
  /** Heure du lâcher, horloge locale. */
  start: number
  labels: number[][]
  results: number[] | null
  levelUp: boolean
}

type Remote = { x: number; y: number; name: string; dice: number; count: number; rot: number }

/**
 * Le dé de la table, partagé par tous les joueurs.
 *
 * Il attend au milieu du plateau. On l'attrape à la souris ou au doigt, on le
 * traîne, et on le lâche d'un geste : il part avec la vitesse du geste
 * (`lib/diceThrow.ts`). Un geste trop mou ne lance rien, le dé revient à sa
 * place : on ne peut pas le poser sur la face voulue. Le résultat est tiré par
 * le serveur, qui range le geste avec le lancer ; chaque navigateur rejoue
 * alors le même lancer, à la même vitesse. Pendant qu'un joueur tient le dé,
 * les autres le voient bouger dans sa main.
 *
 * La couleur du critique ou de l'échec n'apparaît qu'une fois le dé posé. Un
 * lancer dont la signature du serveur ne correspond pas n'est pas montré.
 */
export default function TableDice({ ref, dice, count, disabled, name, onThrow, onDone }: Props) {
  const room = useRoom()
  const events = useStorage((root) => root.events)
  const broadcast = useBroadcastEvent()
  const t = useT()
  const boxRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const seen = useRef(new Set<string>())
  const ownSeeds = useRef(new Set<number>())
  const [active, setActive] = useState<Active[]>([])
  const activeRef = useRef(active)
  const [hand, setHand] = useState(() => ({ seed: randomSeed(), rot: Math.floor(Math.random() * CUBE_ROTATIONS.length) }))
  const [remote, setRemote] = useState<Remote | null>(null)
  const [weak, setWeak] = useState(false)
  const callbacks = useRef({ onThrow, onDone })
  useEffect(() => {
    callbacks.current = { onThrow, onDone }
    activeRef.current = active
  })

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Le dé tenu par un autre joueur ; sans nouvelles, il retourne à sa place.
  useEventListener(({ event }) => {
    if (event.type === 'dice-hold') setRemote({ ...event })
    else if (event.type === 'dice-drop') setRemote(null)
  })
  useEffect(() => {
    if (!remote) return
    const timer = window.setTimeout(() => setRemote(null), HOLD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [remote])

  useEffect(() => {
    if (!weak) return
    const timer = window.setTimeout(() => setWeak(false), 1800)
    return () => window.clearTimeout(timer)
  }, [weak])

  // Lancers arrivés dans la liste partagée.
  useEffect(() => {
    if (!events) return
    const now = Date.now()
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const ev = events[i] as SessionEvent
      // Les lancers anciens ne se rejouent pas, à l'arrivée sur la table non plus.
      if (now > ev.ts + THROW_HOLD_MS + 60_000) break
      if (ev.kind === 'chat' || seen.current.has(ev.id)) continue
      seen.current.add(ev.id)
      if (typeof ev.dice !== 'number' || typeof ev.result !== 'number') continue
      const results = ev.rolls?.results ?? [ev.result]
      const levelUp = Boolean(ev.rolls?.levelUp)
      // Mon propre lancer : déjà sur la table depuis que je l'ai lâché.
      const seed = ev.throw?.seed
      if (seed !== undefined && ownSeeds.current.has(seed)) {
        setActive((prev) =>
          prev.map((a) => (a.own && a.seed === seed ? { ...a, id: ev.id, results: a.results ?? results, levelUp } : a)),
        )
        continue
      }
      if (now > ev.ts + THROW_HOLD_MS || ev.ts - now > MAX_THROW_MS + 5000) continue
      const evDice = ev.dice
      void verifyDiceEvent(room.id, ev).then((check) => {
        if (check === 'unverified') return
        const w = boxRef.current?.clientWidth || 600
        const h = boxRef.current?.clientHeight || 400
        // Un ancien lancer, sans geste, part de la place du dé.
        const p = ev.throw ?? autoThrow(Math.floor(seeded(ev.id)() * 0xffffffff), w, h, 0)
        const plan = simulateThrow(p, results.length)
        const labels = startLabels(p.seed, evDice, results.length).map((l, k) =>
          finalLabels(l, plan.dice[k]?.top ?? 0, results[k] ?? 1, evDice),
        )
        const entry: Active = {
          key: ev.id, seed: p.seed, id: ev.id, own: false, dice: evDice, plan,
          sx: w / p.w, sy: h / p.h, size: dieSize(w, h),
          start: ev.ts - plan.settleMs, labels, results, levelUp,
        }
        setRemote(null)
        // Quatre lancers à la fois au plus : au-delà, le plus ancien laisse la place.
        setActive((prev) => [...prev.slice(-3), entry])
      })
    }
  }, [events, room.id])

  const launch = (p: ThrowParams) => {
    ownSeeds.current.add(p.seed)
    const plan = simulateThrow(p, count)
    const entry: Active = {
      key: `own-${p.seed}`, seed: p.seed, id: null, own: true, dice, plan, sx: 1, sy: 1, size: plan.size,
      start: Date.now(), labels: startLabels(p.seed, dice, count), results: null, levelUp: false,
    }
    setActive((prev) => [...prev.slice(-3), entry])
    setHand({ seed: randomSeed(), rot: Math.floor(Math.random() * CUBE_ROTATIONS.length) })
    void callbacks.current.onThrow(p).then((r) => {
      setActive((prev) =>
        r
          ? prev.map((a) => (a.key === entry.key
            ? { ...a, id: r.id, results: a.results ?? r.results, levelUp: a.levelUp || Boolean(r.levelUp) }
            : a))
          : prev.filter((a) => a.key !== entry.key),
      )
    })
  }

  const busy = active.length > 0
  const canGrab = !busy && !disabled && !remote && box.w > 0

  useImperativeHandle(ref, () => ({
    throwNow: () => {
      if (!canGrab) return
      launch(autoThrow(hand.seed, box.w, box.h, hand.rot))
    },
  }))

  const finish = (key: string) => {
    const done = activeRef.current.find((a) => a.key === key)
    setActive((prev) => prev.filter((a) => a.key !== key))
    if (done?.id) callbacks.current.onDone?.(done.id)
  }

  const shown = remote
    ? { dice: remote.dice, count: remote.count, rot: remote.rot }
    : { dice, count, rot: hand.rot }
  const handLabels = startLabels(hand.seed, shown.dice, 1)[0] ?? []
  const home = homePoint(box.w, box.h)

  return (
    <div ref={boxRef} className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {!busy && box.w > 0 && (
        <HandDie
          boxRef={boxRef}
          size={dieSize(box.w, box.h)}
          dice={shown.dice}
          count={shown.count}
          labels={handLabels}
          m={dieRotation(shown.rot, 0)}
          home={home}
          remote={remote ? { x: remote.x * box.w, y: remote.y * box.h } : null}
          canGrab={canGrab}
          title={t('diceGrabHint')}
          onHold={(x, y) =>
            broadcast({ type: 'dice-hold', x: x / box.w, y: y / box.h, name, dice, count, rot: hand.rot })
          }
          onRelease={(x, y, vx, vy) => {
            if (Math.hypot(vx, vy) < MIN_THROW_SPEED) {
              broadcast({ type: 'dice-drop' })
              setWeak(true)
              return
            }
            setWeak(false)
            const cx = Math.max(0, Math.min(box.w, x))
            const cy = Math.max(0, Math.min(box.h, y))
            launch({ x: cx, y: cy, vx, vy, w: box.w, h: box.h, seed: hand.seed, rot: hand.rot })
          }}
        />
      )}
      {remote && !busy && (
        <span
          className="absolute flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white"
          style={{ left: remote.x * box.w, top: remote.y * box.h + dieSize(box.w, box.h) / 2 + 6 }}
        >
          <Hand size={12} aria-hidden />
          {t('diceHeldBy').replace('{name}', remote.name)}
        </span>
      )}
      {weak && !busy && (
        <span
          role="status"
          className="absolute -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-xs font-semibold text-white animate-fadeIn"
          style={{ left: home.x, top: home.y + dieSize(box.w, box.h) / 2 + 8 }}
        >
          {t('diceThrowHarder')}
        </span>
      )}
      <div aria-hidden="true">
        {active.map((a) => (
          <Throw key={a.key} entry={a} onEnd={finish} />
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Le dé en main                                                       */
/* ------------------------------------------------------------------ */

type HandProps = {
  boxRef: RefObject<HTMLDivElement | null>
  size: number
  dice: number
  count: number
  labels: number[]
  m: Mat
  home: { x: number; y: number }
  /** Position du dé dans la main d'un autre joueur. */
  remote: { x: number; y: number } | null
  canGrab: boolean
  title: string
  onHold: (x: number, y: number) => void
  onRelease: (x: number, y: number, vx: number, vy: number) => void
}

/**
 * Le dé qui attend sa place. Tenu en main, il suit le pointeur, soulevé, et
 * penche dans le sens du mouvement sans rouler, comme celui de la page
 * d'accueil. La vitesse du lâcher est mesurée sur les derniers mouvements
 * seulement : un geste qui ralentit avant de lâcher n'est pas un lancer.
 */
function HandDie({ boxRef, size, dice, count, labels, m, home, remote, canGrab, title, onHold, onRelease }: HandProps) {
  const dieRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const props = useRef({ home, remote, canGrab, size, m, onHold, onRelease })
  useEffect(() => {
    props.current = { home, remote, canGrab, size, m, onHold, onRelease }
  })
  const s = useRef({
    drag: false,
    pos: { ...home },
    lift: 0,
    grab: { x: 0, y: 0 },
    samples: [] as Array<{ x: number; y: number; t: number }>,
    pointerId: -1,
    lastSend: 0,
    lean: { x: 0, y: 0 },
    leanTarget: { x: 0, y: 0 },
  })

  useEffect(() => {
    const die = dieRef.current
    const cube = cubeRef.current
    const shadow = shadowRef.current
    if (!die || !cube || !shadow) return
    const st = s.current
    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const p = props.current
      const half = p.size / 2
      if (!st.drag) {
        // Retour à sa place (ou dans la main d'un autre joueur), en douceur.
        const target = p.remote ?? p.home
        const k = 1 - Math.exp(-14 * dt)
        st.pos.x += (target.x - st.pos.x) * k
        st.pos.y += (target.y - st.pos.y) * k
        st.lift += ((p.remote ? HELD_LIFT : 0) - st.lift) * k
      } else {
        st.lift += (HELD_LIFT - st.lift) * (1 - Math.exp(-20 * dt))
      }
      const follow = 1 - Math.exp(-12 * dt)
      st.lean.x += (st.leanTarget.x - st.lean.x) * follow
      st.lean.y += (st.leanTarget.y - st.lean.y) * follow
      const relax = Math.exp(-8 * dt)
      st.leanTarget.x *= relax
      st.leanTarget.y *= relax

      die.style.transform = `translate3d(${st.pos.x - half}px, ${st.pos.y - half - st.lift}px, 0)`
      cube.style.transform =
        `rotateX(${TILT_X}deg) rotateY(${TILT_Y}deg) rotateX(${st.lean.x}deg) rotateY(${st.lean.y}deg) ${toCss(p.m)}`
      const k = 1 - Math.min(st.lift, 40) / 80
      shadow.style.transform = `translate3d(${st.pos.x - half}px, ${st.pos.y + half * 0.62}px, 0) scale(${k})`
      shadow.style.opacity = String(0.5 * k)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const local = (e: PointerEvent) => {
      const r = boxRef.current?.getBoundingClientRect()
      return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) }
    }

    const onDown = (e: PointerEvent) => {
      if (!props.current.canGrab) return
      e.preventDefault()
      e.stopPropagation()
      try {
        die.setPointerCapture(e.pointerId)
      } catch {
        // capture refusée : les écouteurs de fenêtre prennent le relais
      }
      const at = local(e)
      st.drag = true
      st.pointerId = e.pointerId
      st.grab = { x: at.x - st.pos.x, y: at.y - st.pos.y }
      st.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
      setDragging(true)
    }

    const onMove = (e: PointerEvent) => {
      if (!st.drag || e.pointerId !== st.pointerId) return
      const at = local(e)
      const nx = at.x - st.grab.x
      const ny = at.y - st.grab.y
      const clamp = (v: number) => Math.max(-14, Math.min(14, v))
      st.leanTarget.x = clamp(-(ny - st.pos.y) * 1.6)
      st.leanTarget.y = clamp((nx - st.pos.x) * 1.6)
      st.pos.x = nx
      st.pos.y = ny
      const now = performance.now()
      st.samples.push({ x: e.clientX, y: e.clientY, t: now })
      if (st.samples.length > 6) st.samples.shift()
      if (now - st.lastSend > HOLD_SEND_MS) {
        st.lastSend = now
        props.current.onHold(nx, ny)
      }
    }

    const onUp = (e: PointerEvent) => {
      if (!st.drag || e.pointerId !== st.pointerId) return
      try {
        die.releasePointerCapture(e.pointerId)
      } catch {
        // la capture peut déjà avoir été relâchée par le navigateur
      }
      st.drag = false
      setDragging(false)
      const now = performance.now()
      const first = st.samples.find((p) => now - p.t < 120) ?? st.samples[0]
      const lastSample = st.samples[st.samples.length - 1]
      let vx = 0
      let vy = 0
      // Un geste arrêté avant le lâcher ne lance rien.
      if (first && lastSample && lastSample.t > first.t && now - lastSample.t < 80) {
        const span = (lastSample.t - first.t) / 1000
        vx = (lastSample.x - first.x) / span
        vy = (lastSample.y - first.y) / span
      }
      const speed = Math.hypot(vx, vy)
      if (speed > MAX_THROW_SPEED) {
        vx *= MAX_THROW_SPEED / speed
        vy *= MAX_THROW_SPEED / speed
      }
      props.current.onRelease(st.pos.x, st.pos.y, vx, vy)
    }

    die.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      cancelAnimationFrame(raf)
      die.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [boxRef])

  return (
    <>
      <Shadow ref={shadowRef} size={size} />
      <div
        ref={dieRef}
        title={canGrab ? title : undefined}
        className="pointer-events-auto absolute left-0 top-0 touch-none select-none"
        style={{
          width: size,
          height: size,
          perspective: size * 5,
          cursor: dragging ? 'grabbing' : canGrab ? 'grab' : 'not-allowed',
          willChange: 'transform',
        }}
      >
        <Cube ref={cubeRef} size={size} dice={dice} labels={labels} />
        {count > 1 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-black/75 px-1.5 text-[11px] font-bold text-white">
            ×{count}
          </span>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Un lancer sur la table                                              */
/* ------------------------------------------------------------------ */

function Throw({ entry, onEnd }: { entry: Active; onEnd: (key: string) => void }) {
  const t = useT()
  const dieRefs = useRef<(HTMLDivElement | null)[]>([])
  const cubeRefs = useRef<(HTMLDivElement | null)[]>([])
  const shadowRefs = useRef<(HTMLDivElement | null)[]>([])
  const [labels, setLabels] = useState(entry.labels)
  const [settled, setSettled] = useState(false)
  const [fading, setFading] = useState(false)
  const steps = useRef<Array<{ die: number; frame: number; labels: number[] }>>([])
  const endRef = useRef(onEnd)
  useEffect(() => {
    endRef.current = onEnd
  }, [onEnd])

  const { plan, start, sx, sy, size, key } = entry
  const half = size / 2
  const scale = size / plan.size

  // Résultat connu : on prépare les changements de chiffres, faits face cachée.
  const { results, dice } = entry
  useEffect(() => {
    if (!results) return
    const from = Math.floor((Date.now() - start) / FRAME_MS) + 2
    const planned = plan.dice.flatMap((d, i) =>
      steerLabels(d, entry.labels[i] ?? [], results[i] ?? 1, dice, from).map((s) => ({ die: i, ...s })),
    )
    steps.current = planned.sort((a, b) => a.frame - b.frame)
    // Dé déjà posé (réponse tardive, animations réduites) : tout de suite.
    if (from > Math.max(...plan.dice.map((d) => d.frames.length))) {
      const now = steps.current
      steps.current = []
      setLabels((prev) => {
        const next = [...prev]
        now.forEach((s) => { next[s.die] = s.labels })
        return next
      })
    }
    // `entry.labels` ne change pas après la création du lancer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, plan, start, dice])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const draw = () => {
      const elapsed = Date.now() - start
      const index = Math.floor(elapsed / FRAME_MS)
      const due: typeof steps.current = []
      while (steps.current[0] && (reduced || steps.current[0].frame <= index)) due.push(steps.current.shift()!)
      if (due.length) {
        setLabels((prev) => {
          const next = [...prev]
          due.forEach((s) => { next[s.die] = s.labels })
          return next
        })
      }
      plan.dice.forEach((d, i) => {
        const die = dieRefs.current[i]
        const cube = cubeRefs.current[i]
        const shadow = shadowRefs.current[i]
        const last = d.frames.length - 1
        const f = d.frames[reduced ? last : Math.max(0, Math.min(last, index))]
        if (!die || !cube || !shadow || !f) return
        // Avant l'heure du lancer (horloge en avance sur le serveur), rien ne paraît.
        const x = f.x * sx
        const y = f.y * sy
        const lift = f.lift * scale
        die.style.opacity = elapsed < 0 ? '0' : '1'
        die.style.transform = `translate3d(${x - half}px, ${y - half - lift}px, 0)`
        cube.style.transform = `rotateX(${TILT_X}deg) rotateY(${TILT_Y}deg) ${toCss(f.m)}`
        const k = 1 - Math.min(lift, 40) / 80
        shadow.style.opacity = elapsed < 0 ? '0' : String(0.5 * k)
        shadow.style.transform = `translate3d(${x - half}px, ${y + half * 0.62}px, 0) scale(${k})`
      })
      if (!reduced && (elapsed <= plan.settleMs || steps.current.length)) raf = requestAnimationFrame(draw)
    }
    draw()

    const now = Date.now()
    const settleAt = start + plan.settleMs
    const timers = [
      window.setTimeout(() => setSettled(true), Math.max(0, settleAt - now)),
      window.setTimeout(() => setFading(true), Math.max(0, settleAt + THROW_HOLD_MS - now)),
      window.setTimeout(() => endRef.current(key), Math.max(0, settleAt + THROW_HOLD_MS + THROW_FADE_MS - now)),
    ]
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [plan, start, sx, sy, half, scale, key])

  return (
    <div style={{ opacity: fading ? 0 : 1, transition: `opacity ${THROW_FADE_MS}ms ease` }}>
      {plan.dice.map((d, i) => {
        const value = labels[i]?.[d.top] ?? 1
        // La couleur n'arrive qu'une fois le dé posé, sur le résultat du serveur.
        const tone = settled && results ? (value === dice ? CRIT : value === 1 ? FUMBLE : null) : null
        return (
          <Fragment key={i}>
            <Shadow ref={(el) => { shadowRefs.current[i] = el }} size={size} />
            <div
              ref={(el) => { dieRefs.current[i] = el }}
              className="absolute left-0 top-0"
              style={{ width: size, height: size, perspective: size * 5, opacity: 0, willChange: 'transform' }}
            >
              <Cube
                ref={(el) => { cubeRefs.current[i] = el }}
                size={size}
                dice={dice}
                labels={labels[i] ?? []}
                highlight={tone ? { face: d.top, tone } : null}
              />
              {entry.levelUp && settled && results && (
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {t(levelUpLabel(i))}
                </span>
              )}
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dessin                                                              */
/* ------------------------------------------------------------------ */

function Shadow({ ref, size }: { ref: Ref<HTMLDivElement>; size: number }) {
  return (
    <div
      ref={ref}
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
  )
}

type CubeProps = {
  ref: Ref<HTMLDivElement>
  size: number
  dice: number
  labels: number[]
  highlight?: { face: number; tone: Tone } | null
}

function Cube({ ref, size, dice, labels, highlight }: CubeProps) {
  const half = size / 2
  const border = Math.max(2, Math.round(size / 28))
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, transformStyle: 'preserve-3d' }}>
      {FACES.map((f, k) => {
        const value = labels[k] ?? 1
        const tone = highlight?.face === k ? highlight.tone : null
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

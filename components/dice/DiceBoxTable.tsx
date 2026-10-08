'use client'

import { type Ref, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { useRoom, useStorage } from '@liveblocks/react'
import type DiceBox from '@3d-dice/dice-box-threejs'
import type { DiceBoxCollide, DiceBoxDie, DiceBoxPose } from '@3d-dice/dice-box-threejs'
import { useT } from '@/lib/useT'
import { levelUpLabel } from '@/lib/checks'
import { boxRoll } from '@/lib/dicePool'
import { DICE_MAX_ROLL_MS, type DiceThrow } from '@/lib/dicePayload'
import { verifyDiceEvent } from '@/components/chat/useDiceVerification'
import type { SessionEvent } from '@/components/app/hooks/useEventLog'

/** Les dés restent posés un moment après l'affichage du résultat, puis s'effacent. */
export const THROW_HOLD_MS = 2500
export const THROW_FADE_MS = 400
/** Après l'arrêt de mes dés, le bouton « Lancer » revient vite : un nouveau lancer efface les dés posés. */
export const RELAUNCH_MS = 400
/** Lancers des autres en attente pendant que des dés roulent déjà. */
const QUEUE_MAX = 3

export type DiceBoxHandle = {
  /** Lance les dés (bouton « Lancer », demande du MJ). */
  throwNow: () => void
}

/** Lancer envoyé au serveur : les dés, les faces sur lesquelles ils se sont posés, le départ et la durée. */
export type ThrowSent = { dice: number[]; results: number[]; throw: DiceThrow; ms: number }
export type ThrowResult = { id: string; levelUp?: boolean }

type Props = {
  ref?: Ref<DiceBoxHandle>
  /** Dés lancés au prochain jet. */
  dice: number[]
  disabled: boolean
  /** Envoie le lancer au serveur ; `null` en cas d'échec (les dés quittent alors la table). */
  onThrow: (t: ThrowSent) => Promise<ThrowResult | null>
  /** Appelé quand les dés d'un de mes lancers ont disparu de la table. */
  onDone?: (id: string) => void
}

type Job = {
  key: string
  own: boolean
  dice: number[]
  seed: number
  /** Faces imposées : celles du lanceur, pour un lancer rejoué. */
  results?: number[]
  /** Heure d'affichage du résultat, pour un lancer rejoué. */
  ts?: number
  id: string | null
  levelUp: boolean
  settled: boolean
  /** Mes dés sont posés depuis assez longtemps pour relancer. */
  relaunch?: boolean
  /** `onDone` déjà appelé pour ce lancer. */
  released?: boolean
}

type Label = { x: number; y: number; text: string }

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1

/** Hasard rejouable (mulberry32) : même graine, même départ des dés chez tout le monde. */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fait tourner `fn` avec un hasard rejouable à la place de `Math.random`. */
function withSeed<T>(seed: number, fn: () => T): T {
  const random = Math.random
  Math.random = seeded(seed)
  try {
    return fn()
  } finally {
    Math.random = random
  }
}

/** Les lancers en attente qui ne sont pas déjà posés chez tout le monde. */
function stillDue(jobs: Job[]) {
  const now = Date.now()
  return jobs.filter((j) => (j.ts ?? now) + THROW_HOLD_MS > now)
}

/** Choc pendant le roulement, gardé pour en rejouer le son. */
type Knock = { frame: number; mass: number; speed: number; shape?: string; hit: number }

/** Un pas de physique sur 7 nombres par dé : position puis rotation. */
const POSE = 7

/**
 * Calcule tout le roulement d'un coup, comme la table le fait, en gardant la
 * pose de chaque dé à chaque pas et les chocs (pour le son).
 */
function record(box: DiceBox, frames: number[][], knocks: Knock[]) {
  const snap = () => frames.push(box.diceList.flatMap(({ body: { position: p, quaternion: q } }) => [p.x, p.y, p.z, q.x, q.y, q.z, q.w]))
  const off = box.diceList.map(({ body: die }) => {
    const knock = ({ body, target }: DiceBoxCollide) => {
      knocks.push({ frame: frames.length, mass: body.mass, speed: body.velocity.length(), shape: body.diceShape, hit: target.velocity.length() })
    }
    die.addEventListener('collide', knock)
    return () => die.removeEventListener('collide', knock)
  })
  box.animstate = 'simulate'
  box.iteration = 0
  box.rolling = true
  snap()
  while (!box.throwFinished()) {
    box.iteration += 1
    box.world.step(box.framerate)
    snap()
  }
  off.forEach((f) => f())
}

/**
 * Rejoue le roulement calculé, image par image, à la place de l'animation de
 * la table : celle-ci recalcule la physique en direct et, dès que la page
 * saccade (onglet en arrière-plan, téléphone lent), les dés pouvaient se poser
 * sur une autre face que celle lue et envoyée au serveur.
 */
function replay(box: DiceBox, run: number, frames: number[][], knocks: Knock[], done?: (this: DiceBox, v: unknown) => void) {
  box.animstate = 'throw'
  const start = performance.now()
  const frameMs = box.framerate * 1000
  const last = frames.length - 1
  let shown = -1
  let knock = 0
  const pose = (i: number, target: (d: DiceBoxDie) => DiceBoxPose) => {
    const f = frames[i] ?? []
    box.diceList.forEach((d, k) => {
      const o = k * POSE
      const p = target(d)
      p.position.set(f[o]!, f[o + 1]!, f[o + 2]!)
      p.quaternion.set(f[o + 3]!, f[o + 4]!, f[o + 5]!, f[o + 6]!)
    })
  }
  const tick = () => {
    // Dés effacés pendant le roulement.
    if (box.running !== run) return
    const i = Math.min(last, Math.floor((performance.now() - start) / frameMs))
    if (i !== shown) {
      shown = i
      pose(i, (d) => d)
      box.renderer.render(box.scene, box.camera)
    }
    // Les chocs sautés pendant une saccade restent muets.
    for (; knock < knocks.length && knocks[knock]!.frame <= i; knock += 1) {
      const k = knocks[knock]!
      if (i - k.frame > 5) continue
      box.eventCollide({
        body: { mass: k.mass, diceShape: k.shape, velocity: { length: () => k.speed }, world: { stepnumber: k.frame } },
        target: { velocity: { length: () => k.hit } },
      })
    }
    if (i < last) {
      requestAnimationFrame(tick)
      return
    }
    pose(last, (d) => d.body)
    box.rolling = false
    done?.call(box, box.notationVectors)
    box.running = Date.now()
    box.animateAfterThrow(box.running)
  }
  tick()
}

const accentOf = (el: HTMLElement) => {
  const v = getComputedStyle(el).getPropertyValue('--c-accent').trim()
  return /^#[0-9a-f]{6}$/i.test(v) ? v : '#2563eb'
}

/**
 * La table des dés, partagée par tous les joueurs (dice-box-threejs : dés en
 * 3D et vraie physique).
 *
 * Au lancer, les dés partent d'un bord de la table au hasard, avec une force
 * au hasard, et la physique décide : le navigateur du lanceur calcule tout le
 * roulement d'avance, lit les faces sur lesquelles les dés se poseront, et
 * les envoie au serveur avec la graine du départ. Le serveur signe le lancer ;
 * chaque navigateur le rejoue avec la même graine, en imposant les mêmes faces.
 *
 * Un lancer dont la signature du serveur ne correspond pas n'est pas montré.
 */
export default function DiceBoxTable({ ref, dice, disabled, onThrow, onDone }: Props) {
  const room = useRoom()
  const events = useStorage((root) => root.events)
  const t = useT()
  const hostId = `dicebox-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const hostRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<DiceBox | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const seen = useRef(new Set<string>())
  const ownSeeds = useRef(new Set<number>())
  const current = useRef<Job | null>(null)
  const queue = useRef<Job[]>([])
  const timers = useRef<number[]>([])
  const [fading, setFading] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const callbacks = useRef({ onThrow, onDone })
  useEffect(() => {
    callbacks.current = { onThrow, onDone }
  })

  // La table se crée une fois le plateau visible (il est caché sur mobile hors de l'onglet Table).
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let started = false
    const size = () => ({ x: host.clientWidth, y: host.clientHeight })
    const start = async () => {
      started = true
      try {
        const { default: Box } = await import('@3d-dice/dice-box-threejs')
        if (disposed) return
        const accent = accentOf(host)
        const box = new Box(`#${hostId}`, {
          assetPath: '/dice-box/',
          sounds: false,
          volume: 60,
          shadows: true,
          theme_surface: 'taverntable',
          theme_customColorset: {
            name: `cakejdr-${accent}`,
            foreground: '#ffffff',
            background: accent,
            outline: 'none',
            texture: 'none',
            material: 'none',
          },
          gravity_multiplier: 400,
          baseScale: 100,
          strength: 1,
        })
        await box.initialize()
        if (disposed) {
          box.renderer.dispose()
          box.renderer.domElement.remove()
          return
        }
        box.renderer.domElement.style.pointerEvents = 'none'
        boxRef.current = box
        setStatus('ready')
        // Les sons se chargent à part : sur certains téléphones, ils n'arrivent jamais.
        void box.loadSounds().then(() => {
          if (!disposed) box.sounds = true
        }).catch(() => {})
      } catch (e) {
        console.error('dés 3D indisponibles', e)
        if (!disposed) setStatus('failed')
      }
    }
    const ro = new ResizeObserver(() => {
      const s = size()
      if (s.x <= 0 || s.y <= 0) return
      if (!started) void start()
      const box = boxRef.current
      if (box && !box.rolling && !current.current) box.setDimensions(s)
    })
    ro.observe(host)
    return () => {
      disposed = true
      ro.disconnect()
      timers.current.forEach((id) => window.clearTimeout(id))
      const box = boxRef.current
      boxRef.current = null
      if (box) {
        box.clearDice()
        // La table écoute le redimensionnement de la fenêtre sans s'en détacher.
        box.setDimensions = () => {}
        box.renderer.dispose()
        box.renderer.domElement.remove()
      }
    }
  }, [hostId])

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  /** Lance les dés de ce lancer ; renvoie les faces calculées d'avance et la durée du roulement. */
  const play = (job: Job) => {
    const box = boxRef.current
    if (!box) return null
    const host = hostRef.current
    if (host && host.clientWidth > 0) box.setDimensions({ x: host.clientWidth, y: host.clientHeight })
    current.current = job
    setFading(false)
    setLabels([])
    const roll = boxRoll(job.dice, job.results)
    // Le roulement est calculé d'un coup, puis rejoué tel quel.
    const frames: number[][] = []
    const knocks: Knock[] = []
    const simulate = box.simulateThrow
    const animate = box.animateThrow
    box.simulateThrow = () => record(box, frames, knocks)
    box.animateThrow = (run, cb) => replay(box, run, frames, knocks, cb)
    // Le départ (bord, force, rotation) vient du hasard de la table : on le rend rejouable.
    let done: Promise<unknown>
    try {
      done = withSeed(job.seed, () => box.roll(roll.notation))
    } finally {
      box.simulateThrow = simulate
      box.animateThrow = animate
    }
    const faces = box.diceList.map((d) => Number(d.getLastValue()?.value ?? 1))
    void done.then(() => settle(job, roll.owners))
    const steps = Math.max(0, frames.length - 1)
    return { results: roll.read(faces), ms: Math.round(steps * box.framerate * 1000) }
  }

  // Dés posés : on les laisse un moment, puis ils s'effacent et le lancer suivant part.
  const settle = (job: Job, owners: number[]) => {
    if (current.current !== job) return
    job.settled = true
    if (job.levelUp) showLevelUp(owners)
    if (job.own) {
      later(() => {
        job.relaunch = true
        release(job)
      }, RELAUNCH_MS)
    }
    later(() => setFading(true), THROW_HOLD_MS)
    later(() => {
      if (current.current !== job) return
      boxRef.current?.clearDice()
      current.current = null
      setLabels([])
      setFading(false)
      next()
    }, THROW_HOLD_MS + THROW_FADE_MS)
  }

  // Mon lancer est fini pour la page : le bouton revient, les gains passent sur la fiche.
  const release = (job: Job) => {
    if (job.released || !job.id) return
    job.released = true
    callbacks.current.onDone?.(job.id)
  }

  // Montée de niveau : sous chaque dé, ce qu'il fait gagner.
  const showLevelUp = (owners: number[]) => {
    const box = boxRef.current
    const host = hostRef.current
    if (!box || !host) return
    const w = host.clientWidth
    const h = host.clientHeight
    const placed = new Map<number, Label>()
    box.diceList.forEach((d, k) => {
      const i = owners[k] ?? k
      const p = d.position.clone().project(box.camera)
      placed.set(i, { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h, text: t(levelUpLabel(i)) })
    })
    setLabels(Array.from(placed.values()))
  }

  const next = () => {
    // Un lancer déjà posé chez tout le monde ne se rejoue plus.
    queue.current = stillDue(queue.current)
    const job = queue.current.shift()
    if (job) play(job)
  }

  // Lancers des autres, arrivés dans la liste partagée.
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
      const levelUp = Boolean(ev.rolls?.levelUp)
      const seed = ev.throw?.seed
      // Mon propre lancer : il roule déjà.
      if (seed !== undefined && ownSeeds.current.has(seed)) {
        const job = current.current
        if (job?.own && job.seed === seed) {
          job.id ??= ev.id
          job.levelUp ||= levelUp
        }
        continue
      }
      if (now > ev.ts + THROW_HOLD_MS || ev.ts - now > DICE_MAX_ROLL_MS + 5000) continue
      const pool = ev.pool ?? (ev.rolls
        ? { dice: ev.rolls.results.map(() => ev.dice as number), results: ev.rolls.results }
        : { dice: [ev.dice], results: [ev.result] })
      void verifyDiceEvent(room.id, ev).then((check) => {
        if (check === 'unverified' || !boxRef.current) return
        const job: Job = {
          key: ev.id, own: false, dice: pool.dice, results: pool.results, ts: ev.ts,
          seed: seed ?? randomSeed(), id: ev.id, levelUp, settled: false,
        }
        if (current.current) {
          queue.current = [...queue.current.slice(-(QUEUE_MAX - 1)), job]
          return
        }
        play(job)
      })
    }
    // `play` lit tout dans des refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, room.id])

  useImperativeHandle(ref, () => ({
    throwNow: () => {
      const mine = current.current?.own ? current.current : null
      if (disabled || (mine && !mine.relaunch) || dice.length === 0) return
      const box = boxRef.current
      const host = hostRef.current
      const seed = randomSeed()
      const job: Job = { key: `own-${seed}`, own: true, dice, seed, id: null, levelUp: false, settled: false }
      let sent: { results: number[]; ms: number } | null = null
      if (box && host && status === 'ready') {
        // Mon lancer passe devant ceux des autres.
        timers.current.forEach((id) => window.clearTimeout(id))
        timers.current = []
        box.clearDice()
        ownSeeds.current.add(seed)
        sent = play(job)
      } else if (status === 'failed') {
        // Sans 3D (WebGL absent), le hasard du navigateur tient lieu de dés.
        sent = { results: dice.map((d) => 1 + Math.floor(Math.random() * d)), ms: 0 }
      }
      if (!sent) return
      const w = host?.clientWidth ?? 0
      const h = host?.clientHeight ?? 0
      void callbacks.current.onThrow({ dice, results: sent.results, throw: { seed, w, h }, ms: sent.ms }).then((r) => {
        if (!r) {
          // Lancer refusé : les dés quittent la table.
          if (current.current === job) {
            boxRef.current?.clearDice()
            current.current = null
            setLabels([])
            next()
          }
          return
        }
        job.id ??= r.id
        job.levelUp ||= Boolean(r.levelUp)
        if (job.settled && job.levelUp && current.current === job) showLevelUp(boxRoll(job.dice).owners)
        // Dés déjà posés avant la réponse : le lancer est terminé.
        if (status === 'failed') callbacks.current.onDone?.(r.id)
        else if (job.relaunch) release(job)
      })
    },
  }))

  return (
    <div
      className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
      style={{ opacity: fading ? 0 : 1, transition: `opacity ${THROW_FADE_MS}ms ease` }}
      aria-hidden="true"
    >
      <div id={hostId} ref={hostRef} className="absolute inset-0" />
      {labels.map((l, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white"
          style={{ left: l.x, top: l.y + 28 }}
        >
          {l.text}
        </span>
      ))}
    </div>
  )
}

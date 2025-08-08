'use client'

import { useEffect, useMemo, useRef } from 'react'
import { LiveList, LiveObject } from '@liveblocks/client'
import { useBroadcastEvent, useEventListener, useStorage, useMutation } from '@liveblocks/react'
import PopupResult from './PopupResult'
import type { DiceQueueItem, DiceState } from '@/liveblocks.config'

type DiceStartEvent = {
  type: 'dice-roll-start'
  entryId: string
  diceType: number
  result: number
  startAt: number
  endAt: number
  name: string
  color?: string
}
type DiceEndEvent = { type: 'dice-roll-end'; entryId: string }

const ROLL_SPIN_MS = 2000
const RESULT_DELAY_MS = 300
const HOLD_MS = 2000
const MAX_ROLL_WINDOW = ROLL_SPIN_MS + RESULT_DELAY_MS + HOLD_MS + 1500

export default function DiceHub() {
  // Storage root
  const root = useStorage((r) => r)
  const storageReady = !!root

  // Accès bruts
  const queueRaw = root?.get('diceQueue') as LiveList<DiceQueueItem> | undefined
  const stateRaw = root?.get('diceState') as LiveObject<DiceState> | undefined

  // Lecture sûre
  const queueItems: DiceQueueItem[] = useMemo(
    () => queueRaw?.toArray() ?? [],
    [queueRaw]
  )

  const diceStateObj: DiceState = stateRaw?.toObject() ?? { phase: 'idle' }

  // Dérivés
  const waiting = useMemo(
    () => queueItems.filter(i => i.status === 'queued').sort((a, b) => a.createdAt - b.createdAt),
    [queueItems]
  )

  // Helpers Liveblocks
  const getOrList = (storage: LiveObject<Liveblocks['Storage']>): LiveList<DiceQueueItem> => {
    let q = storage.get('diceQueue') as LiveList<DiceQueueItem> | undefined
    if (!q) { q = new LiveList<DiceQueueItem>([]); storage.set('diceQueue', q); return q }
    if (typeof q.toArray !== 'function') {
      const arr = Array.isArray(q) ? (q as unknown as DiceQueueItem[]) : []
      const live = new LiveList<DiceQueueItem>(arr)
      storage.set('diceQueue', live)
      return live
    }
    return q
  }

  const getOrState = (storage: LiveObject<Liveblocks['Storage']>): LiveObject<DiceState> => {
    let s = storage.get('diceState') as LiveObject<DiceState> | undefined
    if (!s) { s = new LiveObject<DiceState>({ phase: 'idle' }); storage.set('diceState', s); return s }
    if (typeof s.toObject !== 'function') {
      const obj = (s as unknown as DiceState) ?? { phase: 'idle' }
      const live = new LiveObject<DiceState>({ phase: 'idle', ...obj })
      storage.set('diceState', live)
      return live
    }
    return s
  }

  // Mutations
  // ⛔️ plus d’enqueue si le joueur a déjà une entrée queued OU active
  const enqueue = useMutation(({ storage }, item: DiceQueueItem) => {
    const q = getOrList(storage)
    const existing = q.toArray()
    const alreadyThere = existing.some(e => e.userId === item.userId && (e.status === 'queued' || e.status === 'active'))
    if (!alreadyThere) q.push(item)
  }, [])

  const promoteToActive = useMutation(({ storage }, id: string) => {
    const q = getOrList(storage)
    const list = q.toArray()
    const idx = list.findIndex(i => i.id === id)
    if (idx >= 0) q.set(idx, { ...q.get(idx)!, status: 'active', createdAt: Date.now() })
  }, [])

  const removeById = useMutation(({ storage }, id: string) => {
    const q = getOrList(storage)
    const list = q.toArray()
    const idx = list.findIndex(i => i.id === id)
    if (idx >= 0) q.delete(idx)
  }, [])

  const setDiceStateRolling = useMutation(({ storage }, payload: DiceStartEvent) => {
    const s = getOrState(storage)
    s.update({
      phase: 'rolling',
      name: payload.name,
      color: payload.color,
      diceType: payload.diceType,
      result: payload.result,
      startAt: payload.startAt,
      endAt: payload.endAt,
      entryId: payload.entryId,
    })
  }, [])

  const clearDiceState = useMutation(({ storage }) => {
    const s = getOrState(storage)
    s.update({ phase: 'idle' })
  }, [])

  const cleanupStale = useMutation(({ storage }) => {
    const q = getOrList(storage)
    const s = getOrState(storage)
    // actifs zombies
    const list = q.toArray()
    const cutoff = Date.now() - MAX_ROLL_WINDOW
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i]
      if (it.status === 'active' && it.createdAt < cutoff) q.delete(i)
    }
    // state zombie
    const st = s.toObject()
    if (st.phase === 'rolling' && (st.endAt ?? 0) < Date.now() - 200) {
      s.update({ phase: 'idle' })
    }
  }, [])

  const broadcast = useBroadcastEvent()

  // --- Fallback local pour l’UI: si 'dice-roll-end' ne revient pas, on coupe à endAt ---
  const uiEndTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (uiEndTimerRef.current) {
      window.clearTimeout(uiEndTimerRef.current)
      uiEndTimerRef.current = null
    }
    if (diceStateObj.phase === 'rolling' && (diceStateObj.endAt ?? 0) > Date.now()) {
      const left = Math.max(0, (diceStateObj.endAt ?? 0) - Date.now())
      uiEndTimerRef.current = window.setTimeout(() => {
        // coupe l’UI si jamais l’event 'dice-roll-end' n’est pas arrivé
        clearDiceState()
      }, left + 50)
    }
    return () => {
      if (uiEndTimerRef.current) window.clearTimeout(uiEndTimerRef.current)
    }
  }, [diceStateObj.phase, diceStateObj.endAt, clearDiceState])

  // --- Événements Liveblocks → mettent à jour diceState partagé (UI) ---
  useEventListener(({ event }: { event: Liveblocks['RoomEvent'] }) => {
    if (event.type === 'dice-roll-start') {
      setDiceStateRolling(event as DiceStartEvent)
    } else if (event.type === 'dice-roll-end') {
      clearDiceState()
    }
  })

  // --- Orchestration: promotion + diffusion + fin ---
  useEffect(() => {
    if (!storageReady) return
    if (!queueItems.length) return

    cleanupStale()

    const isRolling = diceStateObj.phase === 'rolling' && (diceStateObj.endAt ?? 0) > Date.now()
    const hasActive = queueItems.some(i => i.status === 'active')

    if (!hasActive && !isRolling) {
      const first = waiting[0]
      if (!first) return

      const startAt = Date.now() + 300
      const endAt = startAt + ROLL_SPIN_MS + RESULT_DELAY_MS + HOLD_MS
      const result = Math.max(1, Math.floor(Math.random() * first.diceType) + 1)

      promoteToActive(first.id)

      const startEvent: DiceStartEvent = {
        type: 'dice-roll-start',
        entryId: first.id,
        diceType: first.diceType,
        result,
        startAt,
        endAt,
        name: first.name,
        color: first.color,
      }
      broadcast(startEvent)

      const total = Math.max(0, endAt - Date.now()) + 20
      const t = window.setTimeout(() => {
        removeById(first.id)
        broadcast({ type: 'dice-roll-end', entryId: first.id } as DiceEndEvent)
      }, total)
      return () => window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady, queueItems.length, waiting.length, diceStateObj.phase, diceStateObj.endAt])

  // --- “API” publique: écoute jdr:roll puis kickstart si personne ne lance ---
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail || {}

      // Lis ton profil (jdr_profile)
      let profName = 'Joueur'
      let profColor: string | undefined = undefined
      try {
        const raw = localStorage.getItem('jdr_profile')
        if (raw) {
          const p = JSON.parse(raw)
          if (p?.pseudo && p?.loggedIn) {
            profName = String(p.pseudo)
            profColor = p.color || undefined
          }
        }
      } catch {}

      const name   = String(d?.name  ?? profName)
      const color  = (d?.color as string) ?? profColor
      const userId = String(d?.userId ?? 'anon')
      const diceType = Number(d?.diceType || 20)

      const entry: DiceQueueItem = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId,
        name,
        color,
        diceType,
        createdAt: Date.now(),
        status: 'queued',
      }
      enqueue(entry)

      // kickstart si pas d’actif ni de rolling (utile quand on est seul)
      setTimeout(() => {
        const isRolling = (root?.get('diceState')?.toObject?.()?.phase === 'rolling') &&
                          ((root?.get('diceState')?.toObject?.()?.endAt ?? 0) > Date.now())
        const hasActive = (root?.get('diceQueue')?.toArray?.() ?? []).some((x: DiceQueueItem) => x.status === 'active')
        if (!isRolling && !hasActive) {
          const list: DiceQueueItem[] = root?.get('diceQueue')?.toArray?.() ?? []
          const first = list.find(i => i.status === 'queued')
          if (!first) return

          const startAt = Date.now() + 250
          const endAt = startAt + ROLL_SPIN_MS + RESULT_DELAY_MS + HOLD_MS
          const result = Math.max(1, Math.floor(Math.random() * first.diceType) + 1)

          // promote
          const idx = list.findIndex(i => i.id === first.id)
          if (idx >= 0) (root!.get('diceQueue') as LiveList<DiceQueueItem>).set(idx, { ...first, status: 'active', createdAt: Date.now() })

          // broadcast start
          broadcast({
            type: 'dice-roll-start',
            entryId: first.id,
            diceType: first.diceType,
            result,
            startAt,
            endAt,
            name: first.name,
            color: first.color,
          } as DiceStartEvent)

          // program end
          const total = Math.max(0, endAt - Date.now()) + 20
          setTimeout(() => {
            // remove active
            const fresh: DiceQueueItem[] = root?.get('diceQueue')?.toArray?.() ?? []
            const rmIdx = fresh.findIndex(i => i.id === first.id)
            if (rmIdx >= 0) (root!.get('diceQueue') as LiveList<DiceQueueItem>).delete(rmIdx)
            broadcast({ type: 'dice-roll-end', entryId: first.id } as DiceEndEvent)
          }, total)
        }
      }, 30)
    }

    window.addEventListener('jdr:roll', handler as EventListener)
    return () => window.removeEventListener('jdr:roll', handler as EventListener)
  }, [enqueue, broadcast, root])

  // Affichage piloté par diceState (avec fallback timer ci-dessus)
  const bannerVisible = diceStateObj.phase === 'rolling' && (diceStateObj.endAt ?? 0) > Date.now()

  return (
    <>
      <PopupResult
        show={bannerVisible}
        result={diceStateObj.result ?? null}
        diceType={diceStateObj.diceType ?? 20}
        onFinish={() => {}}
      />

      <div
        className="absolute left-3 bottom-3 z-40 pointer-events-none flex flex-col-reverse gap-1"
        style={{ display: (bannerVisible || waiting.length > 0) ? 'flex' : 'none' }}
      >
        {/* Bandeau actif — reste jusqu’à endAt / event 'dice-roll-end' */}
        {bannerVisible && (
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-xs">
            <span className="font-semibold" style={{ color: diceStateObj.color || '#60a5fa' }}>
              {diceStateObj.name || '—'}
            </span>
            <span className="text-white/85">lance un D{diceStateObj.diceType ?? 20}…</span>
          </div>
        )}

        {/* En attente (au-dessus) */}
        {waiting.map(w => (
          <div
            key={w.id}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/50 border border-white/10 text-[11px]"
          >
            <span className="font-medium" style={{ color: w.color || '#9ca3af' }}>
              {w.name}
            </span>
            <span className="text-white/75">— en attente (D{w.diceType})</span>
          </div>
        ))}
      </div>
    </>
  )
}

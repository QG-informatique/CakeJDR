import { useEffect, useMemo } from 'react'
import { useMutation, useStorage } from '@liveblocks/react'
import type { CheckOutcome, RollsOutcome } from '@/lib/checks'

export type SessionEvent = {
  id: string
  /** `check` : test demandé par le MJ, un lancer de dé avec son résultat. */
  kind: 'chat' | 'dice' | 'check' | 'rolls'
  author?: string
  text?: string
  player?: string
  dice?: number
  result?: number
  ts: number
  isMJ?: boolean
  /** Signature du serveur sur un lancer de dé (`lib/diceSigning.ts`). */
  sig?: string
  check?: CheckOutcome
  /** `rolls` : plusieurs dés demandés par le MJ, `result` est leur somme. */
  rolls?: RollsOutcome
}

const prefix = 'jdr_events_'
/** Messages et lancers gardés par table ; les plus anciens partent au-delà. */
const MAX_EVENTS = 2000

export default function useEventLog(roomId: string) {
  const liveList = useStorage(root => root.events)
  const addLive = useMutation(({ storage }, e: SessionEvent) => {
    const list = storage.get('events')
    const exists = (Array.from(list) as SessionEvent[]).some(ev =>
      ev.ts === e.ts &&
      ev.kind === e.kind &&
      (e.kind === 'chat'
        ? ev.author === e.author && ev.text === e.text
        : ev.player === e.player && ev.dice === e.dice && ev.result === e.result)
    )
    if (exists) return
    list.push(e)
    for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
  }, [])
  const events = useMemo(() => {
    return liveList ? (Array.from(liveList) as SessionEvent[]) : []
  }, [liveList])

  // Persist events locally whenever the list changes
  useEffect(() => {
    try {
      localStorage.setItem(prefix + roomId, JSON.stringify(events))
    } catch {}
  }, [events, roomId])

  function addEvent(e: SessionEvent) {
    try {
      const raw = localStorage.getItem(prefix + roomId)
      const arr: SessionEvent[] = raw ? JSON.parse(raw) : []
      const exists = arr.some(ev =>
        ev.ts === e.ts &&
        ev.kind === e.kind &&
        (e.kind === 'chat'
          ? ev.author === e.author && ev.text === e.text
          : ev.player === e.player && ev.dice === e.dice && ev.result === e.result)
      )
      if (!exists) {
        arr.push(e)
        localStorage.setItem(prefix + roomId, JSON.stringify(arr))
      }
    } catch {}
    addLive(e)
  }

  return { events, addEvent }
}

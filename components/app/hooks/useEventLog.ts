import { useEffect, useMemo } from 'react'
import { useMutation, useStorage } from '@liveblocks/react'

export type SessionEvent = {
  id: string
  kind: 'chat' | 'dice'
  author?: string
  text?: string
  player?: string
  dice?: number
  result?: number
  ts: number
  isMJ?: boolean
}

const prefix = 'jdr_events_'

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
    if (!exists) list.push(e)
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

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
    storage.get('events').push(e)
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
      const arr = raw ? JSON.parse(raw) : []
      arr.push(e)
      localStorage.setItem(prefix + roomId, JSON.stringify(arr))
    } catch {}
    addLive(e)
  }

  return { events, addEvent }
}

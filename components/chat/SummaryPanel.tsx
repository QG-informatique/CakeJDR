'use client'
import { FC, useEffect, useState } from 'react'
import { useRoom, useStorage } from '@liveblocks/react'
import type { SessionEvent } from '../app/hooks/useEventLog'

type Props = { onClose: () => void }

type Filter = 'all' | 'live' | 'saved'

const LOCAL_PREFIX = 'jdr_events_'

const SummaryPanel: FC<Props> = ({ onClose }) => {
  const room = useRoom()
  const liveList = useStorage(root => root.events)
  const liveEvents = liveList ? (Array.from(liveList) as SessionEvent[]) : []
  const [savedEvents, setSavedEvents] = useState<SessionEvent[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!room) return
    try {
      const raw = localStorage.getItem(LOCAL_PREFIX + room.id)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setSavedEvents(arr)
      }
    } catch {}
  }, [room])

  const combined = [...liveEvents]
  savedEvents.forEach(ev => {
    if (!combined.some(e => e.id === ev.id)) combined.push(ev)
  })
  combined.sort((a,b) => a.ts - b.ts)

  const displayed = combined.filter(ev => {
    if (filter === 'live') return liveEvents.some(e => e.id === ev.id)
    if (filter === 'saved') return savedEvents.some(e => e.id === ev.id)
    return true
  })

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <div className="flex items-center mb-3 gap-2">
        <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="bg-black/40 text-white rounded px-2 py-1 text-sm">
          <option value="all">All</option>
          <option value="live">Live only</option>
          <option value="saved">Saved only</option>
        </select>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      <ul className="flex-1 overflow-y-auto space-y-1 text-sm">
        {displayed.map(ev => (
          <li key={ev.id} className="px-2 py-1 rounded bg-black/30 border border-white/10">
            {ev.kind === 'chat' && <span><strong>{ev.author}:</strong> {ev.text}</span>}
            {ev.kind === 'dice' && <span>🎲 {ev.player} D{ev.dice} → {ev.result}</span>}
          </li>
        ))}
        {displayed.length === 0 && <li className="text-center text-gray-400">No events</li>}
      </ul>
    </div>
  )
}

export default SummaryPanel

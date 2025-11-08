'use client'

import { FC, RefObject, useRef, useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BarChart3, MessageSquare } from 'lucide-react'
import { useBroadcastEvent, useRoom, useEventListener } from '@liveblocks/react'
import useProfile from '../app/hooks/useProfile'
import SessionSummary from './SessionSummary'
import DiceStats from './DiceStats'
import useEventLog, { SessionEvent } from '../app/hooks/useEventLog'
import { useT } from '@/lib/useT'
import { debug } from '@/lib/debug'

type Roll = { player: string, dice: number, result: number }

interface Props {
  chatBoxRef: RefObject<HTMLDivElement | null>
  history: Roll[]
  author: string
}

const ChatBox: FC<Props> = ({ chatBoxRef, history, author }) => {
  const room = useRoom()
  const { events, addEvent } = useEventLog(room.id)
  const sortedEvents = useMemo(() => {
    const seen = new Set<string>()
    const unique: SessionEvent[] = []
    for (const ev of events as SessionEvent[]) {
      const key = ev.kind === 'chat'
        ? `${ev.kind}-${ev.ts}-${ev.author}-${ev.text}`
        : `${ev.kind}-${ev.ts}-${ev.player}-${ev.dice}-${ev.result}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(ev)
      }
    }
    return unique.sort((a, b) => a.ts - b.ts)
  }, [events])
  const [inputValue, setInputValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const sessionStart = useRef(Date.now())
  const [showHistory, setShowHistory] = useState(false)
  const displayedEvents = showHistory
    ? sortedEvents
    : sortedEvents.filter(ev => ev.ts >= sessionStart.current)
  const broadcast = useBroadcastEvent()
  const profile = useProfile()
  const t = useT()
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('chatPanelCollapsed') === '1'
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatPanelCollapsed', collapsed ? '1' : '0')
    }
  }, [collapsed])

  const sendMessage = async () => {
    if (inputValue.trim() === '') return

    const msg = { author, text: inputValue.trim(), isMJ: profile?.isMJ }
    const ts = Date.now()

    broadcast({ type: 'chat', author: msg.author, text: msg.text, isMJ: msg.isMJ, ts } as Liveblocks['RoomEvent'])
    addEvent({ id: crypto.randomUUID(), kind: 'chat', author: msg.author, text: msg.text, ts, isMJ: msg.isMJ })
    debug('chat', msg)

    setInputValue('')
  }

  // Receive remote chat events and persist them to storage
  useEventListener((payload: any) => {
    const { event } = payload
    if (event?.type === 'chat') {
      const ts = typeof event.ts === 'number' ? event.ts : Date.now()
      addEvent({ id: crypto.randomUUID(), kind: 'chat', author: event.author, text: event.text, ts, isMJ: !!event.isMJ })
    }
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  // When collapsed, only show a floating button so the panel frees all space
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Expand chat panel"
        className="absolute top-2 right-2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
      >
        <ChevronLeft size={20} />
      </button>
    )
  }

  // Summary view
  if (showSummary) {
    return (
      <aside
        className="w-full lg:w-1/5 p-4 flex flex-col relative rounded-xl border border-white/10 bg-black/15 backdrop-blur-[2px] shadow-lg shadow-black/10 transition flex-shrink-0 text-white"
        style={{ boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse chat panel"
          className="absolute top-2 left-2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
        >
          <ChevronRight size={20} />
        </button>
        <SessionSummary onClose={() => setShowSummary(false)} />
      </aside>
    )
  }

  return (
    <aside
      className="w-full lg:w-1/5 p-4 flex flex-col relative rounded-xl border border-white/10 bg-black/15 backdrop-blur-[2px] shadow-lg shadow-black/10 transition flex-shrink-0 text-white"
      style={{ boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)' }}
    >
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Collapse chat panel"
        className="absolute top-2 left-2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
      >
        <ChevronRight size={20} />
      </button>

      {/* Header buttons */}
      <div className="flex justify-center items-center mb-2 gap-2">
        <button
          className="px-5 py-2 rounded-xl font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-yellow-400 hover:text-black transition duration-100 flex items-center justify-center min-h-[44px]"
          style={{ minHeight: 44 }}
          onClick={() => setShowSummary(true)}
        >
          {t('sessionSummary')}
        </button>
        <button
          className="px-5 py-2 rounded-xl font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-blue-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[44px]"
          style={{ minHeight: 44 }}
          onClick={() => setShowStats(s => !s)}
          title={t('diceStats')}
        >
          {showStats ? (
            <span className="inline-flex items-center gap-1"><MessageSquare size={14} /> {t('chat')}</span>
          ) : (
            <span className="inline-flex items-center gap-1"><BarChart3 size={14} /> {t('diceStats')}</span>
          )}
        </button>
      </div>

      {/* Vertical layout: stats (optional) + chat */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        {showStats && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="text-center font-bold mb-2">{t('diceStatsTitle')}</div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/15 backdrop-blur-[2px] shadow p-2 min-h-0">
              <DiceStats history={history} />
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 flex flex-col ${showStats ? '' : 'h-full'}`}>
          <h2 className="text-xl font-bold mb-2 text-center">{t('chat')}</h2>
          <div
            ref={chatBoxRef}
            className="relative flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/15 backdrop-blur-[2px] shadow p-2 min-h-0"
          >
            <button
              onClick={() => setShowHistory(h => !h)}
              className="absolute left-1/2 -translate-x-1/2 top-1 text-xs opacity-20 hover:opacity-80 bg-black/20 px-2 py-1 rounded"
              title={showHistory ? t('hideHistory') : t('showHistory')}
            >
              {showHistory ? t('hideHistory') : t('showHistory')}
            </button>
            {displayedEvents.map(ev => (
  <p key={ev.id}>
    <span className="mr-1">{ev.kind === 'chat' ? '[chat]' : '[dice]'}</span>
    {ev.kind === 'chat' && (
      <><strong>{ev.author}{ev.isMJ && ' (MJ)'} :</strong> {ev.text}</>
    )}
    {ev.kind === 'dice' && (
      <span>{ev.player} : D{ev.dice} → {ev.result}</span>
    )}
  </p>
))}
            <div ref={endRef} />
          </div>

          <div className="mt-2 flex items-center w-full max-w-full overflow-hidden">
            <input
              type="text"
              placeholder={t('yourMessage')}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              className="flex-1 border-none px-3 py-2 rounded-l-xl text-white bg-black/30 backdrop-blur-[2px] focus:outline-none transition shadow placeholder:text-white/50 text-base min-w-0"
              style={{ minHeight: 44 }}
            />
            <button
              onClick={sendMessage}
              className="rounded-r-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[44px] max-w-[120px] truncate"
              style={{ minHeight: 44 }}
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ChatBox



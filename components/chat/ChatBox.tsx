'use client'

import { FC, RefObject, useRef, useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BarChart3, MessageSquare } from 'lucide-react'
import { useBroadcastEvent, useRoom, useEventListener, useSelf } from '@liveblocks/react'
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
  const self = useSelf()
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

    const msg = { author, text: inputValue.trim(), isMJ: self?.info?.role === 'gm' }
    const ts = Date.now()

    broadcast({ type: 'chat', author: msg.author, text: msg.text, isMJ: msg.isMJ, ts })
    addEvent({ id: crypto.randomUUID(), kind: 'chat', author: msg.author, text: msg.text, ts, isMJ: msg.isMJ })
    debug('chat', msg)

    setInputValue('')
  }

  // Receive remote chat events and persist them to storage.
  // On ignore nos propres broadcasts (on a déjà appelé addEvent localement dans sendMessage)
  // pour éviter la double-insertion dans la LiveList.
  useEventListener((payload: { connectionId: number; user?: { info?: { role?: string } } | null; event: { type: string; author?: string; text?: string; ts?: number; isMJ?: boolean } }) => {
    const { event, connectionId } = payload
    if (event && event.type === 'chat') {
      // Sauter les événements provenant de notre propre connexion
      if (connectionId === self?.connectionId) return
      const ts = typeof event.ts === 'number' ? event.ts : Date.now()
      // La couronne vient du role de l'expediteur, fixe par le serveur, et non
      // de ce qu'annonce le message : sinon n'importe qui pourrait se couronner.
      addEvent({ id: crypto.randomUUID(), kind: 'chat', author: event.author || 'Unknown', text: event.text || '', ts, isMJ: payload.user?.info?.role === 'gm' })
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
      <div className="flex justify-center items-center mb-3 gap-2">
        <button
          className="flex-1 px-3 py-2 rounded-xl font-semibold text-sm shadow
            bg-gradient-to-b from-amber-500/20 to-amber-600/10
            border border-amber-400/20
            text-amber-200/90 hover:text-amber-100
            hover:from-amber-500/30 hover:to-amber-600/20
            hover:border-amber-400/40
            active:scale-95 transition-all duration-150
            flex items-center justify-center gap-1.5 min-h-[38px]"
          onClick={() => setShowSummary(true)}
        >
          <span className="text-base leading-none">📖</span>
          <span className="truncate">{t('sessionSummary')}</span>
        </button>
        <button
          className={`px-3 py-2 rounded-xl font-semibold text-sm shadow
            border active:scale-95 transition-all duration-150
            flex items-center justify-center gap-1.5 min-h-[38px]
            ${showStats
              ? 'bg-blue-600/30 border-blue-400/30 text-blue-200 hover:bg-blue-600/40'
              : 'bg-black/30 border-white/10 text-white/70 hover:bg-blue-900/30 hover:text-blue-200 hover:border-blue-400/20'
            }`}
          onClick={() => setShowStats(s => !s)}
          title={t('diceStats')}
        >
          {showStats ? (
            <><MessageSquare size={14} /> <span>{t('chat')}</span></>
          ) : (
            <><BarChart3 size={14} /> <span>{t('diceStats')}</span></>
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
          <h2 className="text-sm font-semibold mb-1.5 text-center text-white/50 tracking-widest uppercase">{t('chat')}</h2>
          <div
            ref={chatBoxRef}
            className="relative flex-1 overflow-y-auto rounded-xl border border-white/8 bg-black/20 backdrop-blur-[2px] shadow-inner p-2 min-h-0"
          >
            <button
              onClick={() => setShowHistory(h => !h)}
              className="absolute left-1/2 -translate-x-1/2 top-1 text-xs opacity-20 hover:opacity-60 bg-black/30 px-2 py-0.5 rounded-full transition-opacity"
              title={showHistory ? t('hideHistory') : t('showHistory')}
            >
              {showHistory ? t('hideHistory') : t('showHistory')}
            </button>
            <div className="pt-5 flex flex-col gap-1.5">
            {displayedEvents.map(ev => {
              const isChat = ev.kind === 'chat'
              if (isChat) {
                const isMJ = ev.isMJ
                return (
                  <div key={ev.id} className="animate-fadeIn flex flex-col gap-0.5">
                    <span className={`text-[10px] font-semibold px-1 ${isMJ ? 'text-amber-400/80' : 'text-white/40'}`}>
                      {isMJ && '👑 '}{ev.author}
                    </span>
                    <div className={`
                      px-2.5 py-1.5 rounded-xl rounded-tl-sm text-sm leading-snug max-w-[92%]
                      ${isMJ
                        ? 'bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-400/20 text-amber-100'
                        : 'bg-white/8 border border-white/8 text-white/90'}
                    `}>
                      {ev.text}
                    </div>
                  </div>
                )
              } else {
                // dice roll
                const isCrit = ev.result !== undefined && ev.dice !== undefined && ev.result === ev.dice
                const isFumble = ev.result === 1
                const resultColor = isCrit
                  ? 'text-yellow-300'
                  : isFumble
                  ? 'text-red-400'
                  : 'text-blue-300'
                const bgColor = isCrit
                  ? 'from-yellow-500/15 to-amber-600/8 border-yellow-400/20'
                  : isFumble
                  ? 'from-red-500/15 to-red-600/8 border-red-400/20'
                  : 'from-blue-500/10 to-indigo-600/5 border-blue-400/15'
                return (
                  <div key={ev.id} className={`animate-fadeIn flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${bgColor} border text-sm`}>
                    <span className="text-base leading-none">🎲</span>
                    <span className="text-white/60 text-xs">{ev.player}</span>
                    {ev.dice != null && <span className="text-white/40 text-xs">D{ev.dice}</span>}
                    <span className="ml-auto font-bold text-base leading-none tabular-nums">
                      <span className={resultColor}>{ev.result ?? '?'}</span>
                    </span>
                    {isCrit && <span className="text-xs">✨</span>}
                    {isFumble && <span className="text-xs">💀</span>}
                  </div>
                )
              }
            })}
            </div>
            <div ref={endRef} />
          </div>

          <div className="mt-2 flex items-center w-full max-w-full overflow-hidden rounded-xl border border-white/10 bg-black/25 backdrop-blur-[2px] focus-within:border-white/20 focus-within:bg-black/35 transition-all">
            <input
              type="text"
              placeholder={t('yourMessage')}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              className="flex-1 border-none px-3 py-2.5 text-white bg-transparent focus:outline-none text-sm placeholder:text-white/30 min-w-0"
            />
            <button
              onClick={sendMessage}
              className="mr-1 px-3 py-1.5 rounded-lg text-sm font-semibold
                bg-emerald-600/20 border border-emerald-500/20 text-emerald-300
                hover:bg-emerald-500/30 hover:border-emerald-400/40 hover:text-emerald-100
                active:scale-95 transition-all duration-150 flex-shrink-0"
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




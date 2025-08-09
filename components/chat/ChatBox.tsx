'use client'
import { FC, RefObject, useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useBroadcastEvent, useRoom } from '@liveblocks/react'
import useProfile from '../app/hooks/useProfile'
import SessionSummary from './SessionSummary'
import DiceStats from './DiceStats'
import useEventLog from '../app/hooks/useEventLog'
import { useT } from '@/lib/useT'

type Roll = { player: string, dice: number, result: number }

interface Props {
  chatBoxRef: RefObject<HTMLDivElement | null>
  history: Roll[]
  author: string
}

const ChatBox: FC<Props> = ({ chatBoxRef, history, author }) => {
  const room = useRoom()
  const { events, addEvent } = useEventLog(room.id)
  // sort by timestamp and break ties with the unique id to keep order stable
  const sortedEvents = [...events].sort((a, b) => a.ts - b.ts || a.id.localeCompare(b.id))
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


  const sendMessage = () => {
    if (inputValue.trim() === '') return

    const id = crypto.randomUUID()
    const ts = Date.now()
    const msg = { author, text: inputValue.trim(), isMJ: profile?.isMJ }

    // include id+ts in the broadcast so receivers use the same ordering info
    broadcast({ type: 'chat', id, ts, author: msg.author, text: msg.text, isMJ: msg.isMJ } as Liveblocks['RoomEvent'])
    addEvent({ id, kind: 'chat', author: msg.author, text: msg.text, ts, isMJ: msg.isMJ })
    setInputValue('')
  }


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

  // --- NOUVEL AFFICHAGE VERTICAL ---
  if (showSummary) {
    return (
      <aside
        className="
          w-full lg:w-1/5
          p-4
          flex flex-col relative
          rounded-xl
          border border-white/10
          bg-black/15
          backdrop-blur-[2px]
          shadow-lg shadow-black/10
          transition flex-shrink-0
        "
        style={{
          boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)'
        }}
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
      className="
        w-full lg:w-1/5
        p-4
        flex flex-col relative h-full min-h-0
        rounded-xl
        border border-white/10
        bg-black/15
        backdrop-blur-[2px]
        shadow-lg shadow-black/10
        transition flex-shrink-0
      "
      style={{
        boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      <button
        onClick={() => setCollapsed(true)}
        aria-label="Collapse chat panel"
        className="absolute top-2 left-2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
      >
        <ChevronRight size={20} />
      </button>
      {/* Boutons en-tête */}
      <div className="flex justify-center items-center mb-2 gap-2">
        <button
          className="
            px-5 py-2 rounded-xl font-semibold shadow border-none
            bg-black/30 text-white/90
            hover:bg-yellow-400 hover:text-black
            transition
            duration-100
            flex items-center justify-center
            min-h-[44px]
          "
          style={{ minHeight: 44 }}
        onClick={() => setShowSummary(true)}
      >
          {t('sessionSummary')}
        </button>
        <button
          className="
            px-5 py-2 rounded-xl font-semibold shadow border-none
            bg-black/30 text-white/90
            hover:bg-blue-600 hover:text-white
            transition
            duration-100
            flex items-center justify-center
            min-h-[44px]
          "
          style={{ minHeight: 44 }}
          onClick={() => setShowStats(s => !s)}
          title={t('diceStats')}
        >
          {showStats ? t('chat') : '📊'}
        </button>
      </div>

      {/* --- Affichage vertical : stats en haut, chat en bas --- */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        {showStats && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="text-center font-bold mb-2">{t('diceStatsTitle')}</div>
            <div className="
              flex-1 overflow-y-auto
              rounded-xl
              border border-white/10
              bg-black/15
              backdrop-blur-[2px]
              shadow
              p-2
              min-h-0
            ">
              <DiceStats history={history} />
            </div>
          </div>
        )}
        <div className={`flex-1 min-h-0 flex flex-col ${showStats ? '' : 'h-full'}`}>
          <h2 className="text-xl font-bold mb-2 text-center">{t('chat')}</h2>
          <div
            ref={chatBoxRef}
            className="
              relative
              flex-1 overflow-y-auto
              rounded-xl
              border border-white/10
              bg-black/15
              backdrop-blur-[2px]
              shadow
              p-2
              min-h-0
            "
          >
            <button
              onClick={() => setShowHistory(h => !h)}
              className="absolute left-1/2 -translate-x-1/2 top-1 text-xs opacity-20 hover:opacity-80 bg-black/20 px-2 py-1 rounded"
              title={showHistory ? t('hideHistory') : t('showHistory')}
            >
              🕘
            </button>
            {displayedEvents.map(ev => (
              <p key={ev.id}>
                <span className="mr-1">{ev.kind === 'chat' ? '💬' : '🎲'}</span>
                {ev.kind === 'chat' && (
                  <><strong>{ev.author}{ev.isMJ && ' 👑'} :</strong> {ev.text}</>
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
              onKeyDown={e => {
              if (e.key === 'Enter') sendMessage()
              }}
              className="
              flex-1
              border-none
              px-3 py-2
              rounded-l-xl
              text-white
              bg-black/30
              backdrop-blur-[2px]
              focus:outline-none
              transition
              shadow
              placeholder:text-white/50
              text-base
              min-w-0
              "
              style={{ minHeight: 44 }}
            />
            <button
              onClick={sendMessage}
              className="
              rounded-r-xl
              px-5 py-2
              text-base
              font-semibold
              shadow
              border-none
              bg-black/30
              text-white/90
              hover:bg-emerald-600 hover:text-white
              transition
              duration-100
              flex items-center justify-center
              min-h-[44px]
              max-w-[120px]
              truncate
              "
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

'use client'
import { FC, RefObject, useRef, useState, useEffect } from 'react'
import { useBroadcastEvent, useEventListener, useRoom } from '@liveblocks/react'
import CollaborativeEditor from './CollaborativeEditor'
import DiceStats from './DiceStats'
import useEventLog from '../app/hooks/useEventLog'

type Roll = { player: string, dice: number, result: number }

interface Props {
  chatBoxRef: RefObject<HTMLDivElement | null>
  history: Roll[]
  author: string
}

const ChatBox: FC<Props> = ({ chatBoxRef, history, author }) => {
  const room = useRoom()
  const { addEvent } = useEventLog(room.id)
  const STORAGE_KEY = `jdr_chat_${room.id}`
  const [messages, setMessages] = useState<{author:string; text:string}[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return [{ author: 'GM', text: 'Welcome!' }]
  })
  const [inputValue, setInputValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const prevHist = useRef(0)
  const broadcast = useBroadcastEvent()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'chat') {
      setMessages((m: Array<{author:string; text:string}>) => [...m, { author: event.author, text: event.text }])
      addEvent({ id: crypto.randomUUID(), kind: 'chat', author: event.author, text: event.text, ts: Date.now() })
    }
  })

  const sendMessage = () => {
    if (inputValue.trim() === '') return

    const msg = { author, text: inputValue.trim() }

    setMessages(prev => [...prev, msg])
    broadcast({ type: 'chat', author: msg.author, text: msg.text } as Liveblocks['RoomEvent'])
    addEvent({ id: crypto.randomUUID(), kind: 'chat', author: msg.author, text: msg.text, ts: Date.now() })
    setInputValue('')
  }


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {}
  }, [messages, STORAGE_KEY])

  useEffect(() => {
    if (history.length > prevHist.current) {
      const toAdd = history.slice(prevHist.current)
      setMessages(m => [
        ...m,
        ...toAdd.map(r => ({ author: '🎲', text: `${r.player} : D${r.dice} → ${r.result}` }))
      ])
      prevHist.current = history.length
    }
  }, [history])

  // --- NOUVEL AFFICHAGE VERTICAL ---
  if (showSummary) {
    return (
      <aside
        className="
          w-1/5
          p-4
          flex flex-col relative
          rounded-xl
          border border-white/10
          bg-black/15
          backdrop-blur-[2px]
          shadow-lg shadow-black/10
          transition
        "
        style={{
          boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        <CollaborativeEditor onClose={() => setShowSummary(false)} />
      </aside>
    )
  }

  return (
    <aside
      className="
        w-1/5
        p-4
        flex flex-col relative h-full min-h-0
        rounded-xl
        border border-white/10
        bg-black/15
        backdrop-blur-[2px]
        shadow-lg shadow-black/10
        transition
      "
      style={{
        boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
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
          Session summary
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
          title="Stats DD"
        >
          {showStats ? 'Chat' : '📊'}
        </button>
      </div>

      {/* --- Affichage vertical : stats en haut, chat en bas --- */}
      <div className="flex flex-col flex-1 min-h-0 gap-2">
        {showStats && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="text-center font-bold mb-2">Dice statistics</div>
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
          <h2 className="text-xl font-bold mb-2 text-center">Chat</h2>
          <div
            ref={chatBoxRef}
            className="
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
            {messages.map((msg, idx) => (
              <p key={idx}>
                <strong>{msg.author} :</strong> {msg.text}
              </p>
            ))}
            <div ref={endRef} />
          </div>
            <div className="mt-2 flex items-center w-full max-w-full overflow-hidden">
            <input
              type="text"
              placeholder="Your message..."
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
              Send
            </button>
            </div>
        </div>
      </div>
    </aside>
  )
}

export default ChatBox

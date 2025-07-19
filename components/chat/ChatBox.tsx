import { FC, RefObject, useRef, useState, useEffect } from 'react'
import SummaryPanel from './SummaryPanel'
import DiceStats from './DiceStats'

type Roll = { player: string, dice: number, result: number }

type Props = {
  chatBoxRef: RefObject<HTMLDivElement | null>
  history: Roll[]
}

const ChatBox: FC<Props> = ({ chatBoxRef, history }) => {
  const [messages, setMessages] = useState([
    { author: 'MJ', text: 'Bienvenue !' }
  ])
  const [inputValue, setInputValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const prevHist = useRef(0)

  const sendMessage = () => {
    if (inputValue.trim() === '') return
    setMessages(prev => [...prev, { author: 'Vous', text: inputValue.trim() }])
    setInputValue('')
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      <aside className="w-1/5 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col relative">
        <SummaryPanel onClose={() => setShowSummary(false)} />
      </aside>
    )
  }

  return (
    <aside className="w-1/5 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col relative h-full min-h-0">
      {/* Boutons en-tête */}
      <div className="flex justify-center items-center mb-2 gap-2">
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-1 rounded shadow font-bold text-sm"
          onClick={() => setShowSummary(true)}
        >
          Résumé de la partie
        </button>
        <button
          className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
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
            <div className="text-center font-bold mb-2">Statistiques DD</div>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-700 p-2 rounded shadow">
              <DiceStats history={history} />
            </div>
          </div>
        )}
        <div className={`flex-1 min-h-0 flex flex-col ${showStats ? '' : 'h-full'}`}>
          <h2 className="text-xl font-bold mb-2 text-center">Chat</h2>
          <div
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-gray-700 p-2 rounded shadow"
            style={{ minHeight: 0 }}
          >
            {messages.map((msg, idx) => (
              <p key={idx}>
                <strong>{msg.author} :</strong> {msg.text}
              </p>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mt-2 flex items-center">
            <input
              type="text"
              placeholder="Votre message..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') sendMessage()
              }}
              className="flex-1 border p-2 rounded-l text-white bg-gray-700 dark:bg-gray-600"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ChatBox

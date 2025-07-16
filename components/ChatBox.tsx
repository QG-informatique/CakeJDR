'use client'
import { FC, RefObject, useRef, useState, useEffect } from 'react'

type Props = {
  chatBoxRef: RefObject<HTMLDivElement | null>
}

const ChatBox: FC<Props> = ({ chatBoxRef }) => {
  const [messages, setMessages] = useState([
    { author: 'MJ', text: 'Bienvenue !' }
  ])
  const [inputValue, setInputValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const sendMessage = () => {
    if (inputValue.trim() === '') return
    setMessages(prev => [...prev, { author: 'Vous', text: inputValue.trim() }])
    setInputValue('')
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <aside className="w-1/5 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Chat</h2>

      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto bg-white dark:bg-gray-700 p-2 rounded shadow"
      >
        {messages.map((msg, idx) => (
          <p key={idx}>
            <strong>{msg.author} :</strong> {msg.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-4 flex">
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
    </aside>
  )
}

export default ChatBox

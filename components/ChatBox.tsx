'use client'
import { FC, RefObject } from 'react'

type Props = {
  chatBoxRef: RefObject<HTMLDivElement>
}

const ChatBox: FC<Props> = ({ chatBoxRef }) => (
  <aside className="w-1/5 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col">
    <h2 className="text-xl font-bold mb-4">Chat</h2>
    <div
      ref={chatBoxRef}
      className="flex-1 overflow-y-auto bg-white dark:bg-gray-700 p-2 rounded shadow"
    >
      <p><strong>MJ :</strong> Bienvenue !</p>
    </div>
    <div className="mt-4 flex">
      <input
        type="text"
        placeholder="Votre message..."
        className="flex-1 border p-2 rounded-l text-white bg-gray-700 dark:bg-gray-600"
      />
      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-r">
        Envoyer
      </button>
    </div>
  </aside>
)

export default ChatBox

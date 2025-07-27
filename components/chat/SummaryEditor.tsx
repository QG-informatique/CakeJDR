'use client'
import { FC } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { liveblocksConfig, LiveblocksPlugin } from '@liveblocks/react-lexical'
import { useRoom } from '@liveblocks/react'

interface Props { onClose: () => void }

const SummaryEditor: FC<Props> = ({ onClose }) => {
  const room = useRoom()
  const initialConfig = liveblocksConfig({
    namespace: `summary_${room.id}`,
    onError: err => console.error(err),
    theme: {},
    nodes: []
  })
  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <div className="flex items-center mb-3 gap-2">
        <h2 className="font-bold flex-1">Session summary</h2>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-black/15 p-2">
        <LexicalComposer initialConfig={initialConfig}>
          <LiveblocksPlugin />
          <RichTextPlugin
            contentEditable={<ContentEditable className="outline-none min-h-full" />}
            placeholder={<div className="text-gray-400">Write the session summary...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
        </LexicalComposer>
      </div>
    </div>
  )
}

export default SummaryEditor

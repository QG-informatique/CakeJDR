'use client'
import { liveblocksConfig, LiveblocksPlugin } from '@liveblocks/react-lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import useIsMobile from './use-is-mobile'

export default function SummaryEditor() {
  useIsMobile() // initialize hook for responsive threads if needed

  const initialConfig = liveblocksConfig({
    namespace: 'SummaryEditor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (error: unknown) => {
      console.error(error)
    }
  })

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <LexicalComposer initialConfig={initialConfig}>
        <LiveblocksPlugin />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 relative">
            <RichTextPlugin
              contentEditable={<ContentEditable className="outline-none p-2 text-sm flex-1" />}
              placeholder={<p className="absolute top-2 left-2 text-gray-400 pointer-events-none">Write summary...</p>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}

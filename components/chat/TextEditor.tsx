'use client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { liveblocksConfig } from '@liveblocks/react-lexical'
import type { EditorState } from 'lexical'

const baseConfig = liveblocksConfig({
  namespace: 'summary',
  nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
  onError(error: unknown) {
    console.error(error)
  }
})

export default function TextEditor({
  docId,
  initialState,
  onChange
}: {
  docId: string
  initialState?: string
  onChange: (state: EditorState) => void
}) {
  return (
    <LexicalComposer
      initialConfig={{
        ...baseConfig,
        namespace: docId,
        editorState: initialState
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable className="outline-none p-2 flex-1" />}
        placeholder={<div className="p-2 text-gray-400">Start writing...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <OnChangePlugin onChange={onChange} />
    </LexicalComposer>
  )
}

"use client"

import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { ListNode, ListItemNode } from "@lexical/list"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import { $getRoot } from "lexical"
import { liveblocksConfig, LiveblocksPlugin, Toolbar } from "@liveblocks/react-lexical"
import { useRoom } from "@liveblocks/react"
import { useCallback, useEffect, useRef } from "react"

const LOCAL_PREFIX = "summaryEditor_"

function LoadContent({ storageKey }: { storageKey: string }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    if (saved) {
      editor.update(() => {
        const parser = new DOMParser()
        const dom = parser.parseFromString(saved, "text/html")
        const nodes = $generateNodesFromDOM(editor, dom)
        const root = $getRoot()
        root.clear()
        root.append(...nodes)
      })
    }
  }, [editor, storageKey])
  return null
}

function SaveOnChange({ storageKey }: { storageKey: string }) {
  return (
    <OnChangePlugin
      onChange={(state, editor) => {
        const html = state.read(() => $generateHtmlFromNodes(editor, null))
        try {
          localStorage.setItem(storageKey, html)
        } catch {}
      }}
    />
  )
}

export default function CollaborativeEditor({ onClose }: { onClose: () => void }) {
  const room = useRoom()
  const storageKey = room ? LOCAL_PREFIX + room.id : LOCAL_PREFIX
  const editorRef = useRef<null | { save: () => void }>(null)

  const handleSave = useCallback(() => {
    if (editorRef.current) editorRef.current.save()
  }, [])

  const initialConfig = liveblocksConfig({
    namespace: "summary-editor",
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError(error) {
      console.error(error)
    },
  })

  function RegisterSave() {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
      editorRef.current = {
        save: () => {
          editor.update(() => {
            const html = $generateHtmlFromNodes(editor, null)
            try {
              localStorage.setItem(storageKey, html)
            } catch {}
          })
        },
      }
    }, [editor])
    return null
  }

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <div className="flex items-center mb-2 gap-2">
        <button onClick={onClose} className="px-3 py-1 rounded bg-blue-600 text-white">
          Retour au chat
        </button>
        <button onClick={handleSave} className="ml-auto px-3 py-1 rounded bg-emerald-600 text-white">
          Sauvegarder
        </button>
      </div>
      <LexicalComposer initialConfig={initialConfig}>
        <LiveblocksPlugin />
        <LoadContent storageKey={storageKey} />
        <RegisterSave />
        <SaveOnChange storageKey={storageKey} />
        <Toolbar className="mb-2" />
        <RichTextPlugin
          contentEditable={<ContentEditable className="outline-none flex-1 p-2 rounded bg-black/20 text-white" />}
          placeholder={<div className="text-gray-400 p-2">Commencez à écrire…</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  )
}


'use client'
import { FC, useEffect, useState } from 'react'
import { useStorage, useMutation } from '@liveblocks/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LiveblocksPlugin, Toolbar, liveblocksConfig } from '@liveblocks/react-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot } from 'lexical'

interface Page {
  id: string
  title: string
  content: string
}

interface Props { onClose: () => void }

function AutoSavePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent()
        onChange(text)
      })
    })
  }, [editor, onChange])
  return null
}

const SessionSummary: FC<Props> = ({ onClose }) => {
  const summary = useStorage(root => root.summary)
  const pages = summary?.acts as Page[] | undefined
  const [currentId, setCurrentId] = useState<string>('')
  const [editorKey, setEditorKey] = useState(0)

  const updatePages = useMutation(({ storage }, acts: Page[]) => {
    storage.get('summary').update({ acts })
  }, [])

  useEffect(() => {
    if (!pages) return
    if (pages.length === 0) {
      const first = { id: crypto.randomUUID(), title: 'Nouvelle page', content: '' }
      updatePages([first])
      setCurrentId(first.id)
    } else if (!currentId) {
      setCurrentId(pages[0].id)
    }
  }, [pages, currentId, updatePages])

  const current = pages?.find(p => p.id === currentId)

  const handleNewPage = () => {
    const newPage = { id: crypto.randomUUID(), title: 'Nouvelle page', content: '' }
    updatePages([...(pages || []), newPage])
    setCurrentId(newPage.id)
    setEditorKey(k => k + 1)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then(text => {
      const parts = text.split(/=== Page: /).slice(1)
      const newPages: Page[] = parts.map(part => {
        const [titleLine, ...contentLines] = part.split('\n')
        const title = titleLine.replace(/===$/, '').trim()
        const content = contentLines.join('\n').trim()
        return { id: crypto.randomUUID(), title, content }
      })
      if (newPages.length > 0) {
        updatePages(newPages)
        setCurrentId(newPages[0].id)
        setEditorKey(k => k + 1)
      }
    })
  }

  const handleExport = () => {
    if (!pages) return
    const txt = pages.map(p => `=== Page: ${p.title} ===\n${p.content}\n`).join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const editorConfig = liveblocksConfig({
    namespace: 'session-summary',
    onError: console.error
  })

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={handleNewPage} className="bg-black/40 text-white px-2 py-1 rounded text-sm">Nouvelle page</button>
        <select value={currentId} onChange={e => { setCurrentId(e.target.value); setEditorKey(k => k + 1) }} className="bg-black/40 text-white rounded px-2 py-1 text-sm">
          {pages?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={handleExport} className="bg-black/40 text-white px-2 py-1 rounded text-sm">Exporter</button>
        <label className="bg-black/40 text-white px-2 py-1 rounded text-sm cursor-pointer">
          Importer
          <input type="file" accept="text/plain" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      {current && (
        <LexicalComposer key={editorKey} initialConfig={editorConfig}>
          <Toolbar />
          <RichTextPlugin contentEditable={<ContentEditable className="flex-1 min-h-0 p-2 bg-black/20 rounded text-white outline-none" />} placeholder={<div>Start writing...</div>} />
          <HistoryPlugin />
          <LiveblocksPlugin />
          <AutoSavePlugin onChange={txt => {
            const newPages = (pages || []).map(p => p.id === current.id ? { ...p, content: txt } : p)
            updatePages(newPages)
          }} />
        </LexicalComposer>
      )}
    </div>
  )
}

export default SessionSummary

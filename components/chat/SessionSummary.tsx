'use client'
import { FC, useEffect, useState, useRef } from 'react'
import { useStorage, useMutation } from '@liveblocks/react'
import { LiveList } from '@liveblocks/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
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
  const pages = useStorage(root => root.pages) as Page[] | undefined
  const currentStorageId = useStorage(root => root.currentPageId)
  const [currentId, setCurrentId] = useState<string>('')
  const setStorageCurrent = useMutation(({ storage }, id: string) => {
    storage.set('currentPageId', id)
  }, [])
  const [editorKey, setEditorKey] = useState(0)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileBtnRef = useRef<HTMLButtonElement>(null)

  const updatePages = useMutation(({ storage }, acts: Page[]) => {
    storage.set('pages', new LiveList(acts as any))
  }, [])

  const updateEditor = useMutation(({ storage }, content: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    storage.set('editor', content as any)
  }, [])

  useEffect(() => {
    if (!showFileMenu) return
    const handle = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !fileBtnRef.current?.contains(e.target as Node)) {
        setShowFileMenu(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showFileMenu])

  useEffect(() => {
    if (!pages) return
    if (pages.length === 0) {
      const first = { id: crypto.randomUUID(), title: 'Nouvelle page', content: '' }
      updatePages([first])
      setCurrentId(first.id)
      setStorageCurrent(first.id)
    } else if (!currentId) {
      const id = currentStorageId || pages[0].id
      setCurrentId(id)
    }
  }, [pages, currentId, updatePages, currentStorageId, setStorageCurrent])

  const current = pages?.find(p => p.id === currentId)

  useEffect(() => {
    if (current) {
      updateEditor(current.content)
    }
  }, [current, updateEditor])

  const handleNewPage = () => {
    const newPage = { id: crypto.randomUUID(), title: 'Nouvelle page', content: '' }
    updatePages([...(pages || []), newPage])
    setCurrentId(newPage.id)
    setStorageCurrent(newPage.id)
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
        setStorageCurrent(newPages[0].id)
        setEditorKey(k => k + 1)
      }
      setShowFileMenu(false)
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
    setShowFileMenu(false)
  }

  const handleDelete = () => {
    if (!pages || !current) return
    if (pages.length <= 1) return
    if (confirm('Voulez-vous vraiment supprimer cette page ?')) {
      const rest = pages.filter(p => p.id !== current.id)
      updatePages(rest)
      setCurrentId(rest[0].id)
      setStorageCurrent(rest[0].id)
      setEditorKey(k => k + 1)
    }
  }

  const editorConfig = liveblocksConfig({
    namespace: 'session-summary',
    onError: console.error
  })

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn overflow-visible" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-2 mb-3 relative">
        <button onClick={handleNewPage} className="bg-black/40 text-white px-2 py-1 rounded text-sm">+</button>
        <select value={currentId} onChange={e => { const id=e.target.value; setCurrentId(id); setStorageCurrent(id); setEditorKey(k => k + 1) }} className="bg-black/40 text-white rounded px-2 py-1 text-sm w-32">
          {pages?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={handleDelete} className="bg-black/40 text-white px-2 py-1 rounded text-sm">🗑️</button>
        <div className="relative">
          <button ref={fileBtnRef} onClick={() => setShowFileMenu(m => !m)} className="bg-black/40 text-white px-2 py-1 rounded text-sm">📁</button>
          {showFileMenu && (
            <div ref={menuRef} className="absolute right-0 mt-1 z-40 bg-black/80 rounded shadow p-1 w-32 flex flex-col">
              <label className="px-2 py-1 hover:bg-white/10 cursor-pointer text-sm">
                Importer
                <input type="file" accept="text/plain" onChange={handleImport} className="hidden" />
              </label>
              <button onClick={handleExport} className="text-left px-2 py-1 hover:bg-white/10 text-sm">Exporter</button>
            </div>
          )}
        </div>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      {current && (
        <LexicalComposer key={editorKey} initialConfig={editorConfig}>
            <Toolbar className="mb-2">
              <Toolbar.BlockSelector />
              <Toolbar.SectionInline />
            </Toolbar>
            <h2 className="text-center font-semibold mb-2">{current.title}</h2>
            <RichTextPlugin
              contentEditable={<ContentEditable className="flex-1 min-h-0 p-2 bg-black/20 rounded text-white outline-none" />}
              placeholder={<div>Start writing...</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <LiveblocksPlugin />
            <AutoSavePlugin onChange={txt => {
              const newPages = (pages || []).map(p => p.id === current.id ? { ...p, content: txt } : p)
              updatePages(newPages)
              updateEditor(txt)
            }} />
          </LexicalComposer>
      )}
    </div>
  )
}

export default SessionSummary

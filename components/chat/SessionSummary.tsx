'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRoom, useSelf, useStorage, useMutation } from '@liveblocks/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { Toolbar, liveblocksConfig } from '@liveblocks/react-lexical'
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin'
import { LiveblocksYjsProvider } from '@liveblocks/yjs'
import { Doc } from 'yjs'

import type { Provider } from '@lexical/yjs'

interface Page { id: number; title: string; content: string }
interface Props { onClose: () => void }

const initialConfig = liveblocksConfig({
  namespace: 'session-summary',
  onError: (err: unknown) => console.error(err)
})

export default function SessionSummary({ onClose }: Props) {
  const room = useRoom()
  const self = useSelf()
  const summary = useStorage(root => root.summary)
  const pages: Page[] = summary?.get('acts') || []
  const [currentId, setCurrentId] = useState<number | null>(pages[0]?.id ?? null)

  useEffect(() => {
    if (!currentId && pages[0]) setCurrentId(pages[0].id)
  }, [pages, currentId])

  const addPage = useMutation(({ storage }) => {
    const s = storage.get('summary')
    const acts = (s.get('acts') as Page[]) || []
    const newPage: Page = { id: Date.now(), title: 'Nouvelle page', content: '' }
    s.update({ acts: [...acts, newPage] })
  }, [])


  const provider = useMemo(() => {
    if (!room || !currentId) return null
    const doc = new Doc({ guid: String(currentId) })
    return new LiveblocksYjsProvider(room, doc)
  }, [room, currentId])

  useEffect(() => () => provider?.destroy(), [provider])

  const providerFactory = useCallback((id: string, map: Map<string, Doc>): Provider => {
    if (!provider) throw new Error('provider not ready')
    map.set(id, provider.getYDoc())
    return provider as Provider
  }, [provider])

  const exportAll = async () => {
    if (!room) return
    const textParts: string[] = []
    for (const p of pages) {
      const doc = new Doc({ guid: String(p.id) })
      const prov = new LiveblocksYjsProvider(room, doc)
      await new Promise(res => prov.on('synced', res))
      const root = doc.getText('root')
      textParts.push(`=== Page: ${p.title} ===\n` + root.toString())
      prov.destroy()
    }
    const blob = new Blob([textParts.join('\n\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'summary.txt'
    a.click()
  }

  const importFile = async (file: File) => {
    const text = await file.text()
    const regex = /^=== Page: (.*) ===$/gm
    const newPages: Page[] = []
    let match
    let lastIndex = 0
    while ((match = regex.exec(text))) {
      if (newPages.length > 0) {
        newPages[newPages.length - 1].content = text.slice(lastIndex, match.index).trim()
      }
      newPages.push({ id: Date.now() + newPages.length, title: match[1], content: '' })
      lastIndex = regex.lastIndex
    }
    if (newPages.length > 0) {
      newPages[newPages.length - 1].content = text.slice(lastIndex).trim()
    }
    const s = summary
    if (!s) return
    const acts = newPages.map(p => ({ id: p.id, title: p.title, content: '' }))
    s.update({ acts })
    for (const p of newPages) {
      const doc = new Doc({ guid: String(p.id) })
      const prov = new LiveblocksYjsProvider(room!, doc)
      await new Promise(res => prov.on('synced', res))
      doc.getText('root').insert(0, p.content || '')
      prov.destroy()
    }
    setCurrentId(newPages[0]?.id || null)
  }

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3" style={{ minHeight: 0 }}>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={addPage} className="bg-black/40 text-white rounded px-2 py-1 text-sm">Nouvelle page</button>
        <select value={currentId || ''} onChange={e => setCurrentId(e.target.value)} className="bg-black/40 text-white rounded px-2 py-1 text-sm">
          {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button onClick={exportAll} className="bg-black/40 text-white rounded px-2 py-1 text-sm">Exporter</button>
        <label className="bg-black/40 text-white rounded px-2 py-1 text-sm cursor-pointer">
          Importer<input type="file" accept="text/plain" onChange={e => e.target.files && importFile(e.target.files[0])} className="hidden" />
        </label>
        <button onClick={onClose} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      {currentId && provider && (
        <LexicalComposer initialConfig={initialConfig} key={currentId}>
          <Toolbar className="mb-2" />
          <CollaborationPlugin id={currentId} providerFactory={providerFactory} username={self?.info?.name || ''} cursorColor={self?.info?.color} cursorsContainerRef={undefined} shouldBootstrap />
          <RichTextPlugin contentEditable={<ContentEditable className="flex-1 min-h-0 overflow-auto rounded border border-white/10 p-2 bg-black/30 text-white" />} placeholder={<div className="text-gray-400">Écrivez…</div>} ErrorBoundary={null as unknown as JSX.Element} />
          <HistoryPlugin />
        </LexicalComposer>
      )}
    </div>
  )
}

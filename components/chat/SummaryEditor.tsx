'use client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LiveblocksPlugin, liveblocksConfig, Toolbar, FloatingToolbar } from '@liveblocks/react-lexical'
import { useRoom, useStorage, useMutation, RoomProvider } from '@liveblocks/react'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import { useEffect, useState } from 'react'
import useIsMobile from './use-is-mobile'

const LOCAL_KEY = 'summaryPanel_acts_v1'

type Act = { id: string; title: string }

export default function SummaryEditor() {
  useIsMobile()
  const room = useRoom()
  const summary = useStorage(root => root.summary)
  const updateSummary = useMutation(({ storage }, acts: Act[]) => {
    const withContent = acts.map(a => ({ id: Number(a.id), title: a.title, content: '' }))
    storage.get('summary').set('acts', withContent)
  }, [])

  const [acts, setActs] = useState<Act[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return [{ id: '1', title: 'Act 1' }]
  })
  const [current, setCurrent] = useState(acts[0].id)

  useEffect(() => {
    updateSummary(acts)
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(acts)) } catch {}
  }, [acts, updateSummary])

  useEffect(() => {
    if (summary && Array.isArray(summary.acts)) {
      const rawActs = summary.acts as Array<{ id: number; title: string }>
      const arr = rawActs.map(a => ({ id: String(a.id), title: a.title }))
      setActs(arr)
      if (!arr.some(a => a.id === current)) {
        setCurrent(arr[0]?.id || '')
      }
    }
  }, [summary, current])

  const addAct = () => {
    const id = crypto.randomUUID()
    const newActs = [...acts, { id, title: `Act ${acts.length + 1}` }]
    setActs(newActs)
    setCurrent(id)
  }

  const handleExport = () => {
    const txt = JSON.stringify(acts, null, 2)
    const blob = new Blob([txt], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const arr = JSON.parse(ev.target?.result as string)
        if (Array.isArray(arr)) {
          setActs(arr)
          setCurrent(arr[0]?.id || '')
        }
      } catch {}
    }
    reader.readAsText(file)
  }


  const initialConfig = liveblocksConfig({
    namespace: 'SummaryEditor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
    onError: (err: unknown) => console.error(err)
  })

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn" style={{ minHeight: 0 }}>
      <div className="flex gap-2 mb-2 text-sm">
        {acts.map(act => (
          <button key={act.id} onClick={() => setCurrent(act.id)} className={`px-2 py-1 rounded ${act.id===current?'bg-white/20':'bg-black/40'}`}>{act.title}</button>
        ))}
        <button onClick={addAct} className="px-2 py-1 rounded bg-black/40">+</button>
        <label className="ml-auto cursor-pointer px-2 py-1 rounded bg-black/40">
          Import<input type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </label>
        <button onClick={handleExport} className="px-2 py-1 rounded bg-black/40">Export</button>
      </div>
      {current && (
        <RoomProvider
          id={`${room.id}-summary-${current}`}
          initialPresence={{}}
          initialStorage={{
            characters: new LiveMap(),
            images: new LiveMap(),
            music: new LiveObject({ id: '', playing: false }),
            summary: new LiveObject({ acts: [] }),
            events: new LiveList([])
          }}
        >
          <LexicalComposer initialConfig={initialConfig} key={current}>
            <LiveblocksPlugin />
            <div className="flex flex-col flex-1 min-h-0">
              <Toolbar className="w-full" />
              <div className="flex-1 relative">
                <RichTextPlugin
                  contentEditable={<ContentEditable className="outline-none p-2 text-sm flex-1" />}
                  placeholder={<p className="absolute top-2 left-2 text-gray-400 pointer-events-none">Write summary...</p>}
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <FloatingToolbar />
              </div>
            </div>
          </LexicalComposer>
        </RoomProvider>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useStorage, useMutation } from '@liveblocks/react'
import TextEditor from './TextEditor'

type Page = { id: number; title: string; content: string }

export default function SummaryPanel({ onClose }: { onClose: () => void }) {
  const acts = useStorage(root => root.summary.acts) as Page[] | null
  const addPage = useMutation(({ storage }) => {
    const arr = storage.get('summary').get('acts')
    const id = Date.now()
    arr.push({ id, title: 'New page', content: '' })
    return id
  }, [])
  const deletePage = useMutation(({ storage }, id: number) => {
    const arr = storage.get('summary').get('acts') as Page[]
    const index = arr.findIndex((p: Page) => p.id === id)
    if (index >= 0) arr.delete(index)
  }, [])
  const updateTitle = useMutation(({ storage }, id: number, title: string) => {
    const arr = storage.get('summary').get('acts') as Page[]
    const page = arr.find((p: Page) => p.id === id)
    if (page) page.title = title
  }, [])
  const updateContent = useMutation(({ storage }, id: number, content: string) => {
    const arr = storage.get('summary').get('acts') as Page[]
    const page = arr.find((p: Page) => p.id === id)
    if (page) page.content = content
  }, [])

  const [selected, setSelected] = useState<number | null>(null)
  useEffect(() => {
    if (!acts) return
    if (selected === null && acts.length > 0) {
      setSelected(acts[0].id)
    }
  }, [acts, selected])

  const current = acts?.find((p: Page) => p.id === selected) || null

  function exportPages() {
    if (!acts) return
    const data = JSON.stringify(acts, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'summary.json'
    a.click()
  }

  async function importPages(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const arr = JSON.parse(text)
      if (Array.isArray(arr)) replacePages(arr)
    } catch {}
  }

  const replacePages = useMutation(({ storage }, arr: Page[]) => {
    storage.get('summary').set('acts', arr as unknown as [])
  }, [])

  return (
    <div className="absolute inset-0 bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3" style={{minHeight:0}}>
      <div className="flex items-center mb-2 gap-2">
        <button onClick={() => onClose()} className="ml-auto text-white/80 hover:text-red-500 text-xl">✕</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-40 flex flex-col gap-2 mr-2 overflow-y-auto">
          {acts?.map((p: Page) => (
            <div key={p.id} className={`p-1 rounded cursor-pointer ${selected===p.id?'bg-purple-500/50':'bg-black/30'}`} onClick={() => setSelected(p.id)}>
              <input value={p.title} onChange={e=>updateTitle(p.id,e.target.value)} className="w-full bg-transparent text-white"/>
              <button className="text-xs text-red-400" onClick={()=>deletePage(p.id)}>Delete</button>
            </div>
          ))}
          <button onClick={async()=>{const id=await addPage();setSelected(id)}} className="p-1 bg-emerald-600/80 rounded text-sm">Add page</button>
          <button onClick={exportPages} className="p-1 bg-blue-600/80 rounded text-sm mt-2">Export</button>
          <label className="p-1 bg-blue-600/30 rounded text-sm mt-1 text-center cursor-pointer">
            Import<input type="file" accept="application/json" onChange={importPages} className="hidden" />
          </label>
        </div>
        <div className="flex-1 border border-white/10 rounded overflow-hidden">
          {current && (
            <TextEditor
              docId={`summary-${current.id}`}
              initialState={current.content}
              onChange={state => updateContent(current.id, JSON.stringify(state.toJSON()))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

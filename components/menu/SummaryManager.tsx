'use client'
import { useEffect, useRef, useState } from 'react'

const PREFIX = 'summary_pages_'

export type SummaryPage = { id: string; title: string }

export default function SummaryManager({ roomId }: { roomId: string }) {
  const [pages, setPages] = useState<SummaryPage[]>([])
  const [title, setTitle] = useState('')
  const fileRef = useRef<HTMLInputElement | null>(null)

  const storageKey = PREFIX + roomId

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) setPages(arr)
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pages))
    } catch {}
  }, [pages, storageKey])

  const addPage = () => {
    const t = title.trim()
    if (!t) return
    setPages([...pages, { id: crypto.randomUUID(), title: t }])
    setTitle('')
  }

  const exportPages = () => {
    const data = pages.map(p => ({
      ...p,
      content: localStorage.getItem(`${PREFIX}${roomId}_${p.id}`) || ''
    }))
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'summary.txt'
    })
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const importPages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const arr = JSON.parse(evt.target?.result as string) as Array<{ id?: string; title?: string; content?: string }>
        if (Array.isArray(arr)) {
          setPages(arr.map(p => ({ id: p.id || crypto.randomUUID(), title: p.title || 'Page' })))
          arr.forEach(p => {
            if (p.content)
              localStorage.setItem(`${PREFIX}${roomId}_${p.id}`, p.content)
          })
        }
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="mt-6 space-y-2">
      <h3 className="text-lg font-semibold text-white">Summaries</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New page title"
          className="px-2 py-1 rounded bg-black/40 text-white flex-1"
        />
        <button onClick={addPage} className="px-3 py-1 rounded bg-blue-600 text-white">Add</button>
      </div>
      <ul className="space-y-1 text-sm text-white/90">
        {pages.map(p => (
          <li key={p.id}>{p.title}</li>
        ))}
      </ul>
      <div className="flex items-center gap-2 mt-2">
        <button onClick={exportPages} className="px-3 py-1 rounded bg-emerald-600 text-white">Export</button>
        <button onClick={() => fileRef.current?.click()} className="px-3 py-1 rounded bg-purple-600 text-white">Import</button>
        <input ref={fileRef} type="file" accept="text/plain" onChange={importPages} className="hidden" />
      </div>
    </section>
  )
}

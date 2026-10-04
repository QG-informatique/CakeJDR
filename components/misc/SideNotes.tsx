'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useStorage, useMutation, useStatus } from '@liveblocks/react'
import { LiveObject } from '@liveblocks/client'
import { useT } from '@/lib/useT'

const LIVE_KEY = 'quickNote' as const
const LOCAL_KEY = 'codex_quicknote'
const HEIGHT_KEY = 'codex_quicknote_height'

type NoteData = { text: string; updatedAt: number }

function loadLocal(): NoteData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return { text: '', updatedAt: 0 }
    const parsed = JSON.parse(raw)
    return {
      text: typeof parsed.text === 'string' ? parsed.text : '',
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    }
  } catch {
    return { text: '', updatedAt: 0 }
  }
}

function saveLocal(data: NoteData) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  } catch {}
}

export default function SideNotes() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [height, setHeight] = useState<number>(192)
  const [updated, setUpdated] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const t = useT()

  const status = useStatus() as string
  const liveNoteObject = useStorage((root) => root.quickNote) as
    | LiveObject<NoteData>
    | null
  const liveNote = useMemo<NoteData | null>(() => {
    if (liveNoteObject instanceof LiveObject) {
      return liveNoteObject.toObject() as NoteData
    }
    return liveNoteObject ?? null
  }, [liveNoteObject])

  const updateLive = useMutation(({ storage }, data: NoteData) => {
    const obj = storage.get(LIVE_KEY)
    if (obj instanceof LiveObject) obj.update(data)
    else storage.set(LIVE_KEY, new LiveObject(data))
  }, [])

  // Initial load
  useEffect(() => {
    const local = loadLocal()
    setNotes(local.text)
    setUpdated(local.updatedAt)
    const savedHeight = localStorage.getItem(HEIGHT_KEY)
    if (savedHeight) setHeight(Number(savedHeight))
  }, [])

  // Connection guard & resync
  useEffect(() => {
    if (status === 'connected') {
      const remote = liveNote ?? { text: '', updatedAt: 0 }
      const local = loadLocal()
      if (local.updatedAt > remote.updatedAt) {
        // La storage Liveblocks peut ne pas être encore disponible au premier montage
        try { updateLive(local) } catch { /* sera retenté quand liveNote changera */ }
        setNotes(local.text)
        setUpdated(local.updatedAt)
      } else {
        setNotes(remote.text)
        setUpdated(remote.updatedAt)
        saveLocal(remote)
      }
    } else if (status === 'disconnected') {
      const local = loadLocal()
      setNotes(local.text)
      setUpdated(local.updatedAt)
    } else {
      const id = setTimeout(() => {
        if (status !== 'connected') {
          const local = loadLocal()
          setNotes(local.text)
          setUpdated(local.updatedAt)
        }
      }, 3000)
      return () => clearTimeout(id)
    }
  }, [status, liveNote, updateLive])

  // Sync remote changes to local
  useEffect(() => {
    if (status === 'connected' && liveNote) {
      const { text, updatedAt } = liveNote
      setNotes(text)
      setUpdated(updatedAt)
      saveLocal({ text, updatedAt })
    }
  }, [liveNote, status])

  // Save height
  useEffect(() => {
    localStorage.setItem(HEIGHT_KEY, String(height))
  }, [height])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    const ts = Date.now()
    setNotes(val)
    setUpdated(ts)
    saveLocal({ text: val, updatedAt: ts })
    if (status === 'connected') {
      updateLive({ text: val, updatedAt: ts })
    }
  }

  const handleResize = () => {
    if (textareaRef.current) {
      setHeight(textareaRef.current.offsetHeight)
    }
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-50"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {open ? (
        <div className="relative rounded-2xl border border-ink/12 bg-shade/40 backdrop-blur-[8px] shadow-2xl text-ink p-3 w-72 animate-fadeInScale"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 mb-2 text-ink/40">
            <svg width="13" height="13" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <rect x="4" y="3.5" width="14" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              <line x1="7" y1="7.7" x2="15" y2="7.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="7" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="7" y1="14.3" x2="13" y2="14.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="text-[10px] uppercase tracking-widest font-semibold">{t('notes')}</span>
          </div>
          <textarea
            ref={textareaRef}
            className="w-full bg-ink/5 rounded-xl p-2.5 text-sm resize-y border border-ink/8 focus:outline-none focus:border-indigo-400/30 focus:bg-ink/8 transition-all placeholder:text-ink/20 text-ink/90 leading-relaxed"
            style={{ height }}
            value={notes}
            onChange={handleChange}
            onBlur={handleResize}
            onMouseUp={handleResize}
            placeholder="…"
          />
          <button
            className="absolute -right-3 top-4 bg-shade/70 hover:bg-shade/90 text-ink/60 hover:text-ink border border-ink/12 rounded-lg shadow-lg flex items-center justify-center transition-all duration-150 hover:scale-110"
            onClick={() => { handleResize(); setOpen(false) }}
            title={t('close')}
            style={{ width: 26, height: 26, padding: 0 }}
          >
            <span style={{ fontWeight: 700, fontSize: '1.1em', lineHeight: '1' }}>×</span>
          </button>
        </div>
      ) : (
        <button
          className="bg-shade/30 hover:bg-shade/55 border border-ink/12 rounded-xl shadow-lg backdrop-blur-[4px] flex items-center justify-center transition-all duration-150 hover:scale-105 hover:border-ink/20"
          onClick={() => setOpen(true)}
          title={t('notes')}
          style={{ width: 40, height: 40, fontSize: '1.2rem', padding: 0 }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
            className="opacity-80"
          >
            <rect x="4" y="3.5" width="14" height="15" rx="3.5" stroke="white" strokeWidth="1.3" fill="none"/>
            <line x1="7" y1="7.7" x2="15" y2="7.7" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="7" y1="11" x2="15" y2="11" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
            <line x1="7" y1="14.3" x2="13" y2="14.3" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

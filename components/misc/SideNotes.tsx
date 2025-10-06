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
        updateLive(local)
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
    <div className="absolute bottom-4 left-4 z-50">
      {open ? (
        <div className="relative rounded-2xl border border-white/10 bg-black/30 backdrop-blur-[2.5px] shadow-2xl shadow-black/15 text-white p-3 w-72 transition-all">
          <textarea
            ref={textareaRef}
            className="w-full bg-black/20 rounded-xl p-2 text-sm resize-y border border-white/10 focus:ring-2 focus:ring-blue-500/20 transition"
            style={{ height }}
            value={notes}
            onChange={handleChange}
            onBlur={handleResize}
            onMouseUp={handleResize}
          />
          <div className="flex justify-between items-center mt-2">
            <button
              className="bg-emerald-600/90 hover:bg-emerald-500/90 text-white px-3 py-1 rounded-md text-xs shadow transition"
              onClick={() => saveLocal({ text: notes, updatedAt: updated })}
            >
              {t('save')}
            </button>
            <button
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white border border-white/15 rounded-xl shadow flex items-center justify-center transition"
              onClick={() => {
                handleResize()
                setOpen(false)
              }}
              title={t('close')}
              style={{ fontSize: '1.1rem', width: 32, height: 32, padding: 0 }}
            >
              <span style={{ fontWeight: 700, fontSize: '1.35em', lineHeight: '1' }}>×</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          className="bg-black/25 hover:bg-black/50 border border-white/10 rounded-xl shadow-lg backdrop-blur-[2.5px] flex items-center justify-center transition"
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

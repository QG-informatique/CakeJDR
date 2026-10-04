'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useStorage, useMutation, useStatus } from '@liveblocks/react'
import { LiveObject } from '@liveblocks/client'
import { useT } from '@/lib/useT'
import { NotebookPen, X } from 'lucide-react'

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- notes gardées dans le navigateur, lues au premier affichage
    setNotes(local.text)
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- rapprochement des notes locales et de Liveblocks
        setNotes(local.text)
      } else {
        setNotes(remote.text)
        saveLocal(remote)
      }
    } else if (status === 'disconnected') {
      const local = loadLocal()
      setNotes(local.text)
    } else {
      const id = setTimeout(() => {
        if (status !== 'connected') {
          const local = loadLocal()
          setNotes(local.text)
        }
      }, 3000)
      return () => clearTimeout(id)
    }
  }, [status, liveNote, updateLive])

  // Sync remote changes to local
  useEffect(() => {
    if (status === 'connected' && liveNote) {
      const { text, updatedAt } = liveNote
      // eslint-disable-next-line react-hooks/set-state-in-effect -- suit les notes reçues de Liveblocks
      setNotes(text)
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
      className="absolute bottom-3 left-3 z-30"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {open ? (
        <div
          className="ui-panel relative w-72 p-3 shadow-2xl !backdrop-blur-md animate-fadeInScale"
          style={{ background: 'var(--c-panel-head)' }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <NotebookPen size={13} className="text-ink/50" />
            <span className="ui-label">{t('notes')}</span>
            <button
              className="ui-btn ui-btn-ghost ui-btn-icon ml-auto !h-6 !w-6 !min-h-6"
              onClick={() => { handleResize(); setOpen(false) }}
              title={t('close')}
              aria-label={t('close')}
            >
              <X size={14} />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="ui-input w-full !p-2.5 text-sm resize-y leading-relaxed placeholder:text-ink/25"
            style={{ height }}
            value={notes}
            onChange={handleChange}
            onBlur={handleResize}
            onMouseUp={handleResize}
            placeholder="…"
          />
        </div>
      ) : (
        <button
          className="ui-btn ui-btn-icon !h-10 !w-10 shadow-lg !bg-[var(--c-panel-head)]"
          onClick={() => setOpen(true)}
          title={t('notes')}
          aria-label={t('notes')}
        >
          <NotebookPen size={18} />
        </button>
      )}
    </div>
  )
}

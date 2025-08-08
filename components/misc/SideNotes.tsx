'use client'
import { useState, useEffect, useRef } from 'react'
import { useT } from '@/lib/useT'

const STORAGE_KEY = 'jdr_side_notes'
const HEIGHT_KEY = 'jdr_side_notes_height'

export default function SideNotes() {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [height, setHeight] = useState<number>(192) // 48*4 = 192px par défaut
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const t = useT()

  // Charger les notes et la hauteur au démarrage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setNotes(saved)
    const savedHeight = localStorage.getItem(HEIGHT_KEY)
    if (savedHeight) setHeight(Number(savedHeight))
  }, [])

  // Sauver les notes à chaque modif
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, notes)
  }, [notes])

  // Sauver la hauteur à chaque modif
  useEffect(() => {
    localStorage.setItem(HEIGHT_KEY, String(height))
  }, [height])

  // Gérer la détection de resize (on le fait à la fermeture OU quand on perd le focus)
  const handleResize = () => {
    if (textareaRef.current) {
      setHeight(textareaRef.current.offsetHeight)
    }
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-50"
    >
      {open ? (
        <div
          className="
            relative rounded-2xl border border-white/10
            bg-black/30 backdrop-blur-[2.5px] shadow-2xl shadow-black/15
            text-white p-3 w-72 transition-all
          "
        >
          <textarea
            ref={textareaRef}
            className="w-full bg-black/20 rounded-xl p-2 text-sm resize-y border border-white/10 focus:ring-2 focus:ring-blue-500/20 transition"
            style={{ height }}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleResize}
            onMouseUp={handleResize}
          />
          <div className="flex justify-between items-center mt-2">
            <button
              className="bg-emerald-600/90 hover:bg-emerald-500/90 text-white px-3 py-1 rounded-md text-xs shadow transition"
              onClick={() => localStorage.setItem(STORAGE_KEY, notes)}
            >{t('save')}</button>
            <button
              className="
                absolute -right-4 top-1/2 -translate-y-1/2
                bg-black/60 hover:bg-black/90 text-white border border-white/15
                rounded-xl shadow
                flex items-center justify-center
                transition
              "
              onClick={() => {
                handleResize()
                setOpen(false)
              }}
              title={t('close')}
              style={{
                fontSize: '1.1rem',
                width: 32,
                height: 32,
                padding: 0,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "1.35em", lineHeight: "1" }}>×</span>
            </button>
          </div>
        </div>
      ) : (
        <button
  className="
    bg-black/25 hover:bg-black/50 border border-white/10
    rounded-xl shadow-lg backdrop-blur-[2.5px]
    flex items-center justify-center transition
  "
  onClick={() => setOpen(true)}
  title={t('notes')}
  style={{
    width: 40,
    height: 40,
    fontSize: '1.2rem',
    padding: 0,
  }}
>
  {/* Icône note/papier minimaliste, SVG inline */}
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

'use client'
import { FC, useState, useRef, useEffect, ChangeEvent } from 'react'

// --------- Custom Select DA Import/Export ---------
type CustomActSelectProps = {
  value: number
  onChange: (v: number) => void
  options: { value: number; label: string }[]
  disabled?: boolean
}
const CustomActSelect: FC<CustomActSelectProps> = ({ value, onChange, options, disabled }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) window.addEventListener("mousedown", handleClick)
    return () => window.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative w-[200px] max-w-[220px] select-none">
      <button
        type="button"
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-xl font-semibold text-white/85 shadow
          bg-black/35 border border-white/10 transition
          hover:bg-black/50 hover:border-white/20
          disabled:opacity-60 backdrop-blur-md
          flex items-center justify-between
        `}
        style={{
          boxShadow: '0 2px 14px 0 #0007, 0 0 0 1px #fff1 inset',
          background: 'linear-gradient(120deg,rgba(18,28,54,0.35) 60%,rgba(16,18,33,0.23) 100%)'
        }}
        onClick={() => !disabled && setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{options.find(o => o.value === value)?.label || "[Sans titre]"}</span>
        <svg width="18" height="18" className="ml-2 opacity-70" viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div
          className="absolute z-30 left-0 w-full mt-1 rounded-xl bg-black/80 border border-white/10 shadow-2xl py-1 animate-fadeIn backdrop-blur-md"
          style={{
            background: 'linear-gradient(120deg,rgba(18,28,54,0.91) 60%,rgba(16,18,33,0.77) 100%)'
          }}
          role="listbox"
        >
          {options.map(opt => (
            <button
              type="button"
              key={opt.value}
              disabled={disabled}
              className={`
                w-full px-4 py-2 text-left text-md font-semibold rounded
                text-white transition
                hover:bg-gray-800/80
                ${value === opt.value ? 'bg-gray-700/80' : ''}
              `}
              style={{
                background: value === opt.value
                  ? "linear-gradient(120deg,#23364aBB 60%,#131b2455 100%)"
                  : undefined
              }}
              onClick={() => {
                setOpen(false)
                onChange(opt.value)
              }}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeInMenu .18s;
        }
        @keyframes fadeInMenu {
          from { opacity: 0; transform: translateY(12px);}
          to   { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  )
}
// --------- /Custom Select ---------

type Act = {
  id: number
  title: string
  content: string
}

type Props = {
  onClose: () => void
}

function parseActsFromText(text: string): Act[] {
  const sections = text.split(/^={3,}\s*ACTE\s+(\d+)\s*={3,}$/gmi)
  const acts: Act[] = []
  for (let i = 1; i < sections.length; i += 2) {
    const id = parseInt(sections[i].trim())
    acts.push({
      id,
      title: `Acte ${id}`,
      content: sections[i + 1].trim()
    })
  }
  if (acts.length === 0) {
    acts.push({
      id: 1,
      title: '',
      content: text.trim()
    })
  }
  return acts
}
function exportActsToText(acts: Act[]): string {
  return acts.map(a => `=== ACTE ${a.id} ===\n${a.content}`).join('\n\n')
}
const LOCAL_KEY = 'summaryPanel_acts_v1'

const SummaryPanel: FC<Props> = ({ onClose }) => {
  const [acts, setActs] = useState<Act[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_KEY)
      if (saved) return JSON.parse(saved)
    }
    return [{ id: 1, title: '', content: 'Résumé du premier acte de la partie.' }]
  })
  const [selectedId, setSelectedId] = useState<number>(acts[0]?.id || 1)
  const [editMode, setEditMode] = useState(false)
  const [draftContent, setDraftContent] = useState<string>(acts[0]?.content || '')
  const [draftTitle, setDraftTitle] = useState<string>(acts[0]?.title || '')
  const contentRef = useRef<HTMLDivElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Persistance localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(acts))
  }, [acts])

  useEffect(() => {
    const selectedAct = acts.find(a => a.id === selectedId)
    setDraftContent(selectedAct?.content || '')
    setDraftTitle(selectedAct?.title || '')
    if (contentRef.current) contentRef.current.scrollTop = 0
    if (editMode && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [selectedId, acts, editMode])

  const handleSelectAct = (id: number) => {
    setSelectedId(id)
    setEditMode(false)
  }
  const handleSave = () => {
    setActs(acts =>
      acts.map(a =>
        a.id === selectedId
          ? { ...a, content: draftContent, title: draftTitle.trim() }
          : a
      )
    )
    setEditMode(false)
  }
  const handleAddAct = () => {
    const nextId = (Math.max(...acts.map(a => a.id), 0) + 1)
    const newAct = { id: nextId, title: '', content: '' }
    setActs([...acts, newAct])
    setSelectedId(nextId)
    setDraftContent('')
    setDraftTitle('')
    setEditMode(true)
    setTimeout(() => titleInputRef.current?.focus(), 100)
  }
  const handleDeleteAct = (id: number) => {
    if (acts.length <= 1) return
    if (!window.confirm('Supprimer définitivement cet acte ?')) return
    const filtered = acts.filter(a => a.id !== id)
    setActs(filtered)
    setSelectedId(filtered[filtered.length - 1].id)
    setEditMode(false)
  }
  // EXPORT / IMPORT
  const handleExport = () => {
    const text = exportActsToText(acts)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume_partie.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleImportClick = () => fileInputRef.current?.click()
  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const parsedActs = parseActsFromText(text)
      setActs(parsedActs)
      setSelectedId(parsedActs[0]?.id || 1)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const selectedAct = acts.find(a => a.id === selectedId)

  return (
    <div
      className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 animate-fadeIn"
      style={{ minHeight: 0, minWidth: 0 }}
    >
      {/* Barre du haut : Select custom + Ajouter + Editer (à droite) */}
      <div className="flex justify-between items-center mb-3 px-2 pt-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CustomActSelect
            value={selectedId}
            onChange={handleSelectAct}
            options={acts.map(act => ({
              value: act.id,
              label: act.title ? act.title : "[Sans titre]"
            }))}
            disabled={acts.length < 1}
          />
          <button
            onClick={handleAddAct}
            className="
              px-4 py-2 rounded-xl font-semibold shadow
              bg-black/35 border border-white/10 text-white/85
              hover:bg-emerald-600/90 hover:text-white
              transition
            "
            title="Ajouter un acte"
          >+ acte</button>
        </div>
        <button
          onClick={() => setEditMode(true)}
          className="
            px-4 py-2 rounded-xl font-semibold shadow
            bg-black/35 border border-white/10 text-white/85
            hover:bg-yellow-400/90 hover:text-black
            transition
          "
        >
          Éditer
        </button>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-red-500 font-bold px-2 text-xl"
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 7px',
            transition: 'color 0.15s'
          }}
        >
          ✕
        </button>
      </div>
      {/* Ligne suivante : Import/Export */}
      <div className="flex gap-2 mb-2 px-2">
        <button
          onClick={handleImportClick}
          className="
            px-4 py-2 rounded-xl font-semibold shadow
            bg-black/35 border border-white/10 text-white/85
            hover:bg-purple-600/90 hover:text-white
            transition
          "
          title="Importer fichier"
        >Importer</button>
        <button
          onClick={handleExport}
          className="
            px-4 py-2 rounded-xl font-semibold shadow
            bg-black/35 border border-white/10 text-white/85
            hover:bg-blue-600/90 hover:text-white
            transition
          "
          title="Exporter tout"
        >Exporter</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleImport}
        />
      </div>
      <div className="flex-1 flex flex-col px-2 pb-2 min-h-0">
        {editMode ? (
          <>
            <input
              ref={titleInputRef}
              type="text"
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              className="w-full rounded border p-2 mb-2 font-semibold text-lg text-white bg-black/35 border-white/10"
              maxLength={48}
              placeholder="Titre de l'acte (laisser vide si besoin)"
            />
            <textarea
              value={draftContent}
              onChange={e => setDraftContent(e.target.value)}
              className="w-full flex-1 rounded border p-2 text-white bg-black/35 border-white/10 resize-y"
              style={{ minHeight: 180, maxHeight: '100%', height: '100%' }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl font-semibold shadow bg-black/35 border border-white/10 text-white/85 hover:bg-blue-600/90 hover:text-white transition"
              >
                Sauver
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="px-4 py-2 rounded-xl font-semibold shadow bg-black/35 border border-white/10 text-white/85 hover:bg-yellow-400/90 hover:text-black transition"
              >
                Annuler
              </button>
              {acts.length > 1 && (
                <button
                  onClick={() => handleDeleteAct(selectedId)}
                  className="px-4 py-2 rounded-xl font-semibold shadow bg-black/35 border border-white/10 text-white/85 hover:bg-red-600/90 hover:text-white transition ml-auto"
                  title="Supprimer cet acte"
                >
                  Supprimer
                </button>
              )}
            </div>
          </>
        ) : (
          <div
            ref={contentRef}
            className="whitespace-pre-line break-words text-[15px] bg-black/20 border border-white/10 rounded-xl p-3 flex-1 overflow-y-auto"
            style={{ wordBreak: 'break-word', minHeight: 0 }}
          >
            <div className="font-semibold text-lg mb-2">{selectedAct?.title || <span className="italic text-gray-400">[Sans titre]</span>}</div>
            {selectedAct?.content || <span className="text-gray-400">Aucun résumé pour cet acte.</span>}
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryPanel

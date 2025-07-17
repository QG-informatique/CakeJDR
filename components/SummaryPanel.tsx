'use client'
import { FC, useState, useRef, useEffect, ChangeEvent } from 'react'

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
    // Focus sur le champ titre en création d’acte
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
    // ID unique (toujours +1 du max)
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
      className="absolute inset-0 bg-gray-100 dark:bg-gray-900 bg-opacity-95 rounded shadow-xl flex flex-col h-full w-full z-20 animate-fadeIn"
      style={{ minHeight: 0, minWidth: 0 }}
    >
      {/* Barre du haut compacte, select déroulant + boutons */}
      <div className="flex justify-between items-center mb-3 px-2 pt-1 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="px-2 py-1 rounded text-sm font-semibold border bg-white dark:bg-gray-700 dark:text-white"
            style={{ maxWidth: 220 }}
            value={selectedId}
            onChange={e => handleSelectAct(Number(e.target.value))}
          >
            {acts.map(act => (
              <option key={act.id} value={act.id}>
                {act.title ? act.title : `[Sans titre]`}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddAct}
            className="px-2 py-1 rounded text-xs bg-green-500 hover:bg-green-600 text-white ml-1"
            title="Ajouter un acte"
          >+ acte</button>
          <button
            onClick={handleExport}
            className="px-2 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700 text-white ml-1"
            title="Exporter tout"
          >Exporter</button>
          <button
            onClick={handleImportClick}
            className="px-2 py-1 rounded text-xs bg-purple-600 hover:bg-purple-700 text-white ml-1"
            title="Importer fichier"
          >Importer</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        <button
          onClick={onClose}
          className="text-gray-800 dark:text-gray-200 hover:text-red-500 font-bold px-2"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 flex flex-col px-2 pb-2 min-h-0">
        {editMode ? (
          <>
            <input
              ref={titleInputRef}
              type="text"
              value={draftTitle}
              onChange={e => setDraftTitle(e.target.value)}
              className="w-full rounded border p-2 mb-2 font-semibold text-lg text-black dark:text-white dark:bg-gray-800"
              maxLength={48}
              placeholder="Titre de l'acte (laisser vide si besoin)"
            />
            <textarea
              value={draftContent}
              onChange={e => setDraftContent(e.target.value)}
              className="w-full flex-1 rounded border p-2 text-black dark:text-white dark:bg-gray-800 resize-y"
              style={{ minHeight: 180, maxHeight: '100%', height: '100%' }}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Sauver
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="bg-gray-300 text-gray-800 px-3 py-1 rounded"
              >
                Annuler
              </button>
              {acts.length > 1 && (
                <button
                  onClick={() => handleDeleteAct(selectedId)}
                  className="bg-red-600 text-white px-3 py-1 rounded ml-auto"
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
            className="whitespace-pre-line break-words text-[15px] bg-gray-200 dark:bg-gray-700 rounded p-2 flex-1 overflow-y-auto"
            style={{ wordBreak: 'break-word', minHeight: 0 }}
          >
            <div className="font-semibold text-lg mb-2">{selectedAct?.title || <span className="italic text-gray-400">[Sans titre]</span>}</div>
            {selectedAct?.content || <span className="text-gray-400">Aucun résumé pour cet acte.</span>}
          </div>
        )}
        {!editMode && (
          <div className="mt-2">
            <button
              onClick={() => setEditMode(true)}
              className="bg-yellow-500 text-white px-3 py-1 rounded mr-2"
            >
              Éditer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SummaryPanel

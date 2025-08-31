// SessionSummary.tsx
// ================== PAGE COMPLÈTE AVEC FALLBACK LOCAL + INDICATEUR & LOGS ==================
//
// [CHANGEMENTS VISUELS SEULEMENT]
// - Le badge d’état n’est plus dans la TopBar.
// - Il s’affiche désormais à côté du bouton "Voir logs", au même emplacement (absolute, top-16, right-3).
//
// ───────────────────────────────────────────────────────────────────────────────────────────

'use client'

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useT } from '@/lib/useT'

// ====== Liveblocks (collaboratif) ======
import { useStorage, useMutation, useStatus } from '@liveblocks/react'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import type { LsonObject } from '@liveblocks/client'

// ====== Lexical ======
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import {
  LiveblocksPlugin,
  Toolbar,
  liveblocksConfig,
  useIsEditorReady,
} from '@liveblocks/react-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'

// ===================== Types =====================
type Page = {
  id: string
  title: string
}
interface Props {
  onClose: () => void
}

// [FIX] Déclaration manquante : le type Summary était utilisé mais non défini.
//      Ajout d'un simple LsonObject avec acts/currentId pour typer LiveObject<Summary>.
interface Summary extends LsonObject {
  acts: LiveList<Page>
  currentId?: string
}

// ===================== Plugins Lexical communs =====================
function InitialContentPlugin({ text }: { text: string }) {
  const [editor] = useLexicalComposerContext()
  const isReady = useIsEditorReady()
  useEffect(() => {
    if (!isReady) return
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      text.split('\n').forEach((line) => {
        const p = $createParagraphNode()
        p.append($createTextNode(line))
        root.append(p)
      })
    })
  }, [isReady, editor, text])
  return null
}

function AutoSavePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent()
        onChange(text)
      })
    })
  }, [editor, onChange])
  return null
}

// ===================== ErrorBoundary : si la partie "Live" throw, on tombe en local =====================
type ErrorBoundaryProps = {
  onTrip: (err?: unknown) => void
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: { onTrip: (err?: unknown) => void; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err: unknown) {
    this.props.onTrip(err)
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

// ===================== Persistance locale (fallback) =====================
const LOCAL_KEY = 'sessionSummaryLocal'

function loadLocal(): {
  acts: Page[]
  currentId?: string
  editor: Record<string, string>
} {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return { acts: [], currentId: undefined, editor: {} }
    const parsed = JSON.parse(raw)
    return {
      acts: Array.isArray(parsed?.acts) ? parsed.acts : [],
      currentId:
        typeof parsed?.currentId === 'string' ? parsed.currentId : undefined,
      editor:
        typeof parsed?.editor === 'object' && parsed?.editor !== null
          ? parsed.editor
          : {},
    }
  } catch {
    return { acts: [], currentId: undefined, editor: {} }
  }
}

function saveLocal(data: {
  acts: Page[]
  currentId?: string
  editor: Record<string, string>
}) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
}

// ===================== Sous-composant : Mode LOCAL =====================
function LocalSummary({
  onClose,
  pushLog,
}: {
  onClose: () => void
  pushLog: (msg: string) => void
}) {
  const t = useT() as (key: string) => string

  const [state, setState] = useState(loadLocal())
  const [currentId, setCurrentId] = useState<string | undefined>(
    state.currentId,
  )
  const [editorKey, setEditorKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Page courante
  const current = useMemo(
    () => state.acts.find((p) => p.id === currentId),
    [state.acts, currentId],
  )

  // Création page
  const createPage = useCallback(
    (title: string) => {
      const newPage: Page = { id: crypto.randomUUID(), title }
      const next = {
        ...state,
        acts: [...state.acts, newPage],
        currentId: newPage.id,
      }
      setState(next)
      setCurrentId(newPage.id)
      saveLocal(next)
      setEditorKey((k) => k + 1)
    },
    [state],
  )

  // Bootstrapping
  useEffect(() => {
    if (state.acts.length === 0) {
      const title = (t('pageNamePrompt') as string) || 'New page'
      createPage(title)
    } else if (!currentId) {
      setCurrentId(state.acts[0]?.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Renommer
  const handleTitleChange = (title: string) => {
    if (!current) return
    const acts = state.acts.map((p) =>
      p.id === current.id ? { ...p, title } : p,
    )
    const next = { ...state, acts }
    setState(next)
    saveLocal(next)
  }

  // Sauvegarde texte (Lexical → localStorage)
  const handleAutoSave = (txt: string) => {
    if (!current) return
    const editor = { ...state.editor, [current.id]: txt }
    const next = { ...state, editor }
    setState(next)
    saveLocal(next)
  }

  // Changer de page
  const switchPage = (id: string) => {
    setCurrentId(id)
    const next = { ...state, currentId: id }
    saveLocal(next)
    setEditorKey((k) => k + 1)
  }

  // Supprimer page
  const handleDelete = () => {
    if (!current) return
    if (state.acts.length <= 1) {
      alert(
        (t('lastPageDeleteError') as string) ||
          'Impossible de supprimer la dernière page.',
      )
      return
    }
    if (
      !confirm((t('deletePageConfirm') as string) || 'Supprimer cette page ?')
    )
      return
    const acts = state.acts.filter((p) => p.id !== current.id)
    const nextId = acts[0]?.id
    const editor = { ...state.editor }
    delete editor[current.id]
    const next = { acts, currentId: nextId, editor }
    setState(next)
    setCurrentId(nextId)
    saveLocal(next)
    setEditorKey((k) => k + 1)
  }

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    file.text().then((text) => {
      const parts = text.split(/=== Page: /).slice(1)
      const incoming: Page[] = []
      const editor = { ...state.editor }
      parts.forEach((part) => {
        const [titleLine = '', ...contentLines] = part.split('\n')
        const title =
          titleLine.replace(/===$/, '').trim() ||
          (t('newPage') as string) ||
          'New page'
        const content = contentLines.join('\n').trim()
        const id = crypto.randomUUID()
        incoming.push({ id, title })
        // eslint-disable-next-line security/detect-object-injection
        editor[id] = content
      })

      // [FIX] Fin manquante : mise à jour de l'état + reset input
      const next = {
        ...state,
        acts: [...state.acts, ...incoming],
        currentId: incoming[0]?.id ?? state.currentId,
        editor,
      }
      setState(next)
      setCurrentId(next.currentId)
      saveLocal(next)
      setEditorKey((k) => k + 1)
      if (fileInputRef.current) fileInputRef.current.value = ''
    })
  }

  // Export
  const handleExport = () => {
    const txt = state.acts
      .map((p) => `=== Page: ${p.title} ===\n${state.editor[p.id] || ''}\n`)
      .join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const initialText = current ? state.editor[current.id] || '' : ''

  const editorConfig = liveblocksConfig({
    namespace: `session-summary-local-${current ? current.id : 'global'}`,
    onError: (e) =>
      pushLog('Lexical error (local): ' + (e?.message ?? String(e))),
  })

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Barre d’actions */}
      <TopBar
        onNewPage={() => createPage((t('newPage') as string) || 'New page')}
        pages={state.acts}
        currentId={currentId}
        onSwitch={switchPage}
        onDelete={handleDelete}
        onImport={handleImport}
        onExport={handleExport}
        onClose={onClose}
        fileInputRef={fileInputRef}
      />

      {/* Editeur */}
      {current && (
        <LexicalComposer key={editorKey} initialConfig={editorConfig}>
          {/* Pas de LiveblocksPlugin en local */}
          <Toolbar className="mb-2 w-full flex-shrink-0 !opacity-100">
            <Toolbar.SectionInline />
          </Toolbar>

          <input
            value={current.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-center font-semibold mb-2 bg-transparent outline-none w-full text-white placeholder-white/50"
            placeholder={
              (t('untitled' as unknown as Parameters<typeof t>[0]) as string) ||
              'Sans titre'
            }
          />

          <RichTextPlugin
            contentEditable={
              <ContentEditable className="flex-1 min-h-0 p-2 bg-black/20 rounded text-white outline-none" />
            }
            placeholder={
              <div className="text-white/50">
                {(t('startWriting') as string) || 'Commence à écrire...'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <InitialContentPlugin text={initialText} />
          <AutoSavePlugin onChange={handleAutoSave} />
        </LexicalComposer>
      )}
    </div>
  )
}

// ===================== Sous-composant : Mode LIVE (collaboratif) =====================
function LiveSummary({
  onClose,
  pushLog,
  tripToLocal, // si on doit basculer en local
}: {
  onClose: () => void
  pushLog: (msg: string) => void
  tripToLocal: (reason?: string) => void
}) {
  const t = useT() as (key: string) => string
  const status = useStatus() as string // 'initializing' | 'connected' | 'reconnecting' | 'disconnected'

  // Timeout 3s si pas connecté -> bascule local
  useEffect(() => {
    if (status === ('connected' as unknown as typeof status)) return
    const id = setTimeout(() => {
      if (status !== ('connected' as unknown as typeof status)) {
        pushLog(`Timeout de connexion Liveblocks (status: ${status}) -> bascule en local`)
        tripToLocal(`Timeout Liveblocks (status: ${status})`)
      }
    }, 3000)
    return () => clearTimeout(id)
  }, [status, pushLog, tripToLocal])

  // Si on passe en disconnected plus tard -> bascule local
  useEffect(() => {
    if (status === 'disconnected') {
      pushLog('Liveblocks: disconnected -> bascule en local')
      tripToLocal('Disconnected')
    }
  }, [status, pushLog, tripToLocal])

  // Sélecteurs Liveblocks (peuvent être undefined avant init)
  const summary = useStorage((root) => root.summary) as
    | LiveObject<Summary>
    | null

  const rawEditor = useStorage((root) => root.editor)
  const editorMap =
    rawEditor instanceof LiveMap ? (rawEditor as LiveMap<string, string>) : null

  // Normalisation pages / currentId
  const pages =
    summary instanceof LiveObject
      ? ((summary.get('acts') as LiveList<Page> | undefined)?.toArray() ?? undefined)
      : undefined

  const currentId =
    summary instanceof LiveObject
      ? ((summary.get('currentId') as string | undefined) ?? undefined)
      : undefined

  const [editorKey, setEditorKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mutations sûres (créent les structures si nécessaires)
  const ensureStorageShape = useMutation(({ storage }) => {
    let s = storage.get('summary')
    if (!(s instanceof LiveObject)) {
      s = new LiveObject<Summary>({
        acts: new LiveList<Page>([]),
        currentId: undefined,
      })
      storage.set('summary', s)
    }
    let acts = (s as LiveObject<Summary>).get('acts')
    if (!(acts instanceof LiveList)) {
      acts = new LiveList<Page>([])
      ;(s as LiveObject<Summary>).set('acts', acts)
    }
    const e = storage.get('editor')
    if (!(e instanceof LiveMap)) {
      storage.set('editor', new LiveMap<string, string>())
    }
  }, [])

  useEffect(() => {
    if (status !== 'connected') return
    ensureStorageShape()
  }, [ensureStorageShape, status])

  const addPage = useMutation(({ storage }, page: Page) => {
    let s = storage.get('summary')
    if (!(s instanceof LiveObject)) {
      s = new LiveObject<Summary>({
        acts: new LiveList<Page>([]),
        currentId: undefined,
      })
      storage.set('summary', s)
    }
    let list = (s as LiveObject<Summary>).get('acts')
    if (!(list instanceof LiveList)) {
      list = new LiveList<Page>([])
      ;(s as LiveObject<Summary>).set('acts', list)
    }
    ;(list as LiveList<Page>).push(page)
  }, [])

  const setCurrentId = useMutation(({ storage }, id: string | undefined) => {
    let s = storage.get('summary')
    if (!(s instanceof LiveObject)) {
      s = new LiveObject<Summary>({
        acts: new LiveList<Page>([]),
        currentId: undefined,
      })
      storage.set('summary', s)
    }
    ;(s as LiveObject<Summary>).set('currentId', id)
  }, [])

  const updatePageTitle = useMutation(
    ({ storage }, data: { id: string; title: string }) => {
      let s = storage.get('summary')
      if (!(s instanceof LiveObject)) {
        s = new LiveObject<Summary>({
          acts: new LiveList<Page>([]),
          currentId: undefined,
        })
        storage.set('summary', s)
      }
      let list = (s as LiveObject<Summary>).get('acts')
      if (!(list instanceof LiveList)) {
        list = new LiveList<Page>([])
        ;(s as LiveObject<Summary>).set('acts', list)
      }
      const arr = (list as LiveList<Page>).toArray()
      let target: Page | undefined
      let idx = -1
      arr.some((p, i) => {
        if (p.id === data.id) {
          target = p
          idx = i
          return true
        }
        return false
      })
      if (target && idx !== -1) {
        ;(list as LiveList<Page>).set(idx, { ...target, title: data.title })
      }
    },
    [],
  )

  const removePage = useMutation(({ storage }, id: string) => {
    let s = storage.get('summary')
    if (!(s instanceof LiveObject)) {
      s = new LiveObject<Summary>({
        acts: new LiveList<Page>([]),
        currentId: undefined,
      })
      storage.set('summary', s)
    }
    let list = (s as LiveObject<Summary>).get('acts')
    if (!(list instanceof LiveList)) {
      list = new LiveList<Page>([])
      ;(s as LiveObject<Summary>).set('acts', list)
    }
    const arr = (list as LiveList<Page>).toArray()
    const index = arr.findIndex((p) => p.id === id)
    if (index !== -1) {
      ;(list as LiveList<Page>).delete(index)
    }
  }, [])

  const updateEditor = useMutation(
    ({ storage }, data: { id: string; content: string }) => {
      let e = storage.get('editor') as LiveMap<string, string> | undefined
      if (!e || !(e instanceof LiveMap)) {
        e = new LiveMap<string, string>()
        storage.set('editor', e)
      }
      e.set(data.id, data.content)
    },
    [],
  )

  // Bootstrapping pages / currentId
  useEffect(() => {
    if (status !== 'connected' || !pages) return
    if (pages.length === 0) {
      const title = (t('pageNamePrompt') as string) || 'New page'
      const newPage = { id: crypto.randomUUID(), title }
      addPage(newPage)
      updateEditor({ id: newPage.id, content: '' })
      setCurrentId(newPage.id)
      setEditorKey((k) => k + 1)
    } else if (!currentId) {
      setCurrentId(pages[0]!.id)
      setEditorKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, currentId, status])

  const current = pages?.find((p) => p.id === currentId)

  // S’assurer qu’on a un slot texte pour la page courante
  useEffect(() => {
    if (!current || status !== 'connected') return
    if (editorMap instanceof LiveMap) {
      if (!editorMap.has(current.id)) {
        updateEditor({ id: current.id, content: '' })
      }
    } else {
      updateEditor({ id: current.id, content: '' })
    }
  }, [current, editorMap, updateEditor, status])

  // Actions UI
  const createPage = (title: string) => {
    if (status !== 'connected') return
    const newPage = { id: crypto.randomUUID(), title }
    addPage(newPage)
    updateEditor({ id: newPage.id, content: '' })
    setCurrentId(newPage.id)
    setEditorKey((k) => k + 1)
  }

  const handleTitleChange = (title: string) => {
    if (status !== 'connected' || !pages || !current) return
    updatePageTitle({ id: current.id, title })
  }

  const handleDelete = () => {
    if (status !== 'connected' || !pages || !current) return
    if (pages.length <= 1) {
      alert(
        (t('lastPageDeleteError') as string) ||
          'Impossible de supprimer la dernière page.',
      )
      return
    }
    if (
      !confirm((t('deletePageConfirm') as string) || 'Supprimer cette page ?')
    )
      return
    const rest = pages.filter((p) => p.id !== current.id)
    removePage(current.id)
    setCurrentId(rest[0]?.id)
    setEditorKey((k) => k + 1)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'connected') return
    const file = e.target.files?.[0]
    if (!file) return
    file
      .text()
      .then((text) => {
        const parts = text.split(/=== Page: /).slice(1)
        const newPages: Page[] = []
        parts.forEach((part) => {
          const [titleLine = '', ...contentLines] = part.split('\n')
          const title =
            titleLine.replace(/===$/, '').trim() ||
            (t('newPage') as string) ||
            'New page'
          const content = contentLines.join('\n').trim()
          const id = crypto.randomUUID()
          const page = { id, title }
          newPages.push(page)
          addPage(page)
          updateEditor({ id, content })
        })
        if (newPages.length > 0) {
          setCurrentId(newPages[0]!.id)
          setEditorKey((k) => k + 1)
        }
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
      .catch((err) => {
        pushLog('Import live: ' + (err?.message ?? String(err)))
      })
  }

  const handleExport = () => {
    if (!pages) return
    const txt = pages
      .map(
        (p) =>
          `=== Page: ${p.title} ===\n${
            editorMap instanceof LiveMap ? editorMap.get(p.id) || '' : ''
          }\n`,
      )
      .join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const initialText = current
    ? editorMap instanceof LiveMap
      ? editorMap.get(current.id) || ''
      : ''
    : ''

  const editorConfig = liveblocksConfig({
    namespace: `session-summary-${current ? current.id : 'global'}`,
    onError: (e) =>
      pushLog('Lexical error (live): ' + (e?.message ?? String(e))),
  })

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Barre d’actions */}
      <TopBar
        onNewPage={() => createPage((t('newPage') as string) || 'New page')}
        pages={pages || []}
        currentId={currentId}
        onSwitch={(id) => {
          if (status !== 'connected') return
          setCurrentId(id)
          setEditorKey((k) => k + 1)
        }}
        onDelete={handleDelete}
        onImport={handleImport}
        onExport={handleExport}
        onClose={onClose}
        fileInputRef={fileInputRef}
      />

      {/* Editeur */}
      {current && (
        <LexicalComposer key={editorKey} initialConfig={editorConfig}>
          <LiveblocksPlugin />
          <Toolbar className="mb-2 w-full flex-shrink-0 !opacity-100">
            <Toolbar.SectionInline />
          </Toolbar>

          <input
            value={current.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-center font-semibold mb-2 bg-transparent outline-none w-full text-white placeholder-white/50"
            placeholder={
              (t('untitled' as unknown as Parameters<typeof t>[0]) as string) ||
              'Sans titre'
            }
          />

          <RichTextPlugin
            contentEditable={
              <ContentEditable className="flex-1 min-h-0 p-2 bg-black/20 rounded text-white outline-none" />
            }
            placeholder={
              <div className="text-white/50">
                {(t('startWriting') as string) || 'Commence à écrire...'}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <InitialContentPlugin text={initialText} />
          <AutoSavePlugin
            onChange={(txt) => {
              if (!current || status !== 'connected') return
              updateEditor({ id: current.id, content: txt })
            }}
          />
        </LexicalComposer>
      )}
    </div>
  )
}

// ===================== Barre du haut commune (badge + actions + file menu) =====================
function TopBar({
  onNewPage,
  pages,
  currentId,
  onSwitch,
  onDelete,
  onImport,
  onExport,
  onClose,
  fileInputRef,
}: {
  onNewPage: () => void
  pages: Page[]
  currentId?: string
  onSwitch: (id: string) => void
  onDelete: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  onClose: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const t = useT()

  const [showFileMenu, setShowFileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showFileMenu) return
    const onDown = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setShowFileMenu(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showFileMenu])

  // [CHANGEMENT VISUEL] — suppression du badge dans la TopBar (il masquait des éléments)

  return (
    <div className="mb-3 flex w-full items-center justify-end gap-2 relative flex-shrink-0">
      <button
        onClick={onNewPage}
        className="bg-black/40 text-white px-2 py-1 rounded text-sm"
        title={t('newPage') as string}
      >
        +
      </button>

      <select
        value={currentId ?? ''}
        onChange={(e) => onSwitch(e.target.value)}
        className="bg-black/40 text-white rounded px-2 py-1 text-sm w-44"
      >
        {pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <button
        onClick={onDelete}
        className="bg-black/40 text-white px-2 py-1 rounded text-sm"
        title={t('deletePage' as unknown as Parameters<typeof t>[0]) as string}
      >
        🗑️
      </button>

      <div className="relative">
        <button
          ref={btnRef}
          onClick={() => setShowFileMenu((m) => !m)}
          className="bg-black/40 text-white px-2 py-1 rounded text-sm"
          title={t('fileMenu' as unknown as Parameters<typeof t>[0]) as string}
        >
          📁
        </button>
        {showFileMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-1 z-40 bg-black/80 rounded shadow p-1 w-40 flex flex-col"
          >
            <label className="px-2 py-1 hover:bg-white/10 cursor-pointer text-sm text-white">
              {t('importBtn') as string}
              <input
                ref={fileInputRef}
                type="file"
                accept="text/plain"
                onChange={onImport}
                className="hidden"
              />
            </label>
            <button
              onClick={onExport}
              className="text-left px-2 py-1 hover:bg-white/10 text-sm text-white"
            >
              {t('exportBtn') as string}
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="text-white/80 hover:text-red-500 text-xl"
        title={t('close') as string}
      >
        ✕
      </button>
    </div>
  )
}

// ===================== Panneau de LOGS (+ badge à côté) =====================
function LogsPanel({
  logs,
  clear,
  statusText, // [CHANGEMENT VISUEL] — nouveau libellé passé depuis le parent
  isLocal, // [CHANGEMENT VISUEL] — pour la couleur
}: {
  logs: string[]
  clear: () => void
  statusText: string
  isLocal: boolean
}) {
  const [open, setOpen] = useState(false)
  const badgeColor = isLocal ? 'bg-red-600' : 'bg-green-600'

  return (
    // [CHANGEMENT VISUEL] — même position qu’avant, mais on ajoute le badge juste à côté
    <div className="absolute right-3 top-16 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 bg-black/50 text-white text-xs px-2 py-1 rounded"
        title="Afficher / masquer les logs"
      >
        {open ? 'Masquer logs' : 'Voir logs'}
      </button>

      {/* Badge déplacé ici, collé au bouton logs */}
      <span
        className={`inline-flex items-center ${badgeColor} text-white text-xs px-2 py-1 rounded`}
      >
        ● {statusText}
      </span>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-[420px] max-h-[220px] overflow-auto bg-black/80 text-white text-xs rounded p-2 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <b>Logs de synchro</b>
              <button
                type="button"
                onClick={clear}
                className="text-white/70 hover:text-white underline"
              >
                Effacer
              </button>
            </div>
            {logs.length === 0 ? (
              <div className="text-white/60">Aucun log pour le moment.</div>
            ) : (
              <ul className="space-y-1">
                {logs.map((l, i) => (
                  <li key={i} className="whitespace-pre-wrap">
                    • {l}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ===================== Composant principal =====================
const SessionSummary: FC<Props> = ({ onClose }) => {
  const [isLocal, setIsLocal] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const pushLog = useCallback((msg: string) => {
    setLogs((prev) =>
      [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-200),
    )
  }, [])

  const tripToLocal = useCallback(
    (reason?: string) => {
      if (!isLocal) {
        pushLog(
          'Bascule en mode LOCAL' + (reason ? ` (raison: ${reason})` : ''),
        )
        setIsLocal(true)
      }
    },
    [isLocal, pushLog],
  )

  return (
    <div
      className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn overflow-visible"
      style={{ minHeight: 0 }}
    >
      {/* Contenu Live avec filet de sécurité */}
      {!isLocal ? (
        <ErrorBoundary
          onTrip={(err) => {
            pushLog(
              'Exception Liveblocks: ' +
                (err instanceof Error ? err.message : String(err)),
            )
            tripToLocal('Exception')
          }}
        >
          <LiveSummary
            onClose={onClose}
            pushLog={pushLog}
            tripToLocal={tripToLocal}
          />
        </ErrorBoundary>
      ) : (
        <LocalSummary onClose={onClose} pushLog={pushLog} />
      )}

      {/* [CHANGEMENT VISUEL] — Logs + badge côte à côte, sous la barre du haut */}
      <LogsPanel
        logs={logs}
        clear={() => setLogs([])}
        statusText={isLocal ? 'Local (hors‑ligne)' : 'En ligne'}
        isLocal={isLocal}
      />
    </div>
  )
}

export default SessionSummary

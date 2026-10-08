// Résumé de la partie : des pages de texte partagées par toute la table.
// Partagé en direct par Liveblocks ; si la connexion échoue, il reste
// utilisable et se garde sur cet appareil.

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
import { ArrowLeft, BookOpen, Download, Plus, Trash2, Upload } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/lib/useConfirm'

// ====== Liveblocks (collaboratif) ======
import { useStorage, useMutation, useStatus } from '@liveblocks/react'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import type { LsonObject } from '@liveblocks/client'

// ====== Lexical ======
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
// Note: LiveblocksPlugin/liveblocksConfig retirés intentionnellement.
// LiveblocksPlugin gère lui-même le contenu Lexical et entre en conflit
// avec nos plugins InitialContent/AutoSave → boucle infinie setState.
// On utilise notre editor LiveMap pour le partage multi-pages.
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'

// ===================== Types =====================
type Page = {
  id: string
  title: string
}
interface Props {
  onClose: () => void
  /** Bouton pour replier le panneau, fourni par le chat. */
  collapseButton?: React.ReactNode
}

// [FIX] Déclaration manquante : le type Summary était utilisé mais non défini.
//      Ajout d'un simple LsonObject avec acts/currentId pour typer LiveObject<Summary>.
interface Summary extends LsonObject {
  acts: LiveList<Page>
  currentId?: string
}

// ===================== Plugins Lexical =====================

/** Marque les mises à jour qui viennent du stockage, pas de la frappe. */
const REMOTE_TAG = 'remote-sync'
/** Délai sans frappe avant d'appliquer le texte d'un autre joueur. */
const REMOTE_IDLE_MS = 2000

/**
 * Texte de l'éditeur, une ligne par paragraphe. `getTextContent()` sépare les
 * paragraphes par une ligne vide, qui redevenait un paragraphe au rechargement :
 * chaque ouverture de la page doublait les sauts de ligne.
 */
function $readText(): string {
  return $getRoot()
    .getChildren()
    .map((node) => node.getTextContent())
    .join('\n')
}

function $writeText(text: string) {
  const root = $getRoot()
  root.clear()
  if (text) {
    text.split('\n').forEach((line) => {
      const p = $createParagraphNode()
      p.append($createTextNode(line))
      root.append(p)
    })
  } else {
    root.append($createParagraphNode())
  }
}

/** Vrai si la mise à jour change le texte et vient de la frappe locale. */
const isLocalTextChange = ({
  dirtyElements,
  dirtyLeaves,
  tags,
}: {
  dirtyElements: Map<string, boolean>
  dirtyLeaves: Set<string>
  tags: Set<string>
}) => (dirtyElements.size > 0 || dirtyLeaves.size > 0) && !tags.has(REMOTE_TAG)

function AutoSavePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    return editor.registerUpdateListener((update) => {
      // Un clic ou un déplacement du curseur ne change pas le texte : les
      // enregistrer écrasait ce qu'un autre joueur venait d'écrire.
      if (!isLocalTextChange(update)) return
      update.editorState.read(() => onChange($readText()))
    })
  }, [editor, onChange])
  return null
}

// Plugin d'initialisation pour le mode LOCAL : pas de useIsEditorReady (requiert LiveblocksPlugin)
function LocalInitContentPlugin({ text }: { text: string }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    editor.update(() => $writeText(text), { tag: REMOTE_TAG })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionnellement sans dépendances : ne s'exécute qu'à la création de l'instance (editorKey change)
  return null
}

/**
 * Affiche le texte écrit par les autres joueurs. Le texte n'était chargé qu'à
 * l'ouverture : on ne voyait pas ce que les autres écrivaient, et la frappe
 * suivante l'effaçait. Pendant qu'on écrit soi-même, on attend une pause.
 * Deux joueurs qui écrivent en même temps : le dernier l'emporte.
 */
function RemoteSyncPlugin({ text }: { text: string }) {
  const [editor] = useLexicalComposerContext()
  const lastLocalEdit = useRef(0)

  useEffect(() => {
    return editor.registerUpdateListener((update) => {
      if (isLocalTextChange(update)) lastLocalEdit.current = Date.now()
    })
  }, [editor])

  useEffect(() => {
    const apply = () => {
      if (editor.getEditorState().read($readText) === text) return
      const root = editor.getRootElement()
      const focused = root !== null && root.contains(document.activeElement)
      editor.update(
        () => {
          $writeText(text)
          if (focused) $getRoot().selectEnd()
        },
        { tag: REMOTE_TAG },
      )
    }
    const wait = REMOTE_IDLE_MS - (Date.now() - lastLocalEdit.current)
    if (wait <= 0) {
      apply()
      return
    }
    const id = window.setTimeout(apply, wait)
    return () => window.clearTimeout(id)
  }, [editor, text])

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

// ===================== Fichier texte : import et export =====================

/** Pages lues dans un fichier exporté (« === Page: titre === » puis le texte). */
function parseExport(text: string, fallbackTitle: string): { title: string; content: string }[] {
  return text
    .split(/=== Page: /)
    .slice(1)
    .map((part) => {
      const [titleLine = '', ...contentLines] = part.split('\n')
      return {
        title: titleLine.replace(/===\s*$/, '').trim() || fallbackTitle,
        content: contentLines.join('\n').trim(),
      }
    })
}

function downloadExport(pages: Page[], textOf: (id: string) => string) {
  const txt = pages
    .map((p) => `=== Page: ${p.title} ===\n${textOf(p.id)}\n`)
    .join('\n')
  const blob = new Blob([txt], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resume-de-partie.txt'
  a.click()
  // Révoquer tout de suite peut annuler le téléchargement sur certains navigateurs.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ===================== Présentation commune aux deux modes =====================

type ViewProps = {
  pages: Page[]
  current?: Page
  onSwitch: (id: string) => void
  onNewPage: () => void
  onTitle: (title: string) => void
  onDelete: () => void
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  /** L'éditeur de la page ouverte, ou un message d'attente. */
  children: React.ReactNode
}

/** Onglets des pages, titre de la page, texte, puis import, export, suppression. */
function SummaryView({
  pages,
  current,
  onSwitch,
  onNewPage,
  onTitle,
  onDelete,
  onImport,
  onExport,
  fileInputRef,
  children,
}: ViewProps) {
  const t = useT()
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3">
      <div role="tablist" aria-label={t('summaryPages')} className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5">
        {pages.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === current?.id}
            onClick={() => onSwitch(p.id)}
            className={`ui-btn !min-h-8 max-w-[9rem] shrink-0 !px-2.5 text-xs ${p.id === current?.id ? 'ui-btn-primary' : 'ui-btn-ghost'}`}
            title={p.title || t('untitled')}
          >
            <span className="truncate">{p.title || t('untitled')}</span>
          </button>
        ))}
        <button
          onClick={onNewPage}
          className="ui-btn ui-btn-ghost !min-h-8 shrink-0 !px-2 text-xs"
          title={t('newPage')}
        >
          <Plus size={14} /> {t('summaryAddPage')}
        </button>
      </div>

      {current && (
        <input
          value={current.title}
          onChange={(e) => onTitle(e.target.value)}
          maxLength={60}
          aria-label={t('summaryPageTitle')}
          placeholder={t('untitled')}
          className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-base font-semibold text-ink outline-none placeholder:text-ink/40 hover:border-[var(--c-panel-line)] focus:border-accent"
        />
      )}

      <div className="ui-well relative min-h-0 flex-1 overflow-y-auto">{children}</div>

      <div className="flex flex-wrap items-center gap-1.5">
        <label className="ui-btn ui-btn-ghost !min-h-8 cursor-pointer text-xs" title={t('summaryImportHint')}>
          <Upload size={14} /> {t('importBtn')}
          <input ref={fileInputRef} type="file" accept=".txt,text/plain" onChange={onImport} className="hidden" />
        </label>
        <button onClick={onExport} className="ui-btn ui-btn-ghost !min-h-8 text-xs" title={t('summaryExportHint')}>
          <Download size={14} /> {t('exportBtn')}
        </button>
        {current && (
          <button
            onClick={onDelete}
            disabled={pages.length <= 1}
            className="ui-btn ui-btn-ghost ml-auto !min-h-8 text-xs !text-red-300 disabled:opacity-40"
            title={pages.length <= 1 ? t('lastPageDeleteError') : t('deletePage')}
          >
            <Trash2 size={14} /> {t('summaryDeletePage')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Zone de texte Lexical d'une page. */
function PageText() {
  const t = useT()
  return (
    <RichTextPlugin
      contentEditable={
        <ContentEditable
          aria-label={t('summaryText')}
          className="min-h-full whitespace-pre-wrap p-3 text-sm leading-relaxed text-ink outline-none [&_p]:mb-2"
        />
      }
      placeholder={
        <div className="pointer-events-none absolute left-3 top-3 text-sm text-ink/40">
          {t('startWriting')}
        </div>
      }
      ErrorBoundary={LexicalErrorBoundary}
    />
  )
}

// ===================== Sous-composant : Mode LOCAL =====================
function LocalSummary({ pushLog }: { pushLog: (msg: string) => void }) {
  const t = useT() as (key: string) => string
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- première page créée à l'ouverture d'un résumé vide
      createPage(t('summaryFirstPage'))
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

  // Supprimer page (async pour attendre la réponse du ConfirmDialog)
  const handleDelete = useCallback(async () => {
    if (!current || state.acts.length <= 1) return
    const ok = await confirm(t('deletePageConfirm'), { title: t('deletePage'), danger: true })
    if (!ok) return
    const acts = state.acts.filter((p) => p.id !== current.id)
    const nextId = acts[0]?.id
    const editor = { ...state.editor }
    delete editor[current.id]
    const next = { acts, currentId: nextId, editor }
    setState(next)
    setCurrentId(nextId)
    saveLocal(next)
    setEditorKey((k) => k + 1)
  }, [current, state, confirm, t])

  // Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((text) => {
      const incoming: Page[] = []
      const editor = { ...state.editor }
      parseExport(text, t('newPage')).forEach(({ title, content }) => {
        const id = crypto.randomUUID()
        incoming.push({ id, title })
        editor[id] = content
      })
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

  const initialText = current ? state.editor[current.id] || '' : ''

  // Mode local : config Lexical simple, sans liveblocksConfig (pas de LiveblocksPlugin)
  const editorConfig = {
    namespace: `session-summary-local-${current ? current.id : 'global'}`,
    nodes: [] as [],
    onError: (e: Error) =>
      pushLog('Lexical error (local): ' + (e?.message ?? String(e))),
  }

  return (
    <>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <SummaryView
        pages={state.acts}
        current={current}
        onSwitch={switchPage}
        onNewPage={() => createPage(t('newPage'))}
        onTitle={handleTitleChange}
        onDelete={handleDelete}
        onImport={handleImport}
        onExport={() => downloadExport(state.acts, (id) => state.editor[id] || '')}
        fileInputRef={fileInputRef}
      >
        {current && (
          <LexicalComposer key={editorKey} initialConfig={editorConfig}>
            <HistoryPlugin />
            <PageText />
            <LocalInitContentPlugin text={initialText} />
            <AutoSavePlugin onChange={handleAutoSave} />
          </LexicalComposer>
        )}
      </SummaryView>
    </>
  )
}

// ===================== Sous-composant : Mode LIVE (collaboratif) =====================
function LiveSummary({
  pushLog,
  tripToLocal, // si on doit basculer en local
}: {
  pushLog: (msg: string) => void
  tripToLocal: (reason?: string) => void
}) {
  const t = useT() as (key: string) => string
  const status = useStatus() as string // 'initializing' | 'connected' | 'reconnecting' | 'disconnected'
  const { confirm, confirmState, handleConfirm: confirmOk, handleCancel: confirmNo } = useConfirm()

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

  // Sélecteurs Liveblocks — useStorage retourne des objets JS purs (auto-sérialisés),
  // PAS des LiveObject/LiveList/LiveMap → ne jamais appeler .get()/.toArray() ici
  const summaryPlain = useStorage((root) => root.summary) as {
    acts: Page[]
    currentId?: string
  } | null

  // `editor` est une LiveMap : useStorage la rend en Map, pas en objet. La lire
  // comme un objet ne trouvait jamais la page, la recréait en boucle, et le
  // résumé basculait en mode local à chaque ouverture : rien n'était partagé.
  const editorMap = useStorage((root) => root.editor) as ReadonlyMap<string, string> | null

  const pages = summaryPlain?.acts ?? undefined
  const currentId = summaryPlain?.currentId ?? undefined

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
      const idx = arr.findIndex((p) => p.id === data.id)
      if (idx !== -1) {
        ;(list as LiveList<Page>).set(idx, { ...arr[idx]!, title: data.title })
      }
    },
    [],
  )

  const removePage = useMutation(({ storage }, id: string) => {
    const s = storage.get('summary')
    if (!(s instanceof LiveObject)) return
    const list = (s as LiveObject<Summary>).get('acts')
    if (!(list instanceof LiveList)) return
    const index = (list as LiveList<Page>).toArray().findIndex((p) => p.id === id)
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
      const newPage = { id: crypto.randomUUID(), title: t('summaryFirstPage') }
      addPage(newPage)
      updateEditor({ id: newPage.id, content: '' })
      setCurrentId(newPage.id)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- première page créée une fois Liveblocks connecté
      setEditorKey((k) => k + 1)
    } else if (!currentId || !pages.some((p) => p.id === currentId)) {
      setCurrentId(pages[0]!.id)
      setEditorKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, currentId, status])

  const current = pages?.find((p) => p.id === currentId)

  // S'assurer qu'on a un slot texte pour la page courante
  useEffect(() => {
    if (!current || status !== 'connected') return
    if (editorMap && !editorMap.has(current.id)) {
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

  const handleDelete = useCallback(async () => {
    if (status !== 'connected' || !pages || !current || pages.length <= 1) return
    const ok = await confirm(t('deletePageConfirm'), { title: t('deletePage'), danger: true })
    if (!ok) return
    const rest = pages.filter((p) => p.id !== current.id)
    removePage(current.id)
    setCurrentId(rest[0]?.id)
    setEditorKey((k) => k + 1)
  }, [status, pages, current, confirm, t, removePage, setCurrentId])

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status !== 'connected') return
    const file = e.target.files?.[0]
    if (!file) return
    file
      .text()
      .then((text) => {
        const newPages: Page[] = []
        parseExport(text, t('newPage')).forEach(({ title, content }) => {
          const page = { id: crypto.randomUUID(), title }
          newPages.push(page)
          addPage(page)
          updateEditor({ id: page.id, content })
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

  // On attend que editorMap soit chargé ET que le slot de la page existe
  // avant de monter l'éditeur. Ça garantit que LocalInitContentPlugin reçoit
  // le bon texte initial dès le premier rendu (pas de loop isReady/autosave).
  const editorReady = Boolean(current && editorMap?.has(current.id))
  const initialText = (current && editorMap?.get(current.id)) || ''

  // Callback stable pour AutoSavePlugin (évite de re-register le listener à chaque rendu)
  const handleAutoSave = useCallback((txt: string) => {
    if (!current || status !== 'connected') return
    updateEditor({ id: current.id, content: txt })
  }, [current, status, updateEditor])

  // Config Lexical simple — pas de liveblocksConfig car LiveblocksPlugin crée
  // sa propre boucle de sync qui conflicte avec AutoSavePlugin + notre editor LiveMap.
  // Le partage se fait via l'editor LiveMap (contenu mis à jour à chaque frappe).
  const editorConfig = {
    namespace: `session-summary-live-${current ? current.id : 'global'}`,
    nodes: [] as [],
    onError: (e: Error) =>
      pushLog('Lexical error (live): ' + (e?.message ?? String(e))),
  }

  return (
    <>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={confirmOk}
        onCancel={confirmNo}
      />
      <SummaryView
        pages={pages || []}
        current={current}
        onSwitch={(id) => {
          if (status !== 'connected') return
          setCurrentId(id)
          setEditorKey((k) => k + 1)
        }}
        onNewPage={() => createPage(t('newPage'))}
        onTitle={handleTitleChange}
        onDelete={handleDelete}
        onImport={handleImport}
        onExport={() => pages && downloadExport(pages, (id) => editorMap?.get(id) || '')}
        fileInputRef={fileInputRef}
      >
        {current && editorReady ? (
          <LexicalComposer key={editorKey} initialConfig={editorConfig}>
            <HistoryPlugin />
            <PageText />
            {/* LocalInitContentPlugin : s'exécute UNE FOIS au montage (deps=[]),
                pas de dépendance à useIsEditorReady → pas de boucle */}
            <LocalInitContentPlugin text={initialText} />
            <RemoteSyncPlugin text={initialText} />
            <AutoSavePlugin onChange={handleAutoSave} />
          </LexicalComposer>
        ) : (
          <div className="flex h-full items-center justify-center gap-2 p-6 text-sm text-ink/40">
            <span className="animate-pulse">⟳</span> {t('summarySyncing')}
          </div>
        )}
      </SummaryView>
    </>
  )
}

// ===================== Composant principal =====================
const SessionSummary: FC<Props> = ({ onClose, collapseButton }) => {
  const t = useT()
  const [isLocal, setIsLocal] = useState(false)

  // Journal de synchro : seulement dans la console, pour le débogage.
  const pushLog = useCallback((msg: string) => {
    console.warn('[Résumé]', msg)
  }, [])

  const tripToLocal = useCallback(
    (reason?: string) => {
      if (!isLocal) {
        pushLog('Bascule en mode local' + (reason ? ` (${reason})` : ''))
        setIsLocal(true)
      }
    },
    [isLocal, pushLog],
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-fadeIn">
      <div className="flex items-center gap-1.5 border-b border-[var(--c-panel-line)] px-3 py-2.5" style={{ background: 'var(--c-panel-head)' }}>
        <button
          onClick={onClose}
          className="ui-btn ui-btn-ghost ui-btn-icon"
          aria-label={t('summaryBackToChat')}
          title={t('summaryBackToChat')}
        >
          <ArrowLeft size={16} />
        </button>
        <BookOpen size={16} className="shrink-0 text-amber-300" />
        <h2 className="truncate text-sm font-semibold">{t('sessionSummary')}</h2>
        <span className="ml-auto flex items-center gap-1">
          {isLocal && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-200" title={t('summaryOfflineHint')}>
              {t('summaryOffline')}
            </span>
          )}
          {collapseButton}
        </span>
      </div>

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
          <LiveSummary pushLog={pushLog} tripToLocal={tripToLocal} />
        </ErrorBoundary>
      ) : (
        <LocalSummary pushLog={pushLog} />
      )}
    </div>
  )
}

export default SessionSummary

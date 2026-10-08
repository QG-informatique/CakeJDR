// Résumé de la partie : des pages de texte partagées par toute la table.
// Plusieurs joueurs peuvent écrire en même temps sur la même page : le texte
// est un document Yjs que Liveblocks fusionne lettre par lettre. Si la
// connexion échoue, il reste utilisable et se garde sur cet appareil.

'use client'

import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useT } from '@/lib/useT'
import { ArrowLeft, BookOpen, Download, Plus, Trash2, Upload } from 'lucide-react'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/lib/useConfirm'

// ====== Liveblocks (collaboratif) ======
import { useStorage, useMutation, useStatus, useRoom } from '@liveblocks/react'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import type { LsonObject } from '@liveblocks/client'
import { getYjsProviderForRoom, type LiveblocksYjsProvider } from '@liveblocks/yjs'
import * as Y from 'yjs'

// ====== Lexical ======
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
// Le LiveblocksPlugin officiel ne gère qu'un document par salle, pas une page
// par onglet : on relie nous-mêmes chaque page à un texte Yjs (YjsPagePlugin).
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  REDO_COMMAND,
  UNDO_COMMAND,
  type LexicalNode,
  type PointType,
} from 'lexical'

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

// ===================== Co-édition : une page = un texte Yjs =====================

/** Origine des écritures faites par la frappe locale (pour l'annulation). */
const LOCAL_ORIGIN = 'summary-local'
/** Délai avant de recopier le texte dans `editor` (export, ancienne version). */
const MIRROR_MS = 600

const yTextOf = (doc: Y.Doc, pageId: string) => doc.getText(`summary:${pageId}`)
/**
 * Pages dont le texte vit déjà dans Yjs. Les autres n'ont que leur copie dans
 * `editor` (pages écrites avant la co-édition, ou importées) : elle est versée
 * dans Yjs à la première ouverture.
 */
const yMovedOf = (doc: Y.Doc) => doc.getMap<boolean>('summaryMoved')

/** Texte d'une page pour l'export : Yjs s'il l'a déjà, sinon l'ancienne copie. */
function pageText(doc: Y.Doc | null, pageId: string, legacy: ReadonlyMap<string, string> | null) {
  if (doc && yMovedOf(doc).get(pageId)) return yTextOf(doc, pageId).toString()
  return legacy?.get(pageId) ?? ''
}

/** Place d'un point Lexical dans le texte (paragraphes séparés par « \n »). */
function $offsetOf(point: PointType): number {
  const node = point.getNode()
  const blocks = $getRoot().getChildren()
  const before = (list: LexicalNode[]) =>
    list.reduce((n, c) => n + c.getTextContentSize(), 0)
  const blockStart = (i: number) =>
    blocks.slice(0, i).reduce((n, b) => n + b.getTextContentSize() + 1, 0)

  if (node.is($getRoot())) {
    return point.offset < blocks.length
      ? blockStart(point.offset)
      : Math.max(0, blockStart(blocks.length) - 1)
  }
  const top = node.getTopLevelElementOrThrow()
  const start = blockStart(blocks.findIndex((b) => b.is(top)))
  const inside = node.is(top) ? 0 : before(node.getPreviousSiblings())
  if ($isTextNode(node)) return start + inside + point.offset
  if ($isElementNode(node)) return start + inside + before(node.getChildren().slice(0, point.offset))
  return start + inside
}

/** Pose un point Lexical à une place du texte. */
function $setPoint(point: PointType, offset: number) {
  const blocks = $getRoot().getChildren()
  let rest = offset
  for (const block of blocks) {
    const size = block.getTextContentSize()
    if (rest <= size && $isElementNode(block)) {
      const kids = block.getChildren()
      for (let i = 0; i < kids.length; i++) {
        const kid = kids[i]!
        const s = kid.getTextContentSize()
        if ($isTextNode(kid) && rest <= s) return point.set(kid.getKey(), rest, 'text')
        if (rest === 0) return point.set(block.getKey(), i, 'element')
        rest -= s
      }
      return point.set(block.getKey(), kids.length, 'element')
    }
    rest -= size + 1
  }
  const last = blocks[blocks.length - 1]
  if (last && $isElementNode(last)) point.set(last.getKey(), last.getChildrenSize(), 'element')
}

/** Décale une place du texte selon une modification venue d'ailleurs. */
function shiftOffset(offset: number, delta: Y.YTextEvent['delta']) {
  let at = 0
  let out = offset
  for (const op of delta) {
    if (op.retain) at += op.retain
    else if (typeof op.insert === 'string') {
      if (at < out) out += op.insert.length
      at += op.insert.length
    } else if (op.delete) {
      if (at < out) out -= Math.min(op.delete, out - at)
    }
  }
  return out
}

/**
 * Remet le texte dans l'éditeur en ne touchant que les paragraphes changés :
 * celui qu'on est en train d'écrire n'est pas recréé si un autre joueur écrit
 * plus bas.
 */
function $applyLines(text: string) {
  const root = $getRoot()
  const blocks = root.getChildren()
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    const block = blocks[i]
    if (block && $isParagraphNode(block)) {
      if (block.getTextContent() === line) return
      block.clear()
      if (line) block.append($createTextNode(line))
      return
    }
    const p = $createParagraphNode()
    if (line) p.append($createTextNode(line))
    if (block) block.replace(p)
    else root.append(p)
  })
  blocks.slice(lines.length).forEach((b) => b.remove())
}

/**
 * Relie l'éditeur d'une page à son texte Yjs.
 * - La frappe locale est envoyée comme une petite modification (ce qui change
 *   entre l'ancien et le nouveau texte), pas comme le texte entier : deux
 *   joueurs qui écrivent en même temps gardent tous les deux leurs mots.
 * - Ce qu'écrivent les autres arrive aussitôt, et le curseur reste au même
 *   endroit du texte.
 * - Annuler (Ctrl+Z) ne défait que ce qu'on a écrit soi-même.
 */
function YjsPagePlugin({
  doc,
  pageId,
  legacyText,
  onMirror,
}: {
  doc: Y.Doc
  pageId: string
  /** Copie d'avant la co-édition, versée dans Yjs si la page n'y est pas encore. */
  legacyText: string
  /** Recopie du texte dans `editor`, pour l'export et les anciennes versions. */
  onMirror: (pageId: string, text: string) => void
}) {
  const [editor] = useLexicalComposerContext()
  const mirrorRef = useRef(onMirror)
  useEffect(() => {
    mirrorRef.current = onMirror
  }, [onMirror])

  useEffect(() => {
    const ytext = yTextOf(doc, pageId)
    const moved = yMovedOf(doc)
    // Deux joueurs qui ouvriraient la même ancienne page à la même seconde
    // pourraient la verser deux fois ; c'est rare et se corrige à la main.
    if (!moved.get(pageId)) {
      doc.transact(() => {
        if (ytext.length === 0 && legacyText) ytext.insert(0, legacyText)
        moved.set(pageId, true)
      }, LOCAL_ORIGIN)
    }

    editor.update(() => $applyLines(ytext.toString()), { tag: REMOTE_TAG, discrete: true })

    const undo = new Y.UndoManager(ytext, { trackedOrigins: new Set([LOCAL_ORIGIN]), captureTimeout: 600 })

    let mirrorTimer: number | undefined
    const flushMirror = () => {
      window.clearTimeout(mirrorTimer)
      mirrorTimer = undefined
      mirrorRef.current(pageId, ytext.toString())
    }

    const stopLocal = editor.registerUpdateListener((update) => {
      if (!isLocalTextChange(update)) return
      const next = update.editorState.read($readText)
      const prev = ytext.toString()
      if (next === prev) return
      // Ce qui change : on garde le début et la fin communs.
      let start = 0
      while (start < prev.length && start < next.length && prev[start] === next[start]) start++
      let end = 0
      while (
        end < prev.length - start &&
        end < next.length - start &&
        prev[prev.length - 1 - end] === next[next.length - 1 - end]
      ) end++
      doc.transact(() => {
        const removed = prev.length - start - end
        if (removed > 0) ytext.delete(start, removed)
        const added = next.slice(start, next.length - end)
        if (added) ytext.insert(start, added)
      }, LOCAL_ORIGIN)
    })

    const observer = (event: Y.YTextEvent, tx: Y.Transaction) => {
      if (tx.local) {
        window.clearTimeout(mirrorTimer)
        mirrorTimer = window.setTimeout(flushMirror, MIRROR_MS)
      }
      if (tx.origin === LOCAL_ORIGIN) return
      const root = editor.getRootElement()
      const focused = root !== null && root.contains(document.activeElement)
      // `discrete` : appliqué tout de suite, pour que la frappe suivante parte
      // bien du texte qui contient déjà les mots des autres.
      editor.update(
        () => {
          const sel = $getSelection()
          const marks =
            focused && $isRangeSelection(sel)
              ? [$offsetOf(sel.anchor), $offsetOf(sel.focus)].map((o) => shiftOffset(o, event.delta))
              : null
          $applyLines(ytext.toString())
          if (!marks) return
          const next = $createRangeSelection()
          $setPoint(next.anchor, marks[0]!)
          $setPoint(next.focus, marks[1]!)
          $setSelection(next)
        },
        { tag: REMOTE_TAG, discrete: true },
      )
    }
    ytext.observe(observer)

    const stopUndo = editor.registerCommand(UNDO_COMMAND, () => (undo.undo(), true), COMMAND_PRIORITY_EDITOR)
    const stopRedo = editor.registerCommand(REDO_COMMAND, () => (undo.redo(), true), COMMAND_PRIORITY_EDITOR)

    return () => {
      stopLocal()
      stopUndo()
      stopRedo()
      ytext.unobserve(observer)
      undo.destroy()
      if (mirrorTimer !== undefined) flushMirror()
    }
    // La copie d'avant ne sert qu'à la première ouverture de la page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, doc, pageId])

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

  // Texte des pages : document Yjs de la salle, gardé par Liveblocks.
  const room = useRoom()
  // Créé après le rendu : le créer pendant réveille d'autres composants de la salle.
  const [provider, setProvider] = useState<LiveblocksYjsProvider | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- branché une fois la salle prête
    setProvider(getYjsProviderForRoom(room))
  }, [room])
  const yjsSynced = useSyncExternalStore(
    useCallback(
      (cb: () => void) => {
        provider?.on('sync', cb)
        return () => provider?.off('sync', cb)
      },
      [provider],
    ),
    () => provider?.synced ?? false,
    () => false,
  )
  const ydoc = provider && yjsSynced ? provider.getYDoc() : null

  // Chacun lit la page de son choix : quand un joueur change d'onglet, les
  // autres restent sur la leur. La page partagée (`currentId`) sert seulement
  // de page d'ouverture, la dernière créée ou ouverte.
  const [myPageId, setMyPageId] = useState<string | null>(null)

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

  const current =
    pages?.find((p) => p.id === myPageId) ?? pages?.find((p) => p.id === currentId)
  // La page d'ouverture devient la sienne : si un autre joueur crée une page,
  // on n'y est pas emmené en pleine phrase.
  if (current && myPageId !== current.id && !pages?.some((p) => p.id === myPageId)) {
    setMyPageId(current.id)
  }

  const openPage = (id: string) => {
    setMyPageId(id)
    setCurrentId(id)
    setEditorKey((k) => k + 1)
  }

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
    openPage(newPage.id)
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
    // Le texte de la page supprimée ne sert plus à personne.
    if (ydoc) {
      const ytext = yTextOf(ydoc, current.id)
      ydoc.transact(() => {
        ytext.delete(0, ytext.length)
        yMovedOf(ydoc).delete(current.id)
      })
    }
    const next = rest[0]?.id
    setMyPageId(next ?? null)
    setCurrentId(next)
    setEditorKey((k) => k + 1)
  }, [status, pages, current, confirm, t, removePage, setCurrentId, ydoc])

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
        if (newPages.length > 0) openPage(newPages[0]!.id)
        if (fileInputRef.current) fileInputRef.current.value = ''
      })
      .catch((err) => {
        pushLog('Import live: ' + (err?.message ?? String(err)))
      })
  }

  // On attend le document Yjs et la liste des textes (`editor`) avant de
  // monter l'éditeur : il démarre directement avec le bon texte.
  const editorReady = Boolean(current && ydoc && editorMap)
  const legacyText = (current && editorMap?.get(current.id)) || ''

  const handleMirror = useCallback(
    (id: string, txt: string) => updateEditor({ id, content: txt }),
    [updateEditor],
  )

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
          openPage(id)
        }}
        onNewPage={() => createPage(t('newPage'))}
        onTitle={handleTitleChange}
        onDelete={handleDelete}
        onImport={handleImport}
        onExport={() => pages && downloadExport(pages, (id) => pageText(ydoc, id, editorMap))}
        fileInputRef={fileInputRef}
      >
        {current && ydoc && editorReady ? (
          <LexicalComposer key={`${editorKey}-${current.id}`} initialConfig={editorConfig}>
            <PageText />
            <YjsPagePlugin
              doc={ydoc}
              pageId={current.id}
              legacyText={legacyText}
              onMirror={handleMirror}
            />
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

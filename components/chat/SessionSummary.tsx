'use client'
import { FC, useEffect, useState, useRef, useCallback } from 'react'
import { useT } from '@/lib/useT'
import { useStorage, useMutation, useRoom } from '@liveblocks/react'
import { LiveMap } from '@liveblocks/client'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import {
  LiveblocksPlugin,
  Toolbar,
  liveblocksConfig,
} from '@liveblocks/react-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical'
import type { LexicalEditor } from 'lexical'

interface Page {
  id: string
  title: string
}

interface Props {
  onClose: () => void
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

const SessionSummary: FC<Props> = ({ onClose }) => {
  const summary = useStorage((root) => root.summary)
  const rawEditor = useStorage((root) => root.editor)
  const editorMap =
    rawEditor instanceof LiveMap ? (rawEditor as LiveMap<string, string>) : null
  const pages = summary?.acts as Page[] | undefined
  const [currentId, setCurrentId] = useState<string>('')
  const [editorKey, setEditorKey] = useState(0)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileBtnRef = useRef<HTMLButtonElement>(null)
  const t = useT()
  const room = useRoom()

  const updatePages = useMutation(({ storage }, acts: Page[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(storage.get('summary') as any).update({ acts })
  }, [])

  const deletePage = useMutation(({ storage }, id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summary = storage.get('summary') as any
    const acts = (summary.get('acts') as Page[]) || []
    summary.update({ acts: acts.filter((p: Page) => p.id !== id) })
    // remove content from editor map if using new structure
    const editor = storage.get('editor')
    if (editor instanceof LiveMap) {
      editor.delete(id)
    } else {
      storage.set('editor', new LiveMap())
    }
  }, [])

  const updateEditor = useMutation(
    ({ storage }, data: { id: string; content: string }) => {
      let editor = storage.get('editor')
      if (!(editor instanceof LiveMap)) {
        const map = new LiveMap<string, string>()
        if (typeof editor === 'string' && data.id) {
          map.set(data.id, editor)
        }
        storage.set('editor', map)
        editor = map
      }
      ;(editor as LiveMap<string, string>).set(data.id, data.content)
    },
    [],
  )

  const handleTitleChange = (title: string) => {
    if (!pages || !current) return
    const updatedPages = pages.map((p) =>
      p.id === current.id ? { ...p, title } : p,
    )
    updatePages(updatedPages)
  }

  const createPage = useCallback(
    (title: string) => {
      const newPage = { id: crypto.randomUUID(), title }
      updatePages([...(pages || []), newPage])
      updateEditor({ id: newPage.id, content: '' })
      setCurrentId(newPage.id)
      setEditorKey((k) => k + 1)
    },
    [pages, updatePages, updateEditor],
  )

  useEffect(() => {
    if (!showFileMenu) return
    const handle = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !fileBtnRef.current?.contains(e.target as Node)
      ) {
        setShowFileMenu(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showFileMenu])

  useEffect(() => {
    if (!pages) return
    if (pages.length === 0) {
      const title = prompt(t('pageNamePrompt'))?.trim() || t('newPage')
      createPage(title)
    } else if (!currentId) {
      setCurrentId(pages[0]!.id)
    }
  }, [pages, currentId, updatePages, updateEditor, createPage, t])

  const current = pages?.find((p) => p.id === currentId)

  useEffect(() => {
    if (!current) return
    if (editorMap instanceof LiveMap) {
      if (!editorMap.has(current.id)) {
        updateEditor({ id: current.id, content: '' })
      }
    } else {
      updateEditor({ id: current.id, content: '' })
    }
  }, [current, editorMap, updateEditor])

  const handleNewPage = () => {
    const title = prompt(t('pageNamePrompt'))?.trim() || t('newPage')
    createPage(title)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    file.text().then((text) => {
      const parts = text.split(/=== Page: /).slice(1)
      const newPages: Page[] = []
      parts.forEach((part) => {
        const [titleLine = '', ...contentLines] = part.split('\n')
        const title = titleLine.replace(/===$/, '').trim()
        const content = contentLines.join('\n').trim()
        const id = crypto.randomUUID()
        newPages.push({ id, title })
        updateEditor({ id, content })
      })
      if (newPages.length > 0) {
        updatePages(newPages)
        setCurrentId(newPages[0]!.id)
        setEditorKey((k) => k + 1)
      }
      setShowFileMenu(false)
    })
  }

  const handleExport = () => {
    if (!pages) return
    const txt = pages
      .map(
        (p) =>
          `=== Page: ${p.title} ===\n${editorMap instanceof LiveMap ? editorMap.get(p.id) || '' : ''}\n`,
      )
      .join('\n')
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.txt'
    a.click()
    URL.revokeObjectURL(url)
    setShowFileMenu(false)
  }

  const handleDelete = () => {
    if (!pages || !current) return
    if (!confirm(t('deletePageConfirm'))) return
    const rest = pages.filter((p) => p.id !== current.id)
    if (rest.length === 0) {
      alert(t('lastPageDeleteError'))
      return
    }
    deletePage(current.id)
    setCurrentId(rest[0]!.id)
    setEditorKey((k) => k + 1)
  }

  const [initialText, setInitialText] = useState('')

  useEffect(() => {
    if (!current) return
    const text =
      editorMap instanceof LiveMap ? editorMap.get(current.id) || '' : ''
    setInitialText(text)
    setEditorKey((k) => k + 1)
  }, [current, editorMap])

  const editorConfig = {
    ...liveblocksConfig({
      namespace: `session-summary-${room.id}-${current ? current.id : 'global'}`,
      onError: console.error,
    }),
    editorState: (editor: LexicalEditor) => {
      if (initialText) {
        editor.update(() => {
          const root = $getRoot()
          root.clear()
          initialText.split('\n').forEach((line) => {
            const p = $createParagraphNode()
            p.append($createTextNode(line))
            root.append(p)
          })
        })
      }
    },
  }

  return (
    <div
      className="absolute inset-0 bg-black/35 backdrop-blur-[3px] border border-white/10 rounded-2xl shadow-2xl flex flex-col h-full w-full z-20 p-3 animate-fadeIn overflow-visible"
      style={{ minHeight: 0 }}
    >
      <div className="flex items-center gap-2 mb-3 relative justify-end">
        <button
          onClick={handleNewPage}
          className="bg-black/40 text-white px-2 py-1 rounded text-sm"
        >
          +
        </button>
        <select
          value={currentId}
          onChange={(e) => {
            setCurrentId(e.target.value)
            setEditorKey((k) => k + 1)
          }}
          className="bg-black/40 text-white rounded px-2 py-1 text-sm w-32"
        >
          {pages?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleDelete}
          className="bg-black/40 text-white px-2 py-1 rounded text-sm"
        >
          🗑️
        </button>
        <div className="relative">
          <button
            ref={fileBtnRef}
            onClick={() => setShowFileMenu((m) => !m)}
            className="bg-black/40 text-white px-2 py-1 rounded text-sm"
          >
            📁
          </button>
          {showFileMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-1 z-40 bg-black/80 rounded shadow p-1 w-32 flex flex-col"
            >
              <label className="px-2 py-1 hover:bg-white/10 cursor-pointer text-sm">
                {t('importBtn')}
                <input
                  type="file"
                  accept="text/plain"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={handleExport}
                className="text-left px-2 py-1 hover:bg-white/10 text-sm"
              >
                {t('exportBtn')}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-red-500 text-xl"
        >
          ✕
        </button>
      </div>
      {current && (
        <LexicalComposer key={editorKey} initialConfig={editorConfig}>
          <Toolbar className="mb-2">
            <Toolbar.SectionInline />
          </Toolbar>
          <input
            value={current.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-center font-semibold mb-2 bg-transparent outline-none w-full"
          />
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="flex-1 min-h-0 p-2 bg-black/20 rounded text-white outline-none" />
            }
            placeholder={<div>{t('startWriting')}</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <LiveblocksPlugin />
          <AutoSavePlugin
            onChange={(txt) => {
              updateEditor({ id: current.id, content: txt })
            }}
          />
        </LexicalComposer>
      )}
    </div>
  )
}

export default SessionSummary

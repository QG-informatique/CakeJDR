'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Cloud, Download, Upload, Trash2, RefreshCw } from 'lucide-react'
import { useT } from '@/lib/useT'
import {
  type Character as CloudCharacter,
  buildCharacterKey,
  normalizeCharacter,
} from '@/types/character'

type CloudEntry = {
  pathname: string
  size?: number
  uploadedAt?: string
  downloadUrl?: string
  url?: string
}

function slug(str: string) {
  return String(str || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '_')
    .replace(/^_|_$/g, '')
}

interface Props {
  open: boolean
  onClose: () => void
  roomId: string | null
  localChars: CloudCharacter[]
  onImported: (char: CloudCharacter) => void
}

export default function CharacterCloudModal({
  open,
  onClose,
  roomId,
  localChars,
  onImported,
}: Props) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<CloudEntry[]>([])
  const [uploadId, setUploadId] = useState<string>('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const prefix = useMemo(() => `FichePerso/${roomId || 'global'}_`, [roomId])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/blob?prefix=${encodeURIComponent(prefix)}`)
      const data = await res.json()
      const blobs = Array.isArray(data?.files?.blobs) ? data.files.blobs : []
      setEntries(blobs as CloudEntry[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'List failed')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [prefix])

  useEffect(() => {
    if (!open) return
    void refresh()
  }, [open, refresh])

  const uploadable = useMemo(
    () =>
      localChars.map((c) => ({
        key: buildCharacterKey(c),
        label: `${c.nom || 'sans_nom'} @ ${c.owner} #${String(c.id)}`,
      })),
    [localChars],
  )

  async function handleImport(pathname: string) {
    try {
      setBusyAction(`import:${pathname}`)
      const res = await fetch(`/api/blob?prefix=${encodeURIComponent(pathname)}`)
      const data = await res.json()
      const item = (data?.files?.blobs || []).find(
        (b: CloudEntry) => b.pathname === pathname,
      ) as CloudEntry | undefined
      if (!item) throw new Error('Not found')
      const url = item.downloadUrl || item.url
      if (!url) throw new Error('No URL available')
      const txt = await fetch(url).then((r) => r.text())
      const obj = JSON.parse(txt)
      if (!obj || typeof obj !== 'object') throw new Error('Invalid file')
      onImported(normalizeCharacter(obj))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleUpload() {
    const target = localChars.find((c) => buildCharacterKey(c) === uploadId)
    if (!target) return
    const slugName = slug(target.nom || 'sans_nom')
    const filename = `FichePerso/${roomId || 'global'}_${target.owner}_${String(
      target.id,
    )}_${slugName}.json`
    try {
      setBusyAction(`upload:${filename}`)
      const updated = normalizeCharacter(
        { ...target, updatedAt: Date.now() },
        target.owner,
      )
      const res = await fetch(
        `/api/blob?filename=${encodeURIComponent(filename)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        },
      )
      if (!res.ok) throw new Error('Upload failed')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDelete(pathname: string) {
    if (!confirm('Delete this cloud file?')) return
    try {
      setBusyAction(`delete:${pathname}`)
      const res = await fetch(
        `/api/blob?filename=${encodeURIComponent(pathname)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error('Delete failed')
      setEntries((prev) => prev.filter((e) => e.pathname !== pathname))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusyAction(null)
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-[720px] max-w-full max-h-[80vh] overflow-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold inline-flex items-center gap-2">
              <Cloud size={18} className="text-blue-300" /> Cloud
              <span className="text-xs text-white/50">{prefix}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white/80 hover:text-white"
                onClick={(e) => {
                  e.preventDefault()
                  refresh()
                }}
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                className="px-2 py-1 rounded bg-black/40 border border-white/10 text-white/80 hover:text-white"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Upload section */}
          <div className="mb-4 p-3 rounded-xl border border-white/10 bg-black/30">
            <div className="flex items-center gap-2">
              <select
                value={uploadId}
                onChange={(e) => setUploadId(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-gray-800 border border-white/20"
              >
                <option value="">-- {t('select')} --</option>
                {uploadable.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                disabled={!uploadId || !!busyAction}
                onClick={handleUpload}
              >
                <Upload size={16} className="inline -mt-0.5 mr-1" /> Upload
              </button>
            </div>
          </div>

          {/* List section */}
          <div className="space-y-2">
            {loading && <div className="text-white/70 text-sm">Loading...</div>}
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {!loading && !error && entries.length === 0 && (
              <div className="text-white/60 text-sm italic">{t('noFile')}</div>
            )}
            {!loading && !error && entries.length > 0 && (
              <ul className="divide-y divide-white/10">
                {entries.map((e) => (
                  <li
                    key={e.pathname}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="font-mono text-xs truncate">
                        {e.pathname.replace('FichePerso/', '')}
                      </div>
                      <div className="text-[11px] text-white/50">
                        {e.size ? `${(e.size / 1024).toFixed(1)} KB` : ''}{' '}
                        {e.uploadedAt
                          ? ` · ${new Date(e.uploadedAt).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleImport(e.pathname)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                        disabled={!!busyAction}
                        title="Import to local"
                      >
                        <Download
                          size={14}
                          className="inline -mt-0.5 mr-1"
                        />{' '}
                        Import
                      </button>
                      <button
                        onClick={() => handleDelete(e.pathname)}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50"
                        disabled={!!busyAction}
                        title="Delete from cloud"
                      >
                        <Trash2 size={14} className="inline -mt-0.5 mr-1" />{' '}
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

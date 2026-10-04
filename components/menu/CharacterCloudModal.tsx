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
import {
  deleteAccountCharacter,
  listAccountCharacters,
  saveAccountCharacter,
} from '@/lib/charactersApi'

/**
 * Fiches enregistrées sur le compte du joueur.
 *
 * Elles vivaient dans Vercel Blob, sous un préfixe commun : n'importe qui
 * listait, importait ou supprimait les fiches de tout le monde. Elles sont
 * désormais en base, rattachées au compte, et chacun ne voit que les siennes.
 */

interface Props {
  open: boolean
  onClose: () => void
  /** Conservé pour compatibilité : les fiches ne dépendent plus de la table. */
  roomId?: string | null
  localChars: CloudCharacter[]
  onImported: (char: CloudCharacter) => void
}

export default function CharacterCloudModal({
  open,
  onClose,
  localChars,
  onImported,
}: Props) {
  const t = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<CloudCharacter[]>([])
  const [uploadId, setUploadId] = useState<string>('')
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEntries(await listAccountCharacters())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'List failed')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void refresh()
  }, [open, refresh])

  const uploadable = useMemo(
    () =>
      localChars.map((c) => ({
        key: buildCharacterKey(c),
        label: `${c.nom || 'sans_nom'} #${String(c.id)}`,
      })),
    [localChars],
  )

  function handleImport(char: CloudCharacter) {
    onImported(normalizeCharacter(char))
  }

  async function handleUpload() {
    const target = localChars.find((c) => buildCharacterKey(c) === uploadId)
    if (!target) return
    try {
      setBusyAction(`upload:${target.id}`)
      await saveAccountCharacter(
        normalizeCharacter({ ...target, updatedAt: Date.now() }, target.owner),
      )
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDelete(char: CloudCharacter) {
    if (!confirm(t('cloudDeleteConfirm'))) return
    try {
      setBusyAction(`delete:${char.id}`)
      await deleteAccountCharacter(String(char.id))
      setEntries((prev) => prev.filter((e) => e.id !== char.id))
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
          className="bg-shade/80 text-ink rounded-2xl border border-ink/10 shadow-2xl backdrop-blur-md p-5 w-[720px] max-w-full max-h-[80vh] overflow-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold inline-flex items-center gap-2">
              <Cloud size={18} className="text-accent-soft" /> Cloud
              <span className="text-xs font-normal text-ink/50">{t('cloudAccountHint')}</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded bg-shade/40 border border-ink/10 text-ink/80 hover:text-ink"
                onClick={(e) => {
                  e.preventDefault()
                  void refresh()
                }}
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw size={16} />
              </button>
              <button
                className="px-2 py-1 rounded bg-shade/40 border border-ink/10 text-ink/80 hover:text-ink"
                onClick={onClose}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Envoi d'une fiche locale vers le compte */}
          <div className="mb-4 p-3 rounded-xl border border-ink/10 bg-shade/30">
            <div className="flex items-center gap-2">
              <select
                value={uploadId}
                onChange={(e) => setUploadId(e.target.value)}
                aria-label={t('cloudUpload')}
                className="flex-1 px-2 py-1 rounded bg-surface border border-ink/20"
              >
                <option value="">-- {t('select')} --</option>
                {uploadable.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                className="px-3 py-1 rounded bg-accent hover:bg-accent-hover text-on-accent disabled:opacity-50"
                disabled={!uploadId || !!busyAction}
                onClick={handleUpload}
              >
                <Upload size={16} className="inline -mt-0.5 mr-1" /> {t('cloudUpload')}
              </button>
            </div>
          </div>

          {/* Fiches du compte */}
          <div className="space-y-2">
            {loading && <div className="text-ink/70 text-sm">{t('cloudLoading')}</div>}
            {error && <div className="text-red-400 text-sm">{error}</div>}
            {!loading && !error && entries.length === 0 && (
              <div className="text-ink/60 text-sm italic">{t('noFile')}</div>
            )}
            {!loading && !error && entries.length > 0 && (
              <ul className="divide-y divide-ink/10">
                {entries.map((e) => (
                  <li
                    key={String(e.id)}
                    className="py-2 flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="text-sm font-semibold truncate">
                        {e.nom || e.name || 'sans_nom'}
                      </div>
                      <div className="text-[11px] text-ink/50">
                        #{String(e.id)}
                        {typeof e.updatedAt === 'number'
                          ? ` · ${new Date(e.updatedAt).toLocaleString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleImport(e)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-50"
                        disabled={!!busyAction}
                      >
                        <Download size={14} className="inline -mt-0.5 mr-1" />{' '}
                        {t('cloudImport')}
                      </button>
                      <button
                        onClick={() => handleDelete(e)}
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50"
                        disabled={!!busyAction}
                      >
                        <Trash2 size={14} className="inline -mt-0.5 mr-1" />{' '}
                        {t('delete')}
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

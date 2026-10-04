'use client'

import { useRef, useState } from 'react'
import { Check, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import {
  BOARD_LIBRARY,
  LIBRARY_DRAG_TYPE,
  libraryUrl,
  uploadThumbUrl,
  type BoardEntry,
  type LibraryUpload,
} from '@/lib/library'

const OLD_TAB = 'anciennes'

type Tile = {
  key: string
  entry: BoardEntry
  thumb: string
  label: string
  upload?: LibraryUpload
}

/**
 * Bibliothèque du plateau. Un clic pose l'image, un autre la retire ; une
 * carte devient le fond du plateau. Le « + » de chaque catégorie envoie une
 * image pour toute la table.
 */
export default function LibraryPanel({
  uploads,
  onBoard,
  mapUrl,
  oldImages,
  uploading,
  canDelete,
  onToggle,
  onUpload,
  onDelete,
  onRemoveOld,
  onClose,
}: {
  uploads: LibraryUpload[]
  /** Adresses des pions et rencontres posés sur le plateau. */
  onBoard: Set<string>
  /** Carte en fond du plateau, s'il y en a une. */
  mapUrl: string | null
  /** Images posées avant la bibliothèque, qu'on peut seulement retirer. */
  oldImages: { id: string; url: string }[]
  /** Envois en cours, par catégorie. */
  uploading: Record<string, number>
  canDelete: (upload: LibraryUpload) => boolean
  onToggle: (entry: BoardEntry) => void
  onUpload: (categoryId: string, file: File) => void
  onDelete: (upload: LibraryUpload) => void
  onRemoveOld: (id: string) => void
  onClose: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const l = lang === 'fr' ? 'fr' : 'en'
  const [categoryId, setCategoryId] = useState(BOARD_LIBRARY[0]!.id)
  const fileRef = useRef<HTMLInputElement>(null)
  const showOld = categoryId === OLD_TAB && oldImages.length > 0
  const category = BOARD_LIBRARY.find((c) => c.id === categoryId) ?? BOARD_LIBRARY[0]!

  const tiles: Tile[] = [
    ...category.items.map((item) => ({
      key: `static-${item.id}`,
      entry: { url: libraryUrl(category.id, item.id), categoryId: category.id, width: item.width, height: item.height },
      thumb: libraryUrl(category.id, item.id, true),
      label: item.label[l],
    })),
    ...uploads
      .filter((u) => u.category === category.id)
      .map((u) => ({
        key: u.id,
        entry: { url: u.url, categoryId: u.category, width: u.width, height: u.height },
        thumb: uploadThumbUrl(u.url),
        label: u.ownerName ? `${t('libraryUploadedBy')} ${u.ownerName}` : '',
        upload: u,
      })),
  ]
  const pending = uploading[category.id] ?? 0

  return (
    <div
      className="ui-panel pointer-events-auto flex max-h-full w-full max-w-[32rem] flex-col gap-2.5 p-3 shadow-lg !backdrop-blur-md"
      style={{ background: 'var(--c-panel-head)' }}
    >
      <div className="flex items-center gap-2">
        <span className="ui-label">{t('library')}</span>
        <span className="min-w-0 truncate text-xs text-ink/55">
          {showOld ? t('libraryOldHint') : category.map ? t('libraryMapHint') : t('libraryHint')}
        </span>
        <button
          onClick={onClose}
          className="ui-btn ui-btn-ghost ui-btn-icon ml-auto !h-7 !min-h-7 !w-7 shrink-0"
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={14} />
        </button>
      </div>

      <div className="ui-seg flex-wrap" role="tablist">
        {BOARD_LIBRARY.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={!showOld && c.id === category.id}
            onClick={() => setCategoryId(c.id)}
          >
            {c.label[l]}
          </button>
        ))}
        {oldImages.length > 0 && (
          <button role="tab" aria-selected={showOld} onClick={() => setCategoryId(OLD_TAB)}>
            {t('libraryOld')} ({oldImages.length})
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.currentTarget.value = ''
          if (file) onUpload(category.id, file)
        }}
      />

      <div className="grid max-h-[22rem] min-h-0 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {showOld ? (
          oldImages.map((img) => (
            <div key={img.id} className="ui-well flex flex-col items-center gap-1 p-1.5">
              <img
                src={uploadThumbUrl(img.url)}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-md object-contain"
              />
              <button onClick={() => onRemoveOld(img.id)} className="ui-btn ui-btn-ghost !min-h-7 w-full !px-1 text-xs">
                <X size={12} /> {t('libraryRemoveFromBoard')}
              </button>
            </div>
          ))
        ) : (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[var(--c-line-strong)] p-1.5 text-center text-[11px] leading-tight text-ink/60 transition hover:border-accent hover:text-ink"
              title={t('libraryAdd')}
            >
              <Plus size={20} />
              {t('libraryAdd')}
            </button>
            {Array.from({ length: pending }, (_, i) => (
              <div
                key={`pending-${i}`}
                className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-[var(--c-panel-line)] text-ink/50"
                aria-label={t('libraryUploading')}
                title={t('libraryUploading')}
              >
                <Loader2 size={20} className="animate-spin" />
              </div>
            ))}
            {tiles.map((tile) => {
              const placed = category.map ? mapUrl === tile.entry.url : onBoard.has(tile.entry.url)
              return (
                <div key={tile.key} className="relative">
                  <button
                    onClick={() => onToggle(tile.entry)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(LIBRARY_DRAG_TYPE, JSON.stringify(tile.entry))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    aria-pressed={placed}
                    className={`ui-well group flex w-full flex-col items-center gap-1 p-1.5 transition hover:!border-accent ${placed ? '!border-accent ring-2 ring-accent' : ''}`}
                    title={tile.label || undefined}
                  >
                    <img
                      src={tile.thumb}
                      alt={tile.label}
                      loading="lazy"
                      draggable={false}
                      className="aspect-square w-full rounded-md object-contain"
                    />
                    <span className="w-full truncate text-center text-[11px] text-ink/70 group-hover:text-ink">
                      {placed ? (category.map ? t('libraryMapActive') : t('libraryOnBoard')) : tile.label || ' '}
                    </span>
                    {placed && (
                      <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
                  {tile.upload && canDelete(tile.upload) && (
                    <button
                      onClick={() => onDelete(tile.upload!)}
                      className="absolute right-1 top-1 rounded-full bg-shade/70 p-1 text-white/90 transition hover:bg-red-600 hover:text-white"
                      aria-label={t('libraryDelete')}
                      title={t('libraryDelete')}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
            {tiles.length === 0 && pending === 0 && (
              <p className="col-span-2 self-center text-xs text-ink/55 sm:col-span-3">{t('libraryEmpty')}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

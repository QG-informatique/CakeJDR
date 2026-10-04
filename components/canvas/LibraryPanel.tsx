'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { LIBRARY, LIBRARY_DRAG_TYPE, libraryUrl, type LibraryPick } from '@/lib/library'

/**
 * Bibliothèque de départ : un clic pose l'image au centre du plateau, un
 * glisser la pose où on la lâche.
 */
export default function LibraryPanel({
  onPick,
  onClose,
}: {
  onPick: (pick: LibraryPick) => void
  onClose: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const [categoryId, setCategoryId] = useState(LIBRARY[0]!.id)
  const category = LIBRARY.find((c) => c.id === categoryId) ?? LIBRARY[0]!

  return (
    <div
      className="ui-panel flex w-[min(30rem,calc(100vw-2rem))] flex-col gap-2.5 p-3 shadow-lg !backdrop-blur-md"
      style={{ background: 'var(--c-panel-head)' }}
    >
      <div className="flex items-center gap-2">
        <span className="ui-label">{t('library')}</span>
        <span className="text-xs text-ink/45">{t('libraryHint')}</span>
        <button
          onClick={onClose}
          className="ui-btn ui-btn-ghost ui-btn-icon ml-auto !h-7 !min-h-7 !w-7"
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={14} />
        </button>
      </div>

      <div className="ui-seg flex-wrap" role="tablist">
        {LIBRARY.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === categoryId}
            onClick={() => setCategoryId(c.id)}
          >
            {c.label[lang === 'fr' ? 'fr' : 'en']}
          </button>
        ))}
      </div>

      <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
        {category.items.map((item) => {
          const label = item.label[lang === 'fr' ? 'fr' : 'en']
          const pick: LibraryPick = { categoryId: category.id, itemId: item.id }
          return (
            <button
              key={item.id}
              onClick={() => onPick(pick)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(LIBRARY_DRAG_TYPE, JSON.stringify(pick))
                e.dataTransfer.effectAllowed = 'copy'
              }}
              className="ui-well group flex flex-col items-center gap-1 p-1.5 transition hover:!border-accent"
              title={label}
            >
              <img
                src={libraryUrl(category.id, item.id, true)}
                alt={label}
                loading="lazy"
                draggable={false}
                className="aspect-square w-full rounded-md object-contain"
              />
              <span className="w-full truncate text-center text-[11px] text-ink/70 group-hover:text-ink">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

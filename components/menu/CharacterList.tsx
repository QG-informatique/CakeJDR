import { FC, RefObject, useMemo } from 'react'
import { Edit2, Trash2, Plus, Upload, Download, Cloud, ScrollText } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useT } from '@/lib/useT'
import { type Character, buildCharacterKey } from '@/types/character'

interface Props {
  filtered: Character[]
  remote: Record<string, Character>
  onDownload: (char: Character) => Promise<number | null | void> | number | null | void
  onUpload: (char: Character) => void
  selectedIdx: number | null
  onSelect: (idx: number) => void
  onEdit: (id: string | number) => void
  onDelete: (id: string | number) => void
  onDeleteCloud: (char: Character) => void
  onNew: () => void
  onImportClick: () => void
  onExport: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenCloud: () => void // FIX: open cloud modal
}

// Petits boutons d'icône des cartes de personnage.
const iconBtn = 'ui-btn ui-btn-ghost ui-btn-icon !h-7 !min-h-7 !w-7'

const CharacterList: FC<Props> = ({
  filtered,
  remote,
  onDownload,
  onUpload,
  selectedIdx,
  onSelect,
  onEdit,
  onDelete,
  onDeleteCloud,
  onNew,
  onImportClick,
  onExport,
  fileInputRef,
  onImportFile,
  onOpenCloud,
}) => {
  const t = useT()
  const remoteMap = useMemo(() => new Map(Object.entries(remote)), [remote])

  return (
    <section className="ui-panel flex flex-col gap-3 p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold select-none">
        <ScrollText size={16} className="text-accent" />
        {t('characterSheets')}
      </h2>

      {(() => {
        const remoteOnly = Object.values(remote).filter(
          (r) =>
            !filtered.some(
              (c) => String(c.id) === String(r.id) && c.owner === r.owner,
            ),
        )
        const all = [...filtered, ...remoteOnly]
        if (all.length === 0) {
          return <p className="text-xs text-ink/65 italic">{t('noSheets')}</p>
        }
        return (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {all.map((ch) => {
                const isSelected =
                  selectedIdx !== null &&
                  filtered.at(selectedIdx)?.id === ch.id &&
                  filtered.at(selectedIdx)?.owner === ch.owner
                const localIdx = filtered.findIndex(
                  (c) => String(c.id) === String(ch.id) && c.owner === ch.owner,
                )
                const local = localIdx !== -1
                const localChar = local ? filtered.at(localIdx) : null
                const cloudChar = remoteMap.get(buildCharacterKey(ch))
                const cloud = !!cloudChar
                const needsDownload =
                  (!local && cloud) ||
                  (local &&
                    cloud &&
                    (cloudChar.updatedAt || 0) > (localChar?.updatedAt || 0))
                const needsUpload =
                  local &&
                  (!cloud ||
                    (localChar?.updatedAt || 0) > (cloudChar?.updatedAt || 0))
                return (
                  <motion.li
                    key={buildCharacterKey(ch)}
                    onClick={async () => {
                      if (local) {
                        onSelect(localIdx)
                      } else {
                        const idx = await onDownload(ch)
                        if (typeof idx === 'number' && idx >= 0) onSelect(idx)
                      }
                    }}
                    className={`ui-well group relative flex min-h-[7.5rem] cursor-pointer flex-col gap-1.5 p-3 transition ${
                      isSelected
                        ? '!border-accent ring-1 ring-accent'
                        : 'hover:!border-[var(--c-line-strong)]'
                    }`}
                    title={ch.nom || t('unnamed')}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate font-semibold leading-tight">
                        {ch.nom || t('unnamed')}
                      </span>
                      {local && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(ch.id)
                            }}
                            className={iconBtn}
                            title={t('edit')}
                            aria-label={t('edit')}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(ch.id)
                            }}
                            className={`${iconBtn} ui-btn-danger`}
                            title={t('delete')}
                            aria-label={t('delete')}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 text-xs text-ink/80">
                      {ch.niveau !== undefined && (
                        <div>
                          <span className="text-ink/45">
                            {t('level')}
                          </span>{' '}
                          {ch.niveau}
                        </div>
                      )}
                      {ch.classe && (
                        <div>
                          <span className="text-ink/45">
                            {t('class')}
                          </span>{' '}
                          {ch.classe}
                        </div>
                      )}
                      {ch.sexe && (
                        <div>
                          <span className="text-ink/45">
                            {t('gender')}
                          </span>{' '}
                          {ch.sexe}
                        </div>
                      )}
                      {ch.race && (
                        <div>
                          <span className="text-ink/45">
                            {t('race')}
                          </span>{' '}
                          {ch.race}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-auto">
                      {cloud && (
                        <Cloud size={14} className="mr-auto text-accent-soft/70" aria-label="Cloud" />
                      )}
                      {needsUpload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                              onUpload(local ? filtered.at(localIdx)! : ch)
                          }}
                          className={iconBtn}
                          title={t('exportToCloud')}
                          aria-label={t('exportToCloud')}
                        >
                          <Upload size={13} />
                        </button>
                      )}
                      {needsDownload && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const idx = await onDownload(cloudChar || ch)
                            if (typeof idx === 'number' && idx >= 0) {
                              onSelect(idx)
                            }
                          }}
                          className={iconBtn}
                          title={t('importFromCloud')}
                          aria-label={t('importFromCloud')}
                        >
                          <Download size={13} />
                        </button>
                      )}
                      {cloud && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteCloud(ch)
                          }}
                          className={`${iconBtn} ui-btn-danger`}
                          title={t('deleteFromCloud')}
                          aria-label={t('deleteFromCloud')}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        )
      })()}

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--c-panel-line)] pt-3">
        <button onClick={onNew} className="ui-btn ui-btn-primary">
          <Plus size={15} /> {t('newSheet')}
        </button>
        <button onClick={onImportClick} className="ui-btn">
          <Upload size={15} /> {t('importBtn')}
        </button>
        <button onClick={onExport} disabled={selectedIdx === null} className="ui-btn">
          <Download size={15} /> {t('exportBtn')}
        </button>
        <button onClick={onOpenCloud} className="ui-btn" title="Cloud">
          <Cloud size={15} /> Cloud
        </button>
        <input
          type="file"
          accept="text/plain,application/json"
          ref={fileInputRef}
          onChange={onImportFile}
          className="hidden"
        />
      </div>
    </section>
  )
}

export default CharacterList

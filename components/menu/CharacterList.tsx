import { FC, RefObject, useMemo } from 'react'
import { Edit2, Trash2, Plus, Upload, Download, Cloud } from 'lucide-react'
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

const btnBase =
  'inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg ' +
  'bg-blue-900/30 hover:bg-blue-800/60 active:bg-blue-900/70 border border-blue-200/10 ' +
  'transition-all shadow-sm text-blue-100 font-semibold text-sm backdrop-blur-[2px] ' +
  'disabled:opacity-40 disabled:cursor-not-allowed'

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
    <section
      className="
        rounded-xl backdrop-blur-md bg-black/18 border border-white/10
        p-3 flex-grow relative overflow-hidden
      "
      style={{
        boxShadow:
          '0 4px 18px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      <h2 className="text-lg font-semibold mb-2 select-none tracking-wide">
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
          return <p className="text-xs text-white/65 italic">{t('noSheets')}</p>
        }
        return (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                    className={`
                  group relative rounded-lg p-3 cursor-pointer
                  flex flex-col gap-2 min-h-[120px]
                  transition
                  ${
                    isSelected
                      ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]'
                      : 'hover:ring-2 hover:ring-emerald-300/40'
                  }
                `}
                    style={{
                      background:
                        'linear-gradient(145deg, rgba(34,42,60,0.42), rgba(18,23,35,0.35))',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                      boxShadow: isSelected
                        ? '0 0 0 1px rgba(255,255,255,0.06), 0 0 18px -6px rgba(16,185,129,0.45)'
                        : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 6px -4px rgba(0,0,0,0.50)',
                    }}
                    title={ch.nom || 'No name'}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className="font-semibold text-sm leading-tight truncate max-w-[110px]"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {ch.nom || 'No name'}
                      </span>
                      {local && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(ch.id)
                            }}
                            className={
                              btnBase +
                              ' hover:bg-yellow-500/90 text-yellow-100 w-8 h-8'
                            }
                            title={t('edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(ch.id)
                            }}
                            className={
                              btnBase +
                              ' hover:bg-red-600/90 text-red-100 w-8 h-8'
                            }
                            title={t('delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-white/85 mt-1 flex-1">
                      {ch.niveau !== undefined && (
                        <div>
                          <span className="font-medium text-emerald-200">
                            {t('level')}
                          </span>{' '}
                          {ch.niveau}
                        </div>
                      )}
                      {ch.classe && (
                        <div>
                          <span className="font-medium text-emerald-200">
                            {t('class')}
                          </span>{' '}
                          {ch.classe}
                        </div>
                      )}
                      {ch.sexe && (
                        <div>
                          <span className="font-medium text-emerald-200">
                            {t('gender')}
                          </span>{' '}
                          {ch.sexe}
                        </div>
                      )}
                      {ch.race && (
                        <div>
                          <span className="font-medium text-emerald-200">
                            {t('race')}
                          </span>{' '}
                          {ch.race}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-auto">
                      {cloud && (
                        <Cloud size={14} className="text-blue-200/80" />
                      )}
                      {needsUpload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                              onUpload(local ? filtered.at(localIdx)! : ch)
                          }}
                          className={
                            btnBase +
                            ' hover:bg-cyan-600/80 text-cyan-100 w-8 h-8'
                          }
                          title={cloud ? 'Update cloud' : 'Upload'}
                        >
                          <Upload size={16} />
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
                          className={
                            btnBase +
                            ' hover:bg-emerald-600/80 text-emerald-100 w-8 h-8'
                          }
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      {cloud && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteCloud(ch)
                          }}
                          className={
                            btnBase +
                            ' hover:bg-red-700/80 text-red-100 w-8 h-8'
                          }
                          title="Delete cloud"
                        >
                          <Trash2 size={16} />
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

      <div className="mt-6 flex flex-wrap gap-3 text-sm items-center">
        <button
          onClick={onNew}
          className={btnBase + ' hover:bg-emerald-600/80 text-emerald-100'}
        >
          <Plus size={17} /> {t('newSheet')}
        </button>
        <button
          onClick={onImportClick}
          className={btnBase + ' hover:bg-purple-700/80 text-purple-100'}
        >
          <Upload size={17} /> {t('importBtn')}
        </button>
        <button
          onClick={onExport}
          disabled={selectedIdx === null}
          className={
            btnBase +
            ' hover:bg-emerald-600/80 text-emerald-100' +
            (selectedIdx === null ? ' opacity-50 pointer-events-none' : '')
          }
        >
          <Download size={17} /> {t('exportBtn')}
        </button>
        <button
          onClick={onOpenCloud}
          className={btnBase + ' hover:bg-blue-600/80 text-blue-100'}
          title="Cloud"
        >
          <Cloud size={17} /> Cloud
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

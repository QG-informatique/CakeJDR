'use client'

import { useOthers } from '@liveblocks/react'
import { Crown, FileText, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useRoomSettings, type DrawPermission, type SheetEditMode } from '@/lib/roomSettings'
import { type Character, normalizeCharacter } from '@/types/character'

type Props = {
  /** Joueur dont la fiche est ouverte, ou null sur sa propre fiche. */
  viewingConnectionId: number | null
  onOpenSheet: (char: Character) => void
  onBackToOwn: () => void
  onClose: () => void
}

/**
 * Panneau du MJ : les joueurs connectés et leur fiche, et les réglages de la
 * table. Visible seulement pour le MJ.
 */
export default function GMPanel({ viewingConnectionId, onOpenSheet, onBackToOwn, onClose }: Props) {
  const t = useT()
  const { settings, update } = useRoomSettings()
  const others = useOthers()

  const players = others.map((o) => {
    const raw = o.presence?.character as Character | undefined
    const character =
      raw && raw.id !== undefined
        ? normalizeCharacter({ ...raw, ownerConnectionId: o.connectionId })
        : null
    return {
      connectionId: o.connectionId,
      id: o.id,
      name: o.presence?.name || o.info?.pseudo || '?',
      color: o.presence?.color || o.info?.color || '#888',
      gm: o.info?.role === 'gm',
      character,
    }
  })

  const toggleDraw = (id: string | undefined, allowed: boolean) => {
    if (!id) return
    const rest = settings.drawAllowed.filter((x) => x !== id)
    update({ drawAllowed: allowed ? [...rest, id] : rest })
  }

  const SHEET_OPTIONS: Array<[SheetEditMode, string]> = [
    ['own', t('gmSheetOwn')],
    ['gm', t('gmSheetGm')],
  ]
  const DRAW_OPTIONS: Array<[DrawPermission, string]> = [
    ['all', t('gmDrawAll')],
    ['gm', t('gmDrawGm')],
    ['some', t('gmDrawSome')],
  ]

  return (
    <div
      className="ui-panel pointer-events-auto flex max-h-full w-full max-w-[26rem] flex-col gap-3 overflow-y-auto p-3 shadow-lg !backdrop-blur-md"
      style={{ background: 'var(--c-panel-head)' }}
    >
      <div className="flex items-center gap-2">
        <Crown size={14} className="text-gm" aria-hidden />
        <span className="ui-label">{t('gmPanel')}</span>
        <button
          onClick={onClose}
          className="ui-btn ui-btn-ghost ui-btn-icon ml-auto !h-7 !min-h-7 !w-7 shrink-0"
          aria-label={t('close')}
          title={t('close')}
        >
          <X size={14} />
        </button>
      </div>

      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h3 className="ui-label !text-[10px]">{t('gmPlayers')}</h3>
          {viewingConnectionId !== null && (
            <button onClick={onBackToOwn} className="ui-btn ui-btn-ghost ml-auto !min-h-7 !px-2 text-xs">
              ← {t('myCharacter')}
            </button>
          )}
        </div>
        {players.length === 0 ? (
          <p className="ui-well px-3 py-2 text-xs text-ink/60">{t('gmNoPlayers')}</p>
        ) : (
          <ul className="ui-well divide-y divide-[var(--c-panel-line)]">
            {players.map((p) => {
              const c = p.character
              const viewing = viewingConnectionId === p.connectionId
              const pvMax = c ? Number(c.pv_max ?? c.pvMax ?? c.pv) || 0 : 0
              const drawOk = p.gm || (!!p.id && settings.drawAllowed.includes(p.id))
              return (
                <li key={p.connectionId} className={`flex flex-col gap-1.5 px-2.5 py-2 ${viewing ? 'bg-accent/10' : ''}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">
                        {c?.nom || t('noActiveChar')}
                      </span>
                      <span className="truncate text-xs text-ink/60">
                        {p.name}
                        {p.gm && ` · ${t('gmLabel')}`}
                        {c && ` · ${t('level')} ${c.niveau || 1} · ${t('hp')} ${Number(c.pv) || 0}/${pvMax}`}
                      </span>
                    </div>
                    <button
                      onClick={() => c && onOpenSheet(c)}
                      disabled={!c || viewing}
                      className={`ui-btn shrink-0 !min-h-8 !px-2.5 text-xs ${viewing ? 'ui-btn-primary' : ''}`}
                    >
                      <FileText size={13} />
                      {viewing ? t('gmSheetOpen') : t('gmOpenSheet')}
                    </button>
                  </div>
                  {settings.draw === 'some' && !p.gm && (
                    <label className="flex items-center gap-2 pl-4.5 text-xs text-ink/75">
                      <input
                        type="checkbox"
                        checked={drawOk}
                        disabled={!p.id}
                        onChange={(e) => toggleDraw(p.id, e.target.checked)}
                      />
                      {t('gmCanDraw')}
                    </label>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmWhoEditsSheets')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmWhoEditsSheets')}>
          {SHEET_OPTIONS.map(([value, label]) => (
            <button key={value} aria-pressed={settings.sheetEdit === value} onClick={() => update({ sheetEdit: value })}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmWhoDraws')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmWhoDraws')}>
          {DRAW_OPTIONS.map(([value, label]) => (
            <button key={value} aria-pressed={settings.draw === value} onClick={() => update({ draw: value })}>
              {label}
            </button>
          ))}
        </div>
        {settings.draw === 'some' && players.length > 0 && (
          <p className="text-xs text-ink/55">{t('gmDrawSomeHint')}</p>
        )}
      </section>

      <p className="text-[11px] leading-snug text-ink/50">{t('gmSettingsLimit')}</p>
    </div>
  )
}

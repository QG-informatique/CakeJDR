'use client'

import { useState } from 'react'
import { useOthers, useRoom, useStorage } from '@liveblocks/react'
import { Crown, Dices, FileText, Target, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import {
  CHECK_DC_MAX,
  CHECK_DC_MIN,
  CHECK_MOD_RANGE,
  CHECK_REASON_MAX,
  CHECK_STATS,
  LEVEL_UP_TARGETS,
  ROLLS_MAX,
  checkStatLabel,
  signedMod,
  withStat,
  type CheckStat,
} from '@/lib/checks'
import { statMod } from '@/lib/modifiers'
import { DICE_TYPES } from '@/lib/dicePayload'
import { postCheck } from '@/components/checks/postCheck'
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
  const [checkFor, setCheckFor] = useState<number | null>(null)

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
                      onClick={() => setCheckFor(checkFor === p.connectionId ? null : p.connectionId)}
                      disabled={!c || !p.id}
                      aria-expanded={checkFor === p.connectionId}
                      title={t('gmCheckTitle').replace('{n}', c?.nom || p.name)}
                      className={`ui-btn shrink-0 !min-h-8 !px-2.5 text-xs ${checkFor === p.connectionId ? 'ui-btn-primary' : ''}`}
                    >
                      <Dices size={13} />
                      {t('gmCheck')}
                    </button>
                    <button
                      onClick={() => c && onOpenSheet(c)}
                      disabled={!c || viewing}
                      className={`ui-btn shrink-0 !min-h-8 !px-2.5 text-xs ${viewing ? 'ui-btn-primary' : ''}`}
                    >
                      <FileText size={13} />
                      {viewing ? t('gmSheetOpen') : t('gmOpenSheet')}
                    </button>
                  </div>
                  {checkFor === p.connectionId && c && p.id && (
                    <RequestForm
                      targetId={p.id}
                      targetName={c.nom || p.name}
                      character={c}
                      onDone={() => setCheckFor(null)}
                    />
                  )}
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

      <PendingChecks />

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

/** Difficultés cachées des tests en attente : seul le MJ qui les a posées les connaît. */
const HIDDEN_DC_KEY = 'jdr_check_dcs'

function readHiddenDcs(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_DC_KEY) || '{}') as Record<string, number>
  } catch {
    return {}
  }
}

function writeHiddenDcs(dcs: Record<string, number>) {
  try {
    localStorage.setItem(HIDDEN_DC_KEY, JSON.stringify(dcs))
  } catch { /* stockage indisponible */ }
}

type RequestMode = 'check' | 'dice' | 'level'

/** Ce que le MJ demande à un joueur : un test, des dés, ou une montée de niveau. */
function RequestForm(props: {
  targetId: string
  targetName: string
  character: Character
  onDone: () => void
}) {
  const t = useT()
  const [mode, setMode] = useState<RequestMode>('check')
  const MODES: Array<[RequestMode, string]> = [
    ['check', t('rollModeCheck')],
    ['dice', t('rollModeDice')],
    ['level', t('rollModeLevel')],
  ]
  return (
    <div className="ui-well flex flex-col gap-2 p-2.5 text-xs">
      <div className="ui-seg" role="group" aria-label={t('gmCheckTitle').replace('{n}', props.targetName)}>
        {MODES.map(([value, label]) => (
          <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
            {label}
          </button>
        ))}
      </div>
      {mode === 'check' ? <CheckForm {...props} /> : <RollsForm {...props} levelUp={mode === 'level'} />}
    </div>
  )
}

/** Plusieurs dés lancés en une fois ; pour une montée de niveau, le nombre est fixé. */
function RollsForm({ targetId, targetName, levelUp, onDone }: {
  targetId: string
  targetName: string
  levelUp: boolean
  onDone: () => void
}) {
  const t = useT()
  const room = useRoom()
  const [count, setCount] = useState('2')
  const [dice, setDice] = useState(6)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  const countNum = levelUp ? LEVEL_UP_TARGETS.length : Math.round(Number(count))
  const valid = Number.isFinite(countNum) && countNum >= 1 && countNum <= ROLLS_MAX

  const send = async () => {
    if (!valid || sending) return
    setSending(true)
    setError(false)
    try {
      await postCheck(room.id, {
        action: 'ask', type: 'rolls', targetId, targetName, dice, count: countNum, levelUp, reason: reason.trim(),
      })
      onDone()
    } catch {
      setError(true)
      setSending(false)
    }
  }

  return (
    <>
      <div className={`grid gap-2 ${levelUp ? 'grid-cols-[5rem]' : 'grid-cols-[4.5rem_5rem]'}`}>
        {!levelUp && (
          <label className="flex min-w-0 flex-col gap-1">
            <span className="text-ink/60">{t('rollsCount')}</span>
            <input
              type="number"
              inputMode="numeric"
              value={count}
              min={1}
              max={ROLLS_MAX}
              onChange={(e) => setCount(e.target.value)}
              className="ui-input w-full min-w-0 !min-h-8"
            />
          </label>
        )}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t('rollsDice')}</span>
          <select value={dice} onChange={(e) => setDice(Number(e.target.value))} className="ui-input w-full min-w-0 !min-h-8">
            {DICE_TYPES.map((d) => (
              <option key={d} value={d}>D{d}</option>
            ))}
          </select>
        </label>
      </div>
      {levelUp ? (
        <p className="text-[11px] text-ink/50">{t('levelUpHint')}</p>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-ink/60">{t('checkReasonLabel')}</span>
          <input
            type="text"
            value={reason}
            maxLength={CHECK_REASON_MAX}
            onChange={(e) => setReason(e.target.value)}
            className="ui-input w-full min-w-0 !min-h-8"
          />
        </label>
      )}
      {error && <p role="alert" className="text-red-400">{t('checkFailed')}</p>}
      <button onClick={send} disabled={!valid || sending} className="ui-btn ui-btn-primary !min-h-8 text-xs">
        <Dices size={13} />
        {t(levelUp ? 'levelUpSend' : 'rollsSend')}
      </button>
    </>
  )
}

const modFromSheet = (c: Character, stat: CheckStat) => {
  const n = statMod(c, stat).total
  return Math.max(-CHECK_MOD_RANGE, Math.min(CHECK_MOD_RANGE, n))
}

/** Demande d'un test : caractéristique, modificateur, difficulté, et si le joueur la voit. */
function CheckForm({ targetId, targetName, character, onDone }: {
  targetId: string
  targetName: string
  character: Character
  onDone: () => void
}) {
  const t = useT()
  const room = useRoom()
  const [stat, setStat] = useState<CheckStat>('force')
  const [mod, setMod] = useState(() => String(modFromSheet(character, 'force')))
  const [dc, setDc] = useState('10')
  const [showDc, setShowDc] = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  const modNum = Math.round(Number(mod))
  const dcNum = Math.round(Number(dc))
  const valid =
    mod.trim() !== '' && Number.isFinite(modNum) && Math.abs(modNum) <= CHECK_MOD_RANGE &&
    Number.isFinite(dcNum) && dcNum >= CHECK_DC_MIN && dcNum <= CHECK_DC_MAX

  const pickStat = (next: CheckStat) => {
    setStat(next)
    setMod(String(modFromSheet(character, next)))
  }

  const send = async () => {
    if (!valid || sending) return
    setSending(true)
    setError(false)
    try {
      const data = await postCheck(room.id, {
        action: 'ask', targetId, targetName, stat, mod: modNum, dc: dcNum, showDc, reason: reason.trim(),
      })
      if (data?.id && !showDc) writeHiddenDcs({ ...readHiddenDcs(), [data.id]: dcNum })
      onDone()
    } catch {
      setError(true)
      setSending(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2">
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t('checkStatLabel')}</span>
          <select value={stat} onChange={(e) => pickStat(e.target.value as CheckStat)} className="ui-input w-full min-w-0 !min-h-8">
            {CHECK_STATS.map((s) => (
              <option key={s.key} value={s.key}>{t(s.label)}</option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t('checkModLabel')}</span>
          <input
            type="number"
            inputMode="numeric"
            value={mod}
            min={-CHECK_MOD_RANGE}
            max={CHECK_MOD_RANGE}
            onChange={(e) => setMod(e.target.value)}
            className="ui-input w-full min-w-0 !min-h-8"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t('checkDcLabel')}</span>
          <input
            type="number"
            inputMode="numeric"
            value={dc}
            min={CHECK_DC_MIN}
            max={CHECK_DC_MAX}
            onChange={(e) => setDc(e.target.value)}
            className="ui-input w-full min-w-0 !min-h-8"
          />
        </label>
      </div>
      <p className="text-[11px] text-ink/50">{t('checkModHint')}</p>
      <label className="flex flex-col gap-1">
        <span className="text-ink/60">{t('checkReasonLabel')}</span>
        <input
          type="text"
          value={reason}
          maxLength={CHECK_REASON_MAX}
          placeholder={t('checkReasonPlaceholder')}
          onChange={(e) => setReason(e.target.value)}
          className="ui-input w-full min-w-0 !min-h-8"
        />
      </label>
      <label className="flex items-center gap-2 text-ink/75">
        <input type="checkbox" checked={showDc} onChange={(e) => setShowDc(e.target.checked)} />
        {t('checkShowDc')}
      </label>
      {error && <p role="alert" className="text-red-400">{t('checkFailed')}</p>}
      <button onClick={send} disabled={!valid || sending} className="ui-btn ui-btn-primary !min-h-8 text-xs">
        <Target size={13} />
        {t('checkSend')}
      </button>
    </>
  )
}

/** Tests demandés qui attendent encore le jet du joueur. */
function PendingChecks() {
  const t = useT()
  const room = useRoom()
  const checks = useStorage((root) => root.checks)
  const pending = checks ? Array.from(checks.values()).sort((a, b) => a.createdAt - b.createdAt) : []
  if (pending.length === 0) return null
  const hiddenDcs = readHiddenDcs()

  const cancel = (id: string) => {
    void postCheck(room.id, { action: 'cancel', id }).catch(() => {})
    const dcs = readHiddenDcs()
    delete dcs[id]
    writeHiddenDcs(dcs)
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="ui-label !text-[10px]">{t('checkPending')}</h3>
      <ul className="ui-well divide-y divide-[var(--c-panel-line)]">
        {pending.map((c) => {
          if (c.type === 'rolls') {
            return (
              <li key={c.id} className="flex items-center gap-2 px-2.5 py-2 text-xs">
                <Dices size={13} className="shrink-0 text-ink/50" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-semibold">{c.targetName}</span>
                  {' · '}
                  {c.levelUp && `${t('rollModeLevel')} · `}
                  {c.count} D{c.dice}
                  {c.reason && ` · ${c.reason}`}
                </span>
                <button onClick={() => cancel(c.id)} className="ui-btn ui-btn-ghost shrink-0 !min-h-7 !px-2 text-xs">
                  {t('checkCancel')}
                </button>
              </li>
            )
          }
          const dc = c.dc ?? hiddenDcs[c.id]
          return (
            <li key={c.id} className="flex items-center gap-2 px-2.5 py-2 text-xs">
              <Target size={13} className="shrink-0 text-ink/50" aria-hidden />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold">{c.targetName}</span>
                {' · '}
                {withStat(t('checkOf'), t(checkStatLabel(c.stat)))} {signedMod(c.mod)}
                {dc != null && ` · ${t('checkPromptDc').replace('{n}', String(dc))}`}
                {!c.showDc && ' 🔒'}
              </span>
              <button onClick={() => cancel(c.id)} className="ui-btn ui-btn-ghost shrink-0 !min-h-7 !px-2 text-xs">
                {t('checkCancel')}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { useBroadcastEvent, useOthers, useRoom, useStorage } from '@liveblocks/react'
import { Crown, Dices, FileText, Pencil, Sparkles, Star, Target, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import {
  CHECK_DC_MAX,
  CHECK_DC_MIN,
  CHECK_MOD_RANGE,
  CHECK_REASON_MAX,
  CHECK_THRESHOLD_MAX,
  ROLLS_MAX,
  checkStatLabel,
  signedMod,
  withStat,
  type CheckStat,
} from '@/lib/checks'
import { statMod } from '@/lib/modifiers'
import { DICE_TYPES } from '@/lib/dicePayload'
import { postCheck } from '@/components/checks/postCheck'
import AdventureLauncher from '@/components/autogm/AdventureLauncher'
import TableSettings from '@/components/gm/TableSettings'
import { useGameSystem, useRoomSettings } from '@/lib/roomSettings'
import { levelUpDice, type GameSystem } from '@/lib/gameSystems'
import { levelUpTargets } from '@/lib/levelUp'
import { type Character, normalizeCharacter } from '@/types/character'
import { XP_GIFTS, XP_PER_LEVEL, levelReady, xpOf } from '@/lib/xp'

type Props = {
  /** Joueur dont la fiche est ouverte, ou null sur sa propre fiche. */
  viewingConnectionId: number | null
  onOpenSheet: (char: Character) => void
  onBackToOwn: () => void
  /** Le MJ monte un niveau à la main : fiche du joueur ouverte en édition. */
  onLevelByHand: (char: Character) => void
  onClose: () => void
}

/**
 * Panneau du MJ : les joueurs connectés et leur fiche, et les réglages de la
 * table. Visible seulement pour le MJ.
 */
export default function GMPanel({ viewingConnectionId, onOpenSheet, onBackToOwn, onLevelByHand, onClose }: Props) {
  const t = useT()
  const { settings, update } = useRoomSettings()
  const system = useGameSystem()
  const others = useOthers()
  const [checkFor, setCheckFor] = useState<{ connectionId: number; mode: RequestMode } | null>(null)
  // Avec le MJ automatique et la montée automatique, le MJ n'a pas à choisir.
  const autoGmOn = useStorage((root) => !!root.autoGm)
  const levels = system.levelUp.length > 0
  const autoLevels = levels && autoGmOn && settings.autoLevelUp

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
                        {c && levels && ` · ${t('xp')} ${xpOf(c)}/${XP_PER_LEVEL}`}
                      </span>
                    </div>
                    {c && p.id && levels && levelReady(c) && (
                      autoLevels ? (
                        <span className="flex shrink-0 items-center gap-1 text-[11px] text-accent" title={t('xpAutoSoon')}>
                          <Sparkles size={12} aria-hidden />
                          {t('xpReadyShort')}
                        </span>
                      ) : (
                        <button
                          onClick={() => setCheckFor({ connectionId: p.connectionId, mode: 'level' })}
                          title={t('xpReadyTitle').replace('{n}', c.nom || p.name)}
                          className="ui-btn ui-btn-primary shrink-0 !min-h-8 !px-2.5 text-xs"
                        >
                          <Sparkles size={13} />
                          {t('xpReadyShort')}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCheckFor(checkFor?.connectionId === p.connectionId ? null : { connectionId: p.connectionId, mode: 'check' })}
                      disabled={!c || !p.id}
                      aria-expanded={checkFor?.connectionId === p.connectionId}
                      title={t('gmCheckTitle').replace('{n}', c?.nom || p.name)}
                      className={`ui-btn shrink-0 !min-h-8 !px-2.5 text-xs ${checkFor?.connectionId === p.connectionId ? 'ui-btn-primary' : ''}`}
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
                  {checkFor?.connectionId === p.connectionId && c && p.id && (
                    <RequestForm
                      key={checkFor.mode}
                      initialMode={checkFor.mode}
                      targetId={p.id}
                      targetName={c.nom || p.name}
                      character={c}
                      onLevelByHand={() => { setCheckFor(null); onLevelByHand(c) }}
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

      <TableSettings
        middle={<AdventureLauncher />}
        drawExtra={settings.draw === 'some' && players.length > 0 && (
          <p className="text-xs text-ink/55">{t('gmDrawSomeHint')}</p>
        )}
      />

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

type RequestMode = 'check' | 'dice' | 'level' | 'xp'

/** Ce que le MJ demande à un joueur : un test, des dés, une montée de niveau, ou de l'XP. */
function RequestForm({ initialMode, onLevelByHand, ...props }: {
  initialMode: RequestMode
  targetId: string
  targetName: string
  character: Character
  onLevelByHand: () => void
  onDone: () => void
}) {
  const t = useT()
  const system = useGameSystem()
  const [mode, setMode] = useState<RequestMode>(initialMode)
  // Un système sans niveaux (d100) n'a ni montée de niveau ni XP.
  const levels = system.levelUp.length > 0
  const MODES: Array<[RequestMode, string]> = [
    ['check', t('rollModeCheck')],
    ['dice', t('rollModeDice')],
    ...(levels ? [['xp', t('xp')], ['level', t('rollModeLevel')]] as Array<[RequestMode, string]> : []),
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
      {mode === 'check' ? (
        <CheckForm key={system.stats.map((s) => s.key).join()} {...props} system={system} />
      ) : mode === 'xp' && levels ? (
        <XpForm {...props} />
      ) : (
        <RollsForm {...props} system={system} levelUp={mode === 'level' && levels} onLevelByHand={onLevelByHand} />
      )}
    </div>
  )
}

/** XP donnée d'un clic : le joueur l'ajoute à sa fiche. */
function XpForm({ targetId, targetName, character, onDone }: {
  targetId: string
  targetName: string
  character: Character
  onDone: () => void
}) {
  const t = useT()
  const broadcast = useBroadcastEvent()
  const [custom, setCustom] = useState('')
  const customNum = Math.round(Number(custom))
  const give = (amount: number) => {
    if (!Number.isFinite(amount) || amount < 1 || amount > 500) return
    broadcast({ type: 'xp', targetId, amount })
    onDone()
  }
  return (
    <>
      <p className="text-ink/60">
        {t('xpGiveHint').replace('{n}', targetName).replace('{xp}', `${xpOf(character)}/${XP_PER_LEVEL}`)}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {XP_GIFTS.map((g) => (
          <button key={g.amount} onClick={() => give(g.amount)} className="ui-btn !min-h-8 text-xs">
            <Star size={12} />
            +{g.amount} · {t(g.label)}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={500}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={t('xpCustom')}
          aria-label={t('xpCustom')}
          className="ui-input w-24 min-w-0 !min-h-8"
        />
        <button
          onClick={() => give(customNum)}
          disabled={!(customNum >= 1 && customNum <= 500)}
          className="ui-btn ui-btn-primary !min-h-8 text-xs"
        >
          {t('xpGive')}
        </button>
      </div>
    </>
  )
}

/** Plusieurs dés lancés en une fois ; pour une montée de niveau, le nombre est fixé. */
function RollsForm({ targetId, targetName, character, levelUp, onDone, onLevelByHand, system }: {
  targetId: string
  targetName: string
  character: Character
  levelUp: boolean
  system: GameSystem
  onDone: () => void
  /** Montée de niveau sans dés : le MJ modifie la fiche lui-même. */
  onLevelByHand: () => void
}) {
  const t = useT()
  const room = useRoom()
  const [count, setCount] = useState('2')
  const [dice, setDice] = useState(6)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  // Montée de niveau : les PV, puis les caractéristiques de la classe à ce niveau.
  const targets = levelUpTargets(system, character)
  const countNum = levelUp ? levelUpDice(system) : Math.round(Number(count))
  const valid = Number.isFinite(countNum) && countNum >= 1 && countNum <= ROLLS_MAX

  const send = async () => {
    if (!valid || sending) return
    setSending(true)
    setError(false)
    try {
      await postCheck(room.id, {
        action: 'ask', type: 'rolls', system: system.id, targetId, targetName, dice, count: countNum, levelUp, reason: reason.trim(),
        ...(levelUp && system.levelUpStats ? { targets } : {}),
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
        <p className="text-[11px] text-ink/50">
          {system.levelUp.length === 1
            ? t('levelUpExplainHitDie')
            : t('levelUpExplain').replace('{stats}', targets.slice(1).map((k) => t(checkStatLabel(k, system))).join(', '))}
        </p>
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
        {t(levelUp ? 'levelUpByDice' : 'rollsSend')}
      </button>
      {levelUp && (
        <button onClick={onLevelByHand} className="ui-btn !min-h-8 text-xs">
          <Pencil size={13} />
          {t('levelUpByHand')}
        </button>
      )}
    </>
  )
}

/** Ce que la fiche donne au test : le modificateur, ou le seuil en % d'un test sous un seuil. */
const modFromSheet = (c: Character, stat: CheckStat, system: GameSystem) => {
  const n = statMod(c, stat, system.modRule).total
  return system.rollUnder
    ? Math.max(CHECK_DC_MIN, Math.min(CHECK_THRESHOLD_MAX, n))
    : Math.max(-CHECK_MOD_RANGE, Math.min(CHECK_MOD_RANGE, n))
}

/** Demande d'un test : caractéristique, modificateur, difficulté, et si le joueur la voit. */
function CheckForm({ targetId, targetName, character, system, onDone }: {
  targetId: string
  targetName: string
  character: Character
  system: GameSystem
  onDone: () => void
}) {
  const t = useT()
  const room = useRoom()
  const under = system.rollUnder
  const first = (system.stats[0]?.key ?? 'force') as CheckStat
  const [stat, setStat] = useState<CheckStat>(first)
  // Sous un seuil (d100), un seul nombre : le seuil, tiré de la fiche.
  const [mod, setMod] = useState(() => (under ? '0' : String(modFromSheet(character, first, system))))
  const [dc, setDc] = useState(() => (under ? String(modFromSheet(character, first, system)) : '10'))
  const [showDc, setShowDc] = useState(false)
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)

  const modNum = Math.round(Number(mod))
  const dcNum = Math.round(Number(dc))
  const dcMax = under ? CHECK_THRESHOLD_MAX : CHECK_DC_MAX
  const valid =
    mod.trim() !== '' && Number.isFinite(modNum) && Math.abs(modNum) <= CHECK_MOD_RANGE &&
    Number.isFinite(dcNum) && dcNum >= CHECK_DC_MIN && dcNum <= dcMax

  const pickStat = (next: CheckStat) => {
    setStat(next)
    if (under) setDc(String(modFromSheet(character, next, system)))
    else setMod(String(modFromSheet(character, next, system)))
  }

  const send = async () => {
    if (!valid || sending) return
    setSending(true)
    setError(false)
    try {
      const data = await postCheck(room.id, {
        action: 'ask', system: system.id, targetId, targetName, stat, mod: modNum, dc: dcNum, showDc, reason: reason.trim(),
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
      <div className={`grid gap-2 ${under ? 'grid-cols-[1fr_5rem]' : 'grid-cols-[1fr_4.5rem_4.5rem]'}`}>
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t('checkStatLabel')}</span>
          <select value={stat} onChange={(e) => pickStat(e.target.value as CheckStat)} className="ui-input w-full min-w-0 !min-h-8">
            {system.stats.map((s) => (
              <option key={s.key} value={s.key}>{t(s.label)}</option>
            ))}
          </select>
        </label>
        {!under && <label className="flex min-w-0 flex-col gap-1">
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
        </label>}
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-ink/60">{t(under ? 'checkThresholdLabel' : 'checkDcLabel')}</span>
          <input
            type="number"
            inputMode="numeric"
            value={dc}
            min={CHECK_DC_MIN}
            max={dcMax}
            onChange={(e) => setDc(e.target.value)}
            className="ui-input w-full min-w-0 !min-h-8"
          />
        </label>
      </div>
      <p className="text-[11px] text-ink/50">{t(under ? 'checkThresholdHint' : 'checkModHint')}</p>
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
        {t(under ? 'checkShowThreshold' : 'checkShowDc')}
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
  const system = useGameSystem()
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
                {withStat(t('checkOf'), t(checkStatLabel(c.stat, system)))} {signedMod(c.mod)}
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

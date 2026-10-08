'use client'

import { FC, RefObject, useRef, useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BarChart3, BookOpen, Dices, MessageSquare, Target, TriangleAlert } from 'lucide-react'
import { useBroadcastEvent, useRoom, useSelf } from '@liveblocks/react'
import SessionSummary from './SessionSummary'
import DiceStats from './DiceStats'
import useEventLog, { SessionEvent } from '../app/hooks/useEventLog'
import { useT } from '@/lib/useT'
import { useIsDesktop } from '@/lib/useIsDesktop'
import { debug } from '@/lib/debug'
import { useDiceVerification } from './useDiceVerification'
import { checkStatLabel, levelUpLabel, signedMod, withStat } from '@/lib/checks'
import { poolLabel } from '@/lib/dicePool'

// Longueur maximale d'un message : au-delà, la liste partagée de la table
// grossit vite et un pavé sans espace déborde du panneau.
const MAX_MESSAGE_LENGTH = 1000

interface Props {
  chatBoxRef: RefObject<HTMLDivElement | null>
  author: string
}

const ChatBox: FC<Props> = ({ chatBoxRef, author }) => {
  const room = useRoom()
  const { events, addEvent } = useEventLog(room.id)
  const sortedEvents = useMemo(() => {
    const seen = new Set<string>()
    const unique: SessionEvent[] = []
    for (const ev of events as SessionEvent[]) {
      const key = ev.kind === 'chat'
        ? `${ev.kind}-${ev.ts}-${ev.author}-${ev.text}`
        : `${ev.kind}-${ev.ts}-${ev.player}-${ev.dice}-${ev.result}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(ev)
      }
    }
    return unique.sort((a, b) => a.ts - b.ts)
  }, [events])
  // Un lancer porte l'heure de la fin de son animation : il reste caché
  // jusque-là, pour ne pas dévoiler le résultat avant le dé.
  const [now, setNow] = useState(() => Date.now())
  const nextReveal = useMemo(
    () => sortedEvents.find((ev) => ev.kind !== 'chat' && ev.ts > now)?.ts ?? null,
    [sortedEvents, now],
  )
  useEffect(() => {
    if (nextReveal === null) return
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(0, nextReveal - Date.now()))
    return () => window.clearTimeout(timer)
  }, [nextReveal])
  const revealedEvents = useMemo(
    () => sortedEvents.filter((ev) => ev.kind === 'chat' || ev.ts <= now),
    [sortedEvents, now],
  )
  const diceChecks = useDiceVerification(room.id, revealedEvents)
  // Les statistiques de dés se calculent sur l'historique partagé de la table :
  // tous les joueurs voient les mêmes chiffres, y compris pour les lancers
  // faits avant leur arrivée.
  const diceRolls = useMemo(
    () => revealedEvents
      .filter((ev) => ev.kind !== 'chat' && ev.player != null && ev.dice != null && ev.result != null)
      // Des jets multiples comptent dé par dé : leur somme fausserait les moyennes.
      .flatMap((ev) => ev.pool
        ? ev.pool.dice.flatMap((dice, i) => {
            const result = ev.pool!.results[i]
            return result == null ? [] : [{ player: ev.player!, dice, result, ts: ev.ts }]
          })
        : (ev.rolls?.results ?? [ev.result!]).map((result) => ({ player: ev.player!, dice: ev.dice!, result, ts: ev.ts }))),
    [revealedEvents],
  )
  const [inputValue, setInputValue] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [sessionStart] = useState(() => Date.now())
  const [showHistory, setShowHistory] = useState(false)
  const displayedEvents = showHistory
    ? revealedEvents
    : revealedEvents.filter(ev => ev.ts >= sessionStart)
  const broadcast = useBroadcastEvent()
  const self = useSelf()
  const t = useT()
  // Sur téléphone le chat a son propre onglet : on ne le replie jamais.
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('chatPanelCollapsed') === '1'
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatPanelCollapsed', collapsed ? '1' : '0')
    }
  }, [collapsed])

  const sendMessage = async () => {
    if (inputValue.trim() === '') return

    const msg = { author, text: inputValue.trim().slice(0, MAX_MESSAGE_LENGTH), isMJ: self?.info?.role === 'gm' }
    const ts = Date.now()

    broadcast({ type: 'chat', author: msg.author, text: msg.text, isMJ: msg.isMJ, ts })
    addEvent({ id: crypto.randomUUID(), kind: 'chat', author: msg.author, text: msg.text, ts, isMJ: msg.isMJ })
    debug('chat', msg)

    setInputValue('')
  }

  // Le message est écrit une seule fois dans la liste partagée, par son
  // auteur ; les autres joueurs le reçoivent par la synchronisation. Avant,
  // chaque joueur le réécrivait à réception, ce qui créait des doublons dans
  // la table quand deux écritures se croisaient.

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  // When collapsed, only show a floating button so the panel frees all space
  if (collapsed && isDesktop) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        aria-label={t('expandPanel')}
        title={t('expandPanel')}
        className="ui-btn ui-btn-icon absolute top-3 right-3 z-50"
      >
        <ChevronLeft size={18} />
      </button>
    )
  }

  const panelClass =
    'ui-panel w-full flex-1 min-h-0 lg:flex-none lg:w-[340px] flex flex-col relative flex-shrink-0 overflow-hidden'

  const collapseButton = (
    <button
      onClick={() => setCollapsed(true)}
      aria-label={t('collapsePanel')}
      title={t('collapsePanel')}
      className="max-lg:hidden ui-btn ui-btn-ghost ui-btn-icon"
    >
      <ChevronRight size={18} />
    </button>
  )

  // Summary view
  if (showSummary) {
    return (
      <aside className={panelClass}>
        <SessionSummary onClose={() => setShowSummary(false)} collapseButton={collapseButton} />
      </aside>
    )
  }

  return (
    <aside className={panelClass}>
      {/* En-tête : titre, résumé de la session, statistiques des dés */}
      <div className="flex items-center gap-1.5 border-b border-[var(--c-panel-line)] px-3 py-2.5" style={{ background: 'var(--c-panel-head)' }}>
        <MessageSquare size={16} className="text-accent shrink-0" />
        <h2 className="text-sm font-semibold">{t('chat')}</h2>
        <span className="ml-auto flex items-center gap-1">
          <button
            className="ui-btn !border-amber-400/30 !text-amber-200 hover:!bg-amber-500/15"
            onClick={() => setShowSummary(true)}
            title={t('sessionSummary')}
          >
            <BookOpen size={14} />
            {t('summaryShort')}
          </button>
          <button
            className={`ui-btn ui-btn-icon ${showStats ? 'ui-btn-primary' : ''}`}
            onClick={() => setShowStats(s => !s)}
            aria-pressed={showStats}
            aria-label={t('diceStats')}
            title={t('diceStats')}
          >
            <BarChart3 size={15} />
          </button>
          {collapseButton}
        </span>
      </div>

      {/* Vertical layout: stats (optional) + chat */}
      <div className="flex flex-col flex-1 min-h-0 gap-3 p-3">
        {showStats && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="ui-label mb-1.5">{t('diceStatsTitle')}</div>
            <div className="ui-well flex-1 overflow-y-auto p-2 min-h-0">
              <DiceStats history={diceRolls} />
            </div>
          </div>
        )}

        <div className={`flex-1 min-h-0 flex flex-col ${showStats ? '' : 'h-full'}`}>
          <div
            ref={chatBoxRef}
            className="relative flex-1 overflow-y-auto min-h-0 -mx-1 px-1"
          >
            <div className="flex justify-center pb-2">
              <button
                onClick={() => setShowHistory(h => !h)}
                className="rounded-full px-2 py-0.5 text-[11px] text-ink/40 transition hover:bg-ink/8 hover:text-ink/80"
                title={showHistory ? t('hideHistory') : t('showHistory')}
              >
                {showHistory ? t('hideHistory') : t('showHistory')}
              </button>
            </div>
            <div className="flex flex-col gap-2">
            {displayedEvents.map(ev => {
              const isChat = ev.kind === 'chat'
              if (isChat) {
                const isMJ = ev.isMJ
                return (
                  <div key={ev.id} className="animate-fadeIn flex flex-col gap-0.5">
                    <span className={`text-[11px] font-semibold px-0.5 ${isMJ ? 'text-amber-300' : 'text-ink/50'}`}>
                      {isMJ && '👑 '}{ev.author}
                    </span>
                    <div className={`
                      px-2.5 py-1.5 rounded-lg text-sm leading-snug
                      ${isMJ
                        ? 'bg-amber-500/10 border border-amber-400/25 border-l-2 border-l-amber-400 text-amber-50'
                        : 'ui-well text-ink/90'}
                      whitespace-pre-wrap [overflow-wrap:anywhere]
                    `}>
                      {ev.text}
                    </div>
                  </div>
                )
              } else if (ev.kind === 'rolls' && ev.rolls) {
                // Jets demandés par le MJ, dont la montée de niveau.
                const r = ev.rolls
                return (
                  <div key={ev.id} className="animate-fadeIn ui-well flex flex-col gap-0.5 px-2.5 py-1.5 border-l-2 border-l-accent text-sm">
                    <div className="flex items-center gap-2">
                      <Dices size={15} className="shrink-0 text-ink/50" />
                      <span className="max-w-[60%] shrink-0 truncate text-ink/75 text-xs font-semibold">{ev.player}</span>
                      <span className="truncate text-ink/45 text-xs">
                        {r.levelUp ? t('rollModeLevel') : `${r.results.length} D${ev.dice}`}
                      </span>
                      {!r.levelUp && r.results.length > 1 && (
                        <span className="ml-auto shrink-0 text-xs text-ink/50 tabular-nums">
                          {t('rollsTotal')} <span className="text-base font-bold leading-none text-ink">{ev.result}</span>
                        </span>
                      )}
                      {diceChecks[ev.id] === 'unverified' && (
                        <TriangleAlert size={13} className={`shrink-0 text-amber-400 ${r.levelUp || r.results.length < 2 ? 'ml-auto' : ''}`} aria-label={t('diceUnverified')}>
                          <title>{t('diceUnverified')}</title>
                        </TriangleAlert>
                      )}
                    </div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pl-6 text-xs text-ink/60 tabular-nums">
                      {r.results.map((n, i) => (
                        <span key={i}>
                          {r.levelUp && `${t(levelUpLabel(i))} `}
                          <span className="font-bold text-ink">{r.levelUp ? `+${n}` : n}</span>
                        </span>
                      ))}
                      {r.reason && <span className="min-w-0 truncate text-ink/45">· {r.reason}</span>}
                    </div>
                  </div>
                )
              } else if (ev.kind === 'check' && ev.check) {
                // Test demandé par le MJ : la difficulté cachée n'apparaît qu'au MJ.
                const c = ev.check
                const showDc = c.showDc || self?.info?.role === 'gm'
                return (
                  <div key={ev.id} className={`animate-fadeIn ui-well flex flex-col gap-0.5 px-2.5 py-1.5 border-l-2 ${c.success ? 'border-l-emerald-400' : 'border-l-red-400'} text-sm`}>
                    <div className="flex items-center gap-2">
                      <Target size={15} className="shrink-0 text-ink/50" />
                      <span className="max-w-[60%] shrink-0 truncate text-ink/75 text-xs font-semibold">{ev.player}</span>
                      <span className="truncate text-ink/45 text-xs">{withStat(t('checkOf'), t(checkStatLabel(c.stat)))}</span>
                      <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[11px] font-bold ${c.success ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                        {t(c.success ? 'checkPassed' : 'checkMissed')}
                      </span>
                      {diceChecks[ev.id] === 'unverified' && (
                        <TriangleAlert size={13} className="shrink-0 text-amber-400" aria-label={t('diceUnverified')}>
                          <title>{t('diceUnverified')}</title>
                        </TriangleAlert>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1.5 pl-6 text-xs text-ink/60 tabular-nums">
                      <span>D20 {ev.result} {signedMod(c.mod)} =</span>
                      <span className="text-base font-bold leading-none text-ink">{c.total}</span>
                      {showDc && <span>{t('checkVs')} {c.dc}</span>}
                      {c.reason && <span className="min-w-0 truncate text-ink/45">· {c.reason}</span>}
                    </div>
                  </div>
                )
              } else {
                // dice roll ; plusieurs dés : leur total, sans critique ni échec
                const pool = ev.pool
                const isCrit = !pool && ev.result !== undefined && ev.dice !== undefined && ev.result === ev.dice
                const isFumble = !pool && ev.result === 1
                const resultColor = isCrit
                  ? 'text-yellow-300'
                  : isFumble
                  ? 'text-red-400'
                  : 'text-accent'
                const edge = isCrit
                  ? 'border-l-yellow-400'
                  : isFumble
                  ? 'border-l-red-400'
                  : 'border-l-accent'
                return (
                  <div key={ev.id} className={`animate-fadeIn ui-well flex items-center gap-2 px-2.5 py-1.5 border-l-2 ${edge} text-sm`}>
                    <Dices size={15} className="shrink-0 text-ink/50" />
                    <span className="max-w-[60%] shrink-0 truncate text-ink/75 text-xs font-semibold">{ev.player}</span>
                    {pool ? (
                      <span className="min-w-0 truncate text-ink/45 text-xs tabular-nums" title={pool.results.join(' + ')}>
                        {poolLabel(pool.dice)} · {pool.results.join(' + ')}
                      </span>
                    ) : (
                      ev.dice != null && <span className="text-ink/45 text-xs">D{ev.dice}</span>
                    )}
                    <span className="ml-auto font-bold text-lg leading-none tabular-nums">
                      <span className={resultColor}>{ev.result ?? '?'}</span>
                    </span>
                    {isCrit && <span className="text-xs">✨</span>}
                    {isFumble && <span className="text-xs">💀</span>}
                    {diceChecks[ev.id] === 'unverified' && (
                      <TriangleAlert size={13} className="shrink-0 text-amber-400" aria-label={t('diceUnverified')}>
                        <title>{t('diceUnverified')}</title>
                      </TriangleAlert>
                    )}
                  </div>
                )
              }
            })}
            </div>
            <div ref={endRef} />
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <input
              type="text"
              placeholder={t('yourMessage')}
              value={inputValue}
              maxLength={MAX_MESSAGE_LENGTH}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
              className="ui-input flex-1 min-w-0 !min-h-9"
            />
            <button
              onClick={sendMessage}
              className="ui-btn ui-btn-primary !min-h-9 flex-shrink-0"
            >
              {t('send')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default ChatBox




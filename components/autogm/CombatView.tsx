'use client'

import { useState } from 'react'
import { Backpack, Heart, Shield, Swords } from 'lucide-react'
import { useT } from '@/lib/useT'
import { checkStatLabel, withStat } from '@/lib/checks'
import type { Voter } from '@/lib/autoGm'
import { ROUND_MS, canTarget, usesLeft, waitingFor, type CombatState, type CombatStep } from '@/lib/autoGm/combat'
import { actionsFor, needsFoe, type CombatAction } from '@/lib/autoGm/combatActions'
import { combatLineText } from './combatText'

type Props = {
  combat?: CombatState
  step: CombatStep
  me: Voter | null
  /** Joueurs présents qui se battent. */
  players: readonly Voter[]
  iWatch: boolean
  /** Mon choix pour ce tour, s'il est fait (`round|action|ennemi`). */
  myChoice?: string
  onChoose: (action: string, foe?: string) => void
  now: number
  lang: 'fr' | 'en'
}

function Bar({ hp, max, tone }: { hp: number; max: number; tone: 'foe' | 'hero' }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0
  const color = tone === 'foe' ? 'bg-red-500' : ratio > 0.5 ? 'bg-emerald-500' : ratio > 0.25 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[var(--c-panel-line)]">
      <span className={`block h-full ${color} transition-[width] duration-500`} style={{ width: `${ratio * 100}%` }} />
    </span>
  )
}

/**
 * Combat au tour par tour du MJ automatique : les ennemis et leurs PV, le
 * groupe, les actions de ma classe, et le récit du tour d'avant.
 */
export default function CombatView({ combat, step, me, players, iWatch, myChoice, onChoose, now, lang }: Props) {
  const t = useT()
  const [target, setTarget] = useState<string | undefined>()

  if (!combat) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Swords size={14} className="shrink-0 text-gm" aria-hidden />
          {step.prompt}
        </p>
        <p className="text-sm text-ink/60">{t(players.some((v) => v.hero) ? 'combatStarting' : 'combatNoHero')}</p>
      </div>
    )
  }

  const foes = step.foes
  const nameOf = (id: string) => foes.find((f) => f.id === id)?.name ?? id
  const up = combat.foes.filter((f) => f.hp > 0)
  const chosen = up.find((f) => f.id === target) ?? up[0]
  const mine = me ? combat.heroes.find((h) => h.id === me.id) : undefined
  const present = new Set(players.map((v) => v.id))
  const waiting = waitingFor(combat, present)
  const myAttack = me ? combat.attacks.find((a) => a.userId === me.id) : undefined
  const choseThisRound = !!myChoice && myChoice.startsWith(`${combat.round}|`)
  const acted = !!me && combat.acted.includes(me.id)
  const canAct = !!mine && mine.hp > 0 && !acted && !myAttack && !choseThisRound && !combat.end && !iWatch
  const secondsLeft = Math.max(0, Math.ceil((combat.roundStart + ROUND_MS - now) / 1000))
  const all = actionsFor(me?.classe, !!step.flee, me?.items)
  const actions = all.filter((a) => !a.item)
  const items = all.filter((a) => a.item)
  const endText = combat.end === 'victory' ? 'combatVictory' : combat.end === 'fled' ? 'combatFled' : combat.end ? 'combatDefeat' : null
  const actionButton = (action: CombatAction) => {
    const left = mine ? usesLeft(combat, mine.id, action) : 0
    const usable = left > 0 && canTarget(combat, action, chosen?.id)
    const hint =
      action.effect === 'flee' && step.flee
        ? withStat(t('combatFleeHint'), t(checkStatLabel(step.flee.stat))).replace('{n}', String(step.flee.dc))
        : lang === 'fr'
          ? action.hintFr
          : action.hintEn
    const count = action.item ? 'combatItemsLeft' : 'combatUsesLeft'
    return (
      <button
        key={action.id}
        onClick={() => onChoose(action.id, needsFoe(action) ? chosen?.id : undefined)}
        disabled={!usable}
        title={hint}
        className="flex flex-col items-start gap-0.5 rounded-lg border border-[var(--c-panel-line)] px-2 py-1.5 text-left text-xs transition hover:border-gm/60 disabled:opacity-40"
      >
        <span className="flex w-full items-center gap-1 text-sm font-semibold">
          <span className="flex-1">{action[lang]}</span>
          {Number.isFinite(left) && <span className="text-[10px] font-normal text-ink/55">{t(count).replace('{n}', String(left))}</span>}
        </span>
        <span className="text-[11px] leading-snug text-ink/60">{hint}</span>
      </button>
    )
  }
  const lineList = (list: CombatState['lines']) =>
    list.map((line, i) => (
      <li key={i} className={line.k.startsWith('foe') || line.k === 'heroDown' ? 'text-red-300/90' : ''}>
        {combatLineText(line, t, foes, lang)}
      </li>
    ))

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Swords size={14} className="shrink-0 text-gm" aria-hidden />
        {step.prompt}
      </p>

      <div className="flex items-center justify-between text-xs text-ink/60">
        <span className="font-semibold text-gm">{t('combatRound').replace('{n}', String(combat.round))}</span>
        {!combat.end && <span>{t('combatSecondsLeft').replace('{n}', String(secondsLeft))}</span>}
      </div>

      {/* Les ennemis : un clic choisit la cible. */}
      <ul className="flex flex-col gap-1.5">
        {combat.foes.map((f) => {
          const down = f.hp <= 0
          const selected = !down && chosen?.id === f.id
          return (
            <li key={f.id}>
              <button
                onClick={() => setTarget(f.id)}
                disabled={down || !canAct}
                aria-pressed={selected}
                className={`flex w-full flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-left text-sm transition ${
                  down ? 'border-transparent opacity-40' : selected && canAct ? 'border-red-400/80' : 'border-[var(--c-panel-line)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`flex-1 ${down ? 'line-through' : ''}`}>{nameOf(f.id)}</span>
                  {f.stunned && <span className="text-[10px] text-amber-300">💫</span>}
                  <span className="text-xs tabular-nums text-ink/60">
                    {f.hp}/{f.max}
                  </span>
                </span>
                <Bar hp={f.hp} max={f.max} tone="foe" />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Le groupe. */}
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {combat.heroes.map((h) => (
          <li key={h.id} className={`flex flex-col gap-0.5 text-xs ${present.has(h.id) ? '' : 'opacity-40'}`}>
            <span className="flex items-center gap-1">
              <span className={`min-w-0 flex-1 truncate ${h.id === me?.id ? 'font-semibold' : ''}`}>{h.name}</span>
              {combat.guard.includes(h.id) && <Shield size={11} className="text-sky-300" aria-hidden />}
              <Heart size={10} className="text-red-400" aria-hidden />
              <span className="tabular-nums text-ink/70">
                {h.hp}/{h.max}
              </span>
            </span>
            <Bar hp={h.hp} max={h.max} tone="hero" />
          </li>
        ))}
      </ul>

      {endText ? (
        <p className={`text-sm font-semibold ${combat.end === 'victory' ? 'text-emerald-400' : 'text-amber-300'}`}>{t(endText)}</p>
      ) : iWatch ? (
        <p className="text-xs text-gm">{t('combatGmWatch')}</p>
      ) : !mine ? (
        <p className="text-sm text-ink/60">{t('combatNoHero')}</p>
      ) : mine.hp <= 0 ? (
        <p className="text-sm text-amber-300">{t('combatDown')}</p>
      ) : myAttack ? (
        <p className="text-sm text-gm">{t('combatRollYou')}</p>
      ) : !canAct ? (
        <p className="text-sm text-ink/60">{t('combatActed')}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="ui-label !text-[10px]">{t('combatYourTurn')}</p>
          <div className="grid grid-cols-2 gap-1.5">{actions.map(actionButton)}</div>
          <p className="ui-label mt-1 flex items-center gap-1 !text-[10px]">
            <Backpack size={11} aria-hidden />
            {t('combatItems')}
          </p>
          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">{items.map(actionButton)}</div>
          ) : (
            <p className="text-[11px] text-ink/55">{t('combatNoItems')}</p>
          )}
          {chosen && (
            <p className="text-[11px] text-ink/55">
              {t('combatTarget')} : {nameOf(chosen.id)}
            </p>
          )}
        </div>
      )}

      {!combat.end && waiting.length > 0 && (
        <p className="text-xs text-ink/55">{t('combatWaiting').replace('{n}', waiting.map((h) => h.name).join(', '))}</p>
      )}
      {combat.attacks
        .filter((x) => x.userId !== me?.id)
        .map((x) => (
          <p key={x.id} className="text-xs text-ink/60">
            {t('combatRolling').replace('{n}', combat.heroes.find((h) => h.id === x.userId)?.name ?? '?')}
          </p>
        ))}

      {combat.lines.length > 0 && <ul className="flex flex-col gap-0.5 text-xs text-ink/80">{lineList(combat.lines)}</ul>}
      {combat.last.length > 0 && (
        <div>
          <p className="ui-label !text-[10px]">{t('combatLastRound')}</p>
          <ul className="mt-1 flex flex-col gap-0.5 text-xs text-ink/70">{lineList(combat.last)}</ul>
        </div>
      )}
    </div>
  )
}

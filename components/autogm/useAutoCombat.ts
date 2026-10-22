'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@liveblocks/react'
import type { CheckOutcome, GmRequest } from '@/lib/checks'
import { CANCEL_GRACE_MS, type Voter } from '@/lib/autoGm'
import type { Foe, SceneStep } from '@/lib/autoGm/types'
import {
  END_DELAY_MS,
  FOES_DELAY_MS,
  ROUND_MS,
  attackRoll,
  canTarget,
  finish,
  foesTurn,
  resolveAction,
  roundDone,
  startCombat,
  targetFoe,
  toCombatHero,
  usesLeft,
  type CombatState,
  type CombatStep,
  type Fighter,
} from '@/lib/autoGm/combat'
import { actionById, actionName, needsRoll } from '@/lib/autoGm/combatActions'
import { postCheck } from '@/components/checks/postCheck'

const MAX_EVENTS = 2000
/** Un jet d'attaque jamais lancé compte comme raté après ce délai, pour ne pas bloquer le combat. */
const ROLL_TIMEOUT_MS = 2 * ROUND_MS

export const fighterOf = (v: Voter): Fighter => ({
  id: v.id,
  name: v.name,
  classe: v.classe,
  level: v.level,
  hp: v.hp,
  maxHp: v.maxHp,
  defense: v.defense,
  weapon: v.weapon,
  mods: v.mods,
  items: v.items,
})

/** Choix d'un joueur pour ce tour, rangé dans les votes de la scène. */
export const combatChoice = (round: number, action: string, foe?: string) => `${round}|${action}|${foe ?? ''}`

type Args = {
  roomId: string
  isLeader: boolean
  run?: string
  visit?: number
  step?: SceneStep
  ready: boolean
  combat?: CombatState
  /** Joueurs qui se battent (le MJ qui mène n'en est pas). */
  players: readonly Voter[]
  votes?: ReadonlyMap<string, string>
  events?: readonly { kind: string; requestId?: string; ts: number; check?: CheckOutcome }[] | null
  pending?: ReadonlyMap<string, GmRequest> | null
  go: (next: string, expected: number) => void
  /** Auteur des lignes du MJ dans l'historique. */
  author: string
  /** Récit d'un tour (et la fin du combat), dans la langue du meneur, pour l'historique. */
  recap: (lines: CombatState['lines'], round: number, foes: readonly Foe[], end?: CombatState['end']) => string | null
  lang: 'fr' | 'en'
}

/**
 * Le meneur fait tourner le combat de la scène : il le met en place, lit les
 * choix des joueurs (rangés dans les votes), demande les jets d'attaque,
 * applique leurs résultats, puis fait frapper les ennemis. Les règles sont
 * dans `lib/autoGm/combat.ts`.
 */
export function useAutoCombat(a: Args) {
  const { roomId, isLeader, run, visit, step, ready, combat, players, votes, events, pending, go, author, recap, lang } = a
  const fight = step?.kind === 'combat' ? (step as CombatStep) : undefined
  const [tick, setTick] = useState(0)
  const asked = useRef(new Set<string>())
  const inflight = useRef(0)
  const missing = useRef(new Map<string, number>())

  // Écrit le combat à partir de son état le plus récent, jamais d'une copie
  // en retard. Les ennemis tombés quittent le plateau.
  const patch = useMutation(
    (
      { storage },
      expected: number,
      fn: (c: CombatState | undefined) => CombatState | null,
      foes: readonly Foe[],
      say?: (c: CombatState) => string | null,
    ) => {
      const state = storage.get('autoGm')
      if (!state || state.get('visit') !== expected) return false
      const before = state.get('combat')
      const next = fn(before && before.visit === expected ? before : undefined)
      if (!next) return false
      state.set('combat', next)
      const images = storage.get('images')
      for (const f of next.foes) {
        const piece = f.hp <= 0 ? foes.find((d) => d.id === f.id)?.piece : undefined
        if (piece && images.has(piece)) images.delete(piece)
      }
      const text = say?.(next)
      if (text) {
        const list = storage.get('events')
        list.push({ id: crypto.randomUUID(), kind: 'chat', author, text, ts: Date.now(), isMJ: true })
        for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
      }
      return true
    },
    [author],
  )

  const heroes = players.filter((v) => v.hero)
  const present = new Set(heroes.map((v) => v.id))
  const presentKey = [...present].sort().join(',')

  // Mise en place, et les héros qui arrivent en plein combat.
  useEffect(() => {
    if (!isLeader || !ready || !fight || visit === undefined) return
    if (!combat || combat.visit !== visit) {
      if (heroes.length === 0) return
      patch(visit, (c) => (c ? null : startCombat(fight, heroes.map(fighterOf), visit, Date.now())), fight.foes)
      return
    }
    if (combat.end) return
    const joining = heroes.filter((v) => !combat.heroes.some((h) => h.id === v.id))
    if (joining.length === 0) return
    patch(
      visit,
      (c) => {
        const add = c ? joining.filter((v) => !c.heroes.some((h) => h.id === v.id)) : []
        return c && add.length > 0 ? { ...c, heroes: [...c.heroes, ...add.map((v) => toCombatHero(fighterOf(v)))] } : null
      },
      fight.foes,
    )
    // `heroes` change à chaque rendu : la liste des présents suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, ready, fight, visit, combat, presentKey, patch])

  // Choix des joueurs : une action tout de suite, ou un jet demandé d'abord.
  useEffect(() => {
    if (!isLeader || !fight || !combat || combat.end || !votes || combat.visit !== visit) return
    const round = combat.round
    for (const v of heroes) {
      const [r, actionId = '', foeWanted = ''] = (votes.get(v.id) ?? '').split('|')
      if (Number(r) !== round) continue
      const hero = combat.heroes.find((h) => h.id === v.id)
      if (!hero || hero.hp <= 0 || combat.acted.includes(v.id) || combat.attacks.some((x) => x.userId === v.id)) continue
      const key = `${run}:${visit}:${round}:${v.id}`
      if (asked.current.has(key)) continue
      const action = actionById(v.classe, actionId, v.items)
      if (!action || usesLeft(combat, v.id, action) <= 0 || (action.effect === 'flee' && !fight.flee)) continue
      if (!canTarget(combat, action, foeWanted || undefined)) continue
      asked.current.add(key)
      const f = fighterOf(v)
      const foe = targetFoe(combat, foeWanted || undefined)
      const sameRound = (c: CombatState | undefined): c is CombatState => !!c && c.round === round && !c.end && !c.acted.includes(v.id)
      if (!needsRoll(action)) {
        patch(visit, (c) => (sameRound(c) ? resolveAction(c, f, actionId, foe?.id, Math.random) : null), fight.foes)
        continue
      }
      const flee = action.effect === 'flee' ? fight.flee : undefined
      const roll = attackRoll(f, action, combat)
      const stat = flee ? flee.stat : roll.stat
      const mod = flee ? Math.max(-30, Math.min(30, v.mods[flee.stat] ?? 0)) : roll.mod
      const dc = flee ? flee.dc : (fight.foes.find((d) => d.id === foe?.id)?.defense ?? 10)
      const foeName = fight.foes.find((d) => d.id === foe?.id)?.name
      inflight.current += 1
      const expected = visit
      postCheck(roomId, {
        action: 'ask',
        targetId: v.id,
        targetName: v.name,
        stat,
        mod,
        dc,
        showDc: true,
        auto: 'combat',
        reason: flee || !foeName ? actionName(actionId, lang) : `${actionName(actionId, lang)} → ${foeName}`,
      })
        .then((d) => {
          const id = d?.id
          if (!id) throw new Error('no id')
          const kept = patch(
            expected,
            (c) => (sameRound(c) ? { ...c, attacks: [...c.attacks, { id, userId: v.id, action: actionId, ...(foe && !flee ? { foe: foe.id } : {}) }] } : null),
            fight.foes,
          )
          if (!kept) void postCheck(roomId, { action: 'cancel', id }).catch(() => {})
        })
        // Jet impossible à demander : l'action compte comme ratée.
        .catch(() => patch(expected, (c) => (sameRound(c) ? resolveAction(c, f, actionId, foe?.id, Math.random) : null), fight.foes))
        .finally(() => {
          inflight.current -= 1
          setTick((n) => n + 1)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, fight, combat, votes, visit, run, presentKey, roomId, patch, lang])

  // Jets d'attaque : appliqués quand le dé s'arrête, ou ratés s'ils ont disparu.
  useEffect(() => {
    if (!isLeader || !fight || !combat || combat.end || combat.attacks.length === 0 || visit === undefined) return
    const now = Date.now()
    let wake = Infinity
    for (const atk of combat.attacks) {
      const voter = heroes.find((v) => v.id === atk.userId)
      const hero = combat.heroes.find((h) => h.id === atk.userId)
      const f: Fighter = voter ? fighterOf(voter) : { id: atk.userId, name: hero?.name ?? '?', mods: {} }
      const drop = (roll?: { success: boolean; die: number }) =>
        patch(visit, (c) => (c?.attacks.some((x) => x.id === atk.id) ? resolveAction(c, f, atk.action, atk.foe, Math.random, roll) : null), fight.foes)
      const ev = events?.find((e) => e.kind === 'check' && e.requestId === atk.id)
      if (ev?.check) {
        // Le résultat compte quand le dé s'arrête à l'écran, pas avant.
        if (now < ev.ts) wake = Math.min(wake, ev.ts)
        else drop({ success: ev.check.success, die: ev.check.total - ev.check.mod })
        continue
      }
      const gone = !voter
      const late = now >= combat.roundStart + ROLL_TIMEOUT_MS
      if (pending?.has(atk.id) && !gone && !late) {
        missing.current.delete(atk.id)
        wake = Math.min(wake, combat.roundStart + ROLL_TIMEOUT_MS)
        continue
      }
      const since = missing.current.get(atk.id) ?? now
      missing.current.set(atk.id, since)
      if (!gone && !late && now < since + CANCEL_GRACE_MS) {
        wake = Math.min(wake, since + CANCEL_GRACE_MS)
        continue
      }
      if (pending?.has(atk.id)) void postCheck(roomId, { action: 'cancel', id: atk.id }).catch(() => {})
      drop()
    }
    if (wake === Infinity) return
    const timer = setTimeout(() => setTick((n) => n + 1), Math.max(0, wake - now) + 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, fight, combat, visit, events, pending, presentKey, roomId, patch, tick])

  // Tour des ennemis : quand tout le monde a agi, ou à la fin du temps.
  useEffect(() => {
    if (!isLeader || !fight || !combat || combat.end || visit === undefined || inflight.current > 0) return
    const now = Date.now()
    const round = combat.round
    if (roundDone(combat, present, now)) {
      const timer = setTimeout(
        () =>
          patch(
            visit,
            (c) => (c && c.round === round && roundDone(c, present, Date.now()) ? foesTurn(c, fight.foes, present, Math.random, Date.now()) : null),
            fight.foes,
            (c) => recap(c.last, c.round - 1, fight.foes),
          ),
        FOES_DELAY_MS,
      )
      return () => clearTimeout(timer)
    }
    if (combat.attacks.length > 0) return
    const timer = setTimeout(() => setTick((n) => n + 1), Math.max(0, combat.roundStart + ROUND_MS - now) + 50)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, fight, combat, visit, presentKey, patch, recap, tick])

  // Fin : le dernier tour se lit, puis la scène suivante.
  useEffect(() => {
    if (!isLeader || !fight || !combat?.end || visit === undefined || combat.visit !== visit) return
    if (!combat.endAt) {
      for (const atk of combat.attacks) void postCheck(roomId, { action: 'cancel', id: atk.id }).catch(() => {})
      // Fin pendant le tour des héros : ce tour n'est pas encore raconté.
      const told = combat.lines.length === 0
      patch(
        visit,
        (c) => (c?.end && !c.endAt ? { ...finish(c, Date.now()), attacks: [] } : null),
        fight.foes,
        (c) => recap(told ? [] : c.last, c.round, fight.foes, c.end),
      )
      return
    }
    const next = combat.end === 'victory' ? fight.victory : combat.end === 'fled' ? (fight.flee?.next ?? fight.defeat) : fight.defeat
    const timer = setTimeout(() => go(next, visit), Math.max(0, combat.endAt + END_DELAY_MS - Date.now()))
    return () => clearTimeout(timer)
  }, [isLeader, fight, combat, visit, roomId, patch, recap, go])
}

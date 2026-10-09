'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useOthers, useSelf, useStorage } from '@liveblocks/react'
import { LiveMap } from '@liveblocks/client'
import { Bot, Check, ChevronUp, Eye, EyeOff, Target, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useRoomSettings } from '@/lib/roomSettings'
import { CHECK_STATS, checkStatLabel, withStat } from '@/lib/checks'
import { statMod } from '@/lib/modifiers'
import { libraryUrl } from '@/lib/library'
import { useShowImage } from '@/components/canvas/ShownImage'
import { postCheck } from '@/components/checks/postCheck'
import { getTextColor } from '@/components/chat/LiveAvatarStack'
import { useStartAdventure } from './useStartAdventure'
import type { Character } from '@/types/character'
import {
  ADVENTURES,
  CHECK_READ_MS,
  NEUTRAL,
  VOTE_SETTLE_MS,
  VOTE_WINDOW_MS,
  availableOptions,
  best,
  decide,
  draw,
  drawable,
  type Voter,
} from '@/lib/autoGm'
import AdventureDuration from './AdventureDuration'

/** Ce qu'une scène fait à la fiche de chacun en arrivant. */
export type AutoGmEffect = { damage?: number; heal?: boolean }

type Props = {
  adventureId: string
  /** Appliqué par chaque joueur à sa propre fiche. */
  onEffect: (effect: AutoGmEffect) => void
}

const MAX_EVENTS = 2000

type Presence = { connectionId: number; id: string; pseudo: string; color: string; gm: boolean; character?: Character }

function toVoter(p: Presence): Voter {
  const c = p.character
  const mods: Record<string, number> = {}
  for (const { key } of CHECK_STATS) mods[key] = c ? statMod(c, key).total : 0
  return {
    id: p.id,
    connectionId: p.connectionId,
    name: (c?.nom && String(c.nom).trim()) || p.pseudo,
    pseudo: p.pseudo,
    color: p.color,
    gm: p.gm,
    mods,
    charisma: c ? Number(c.charisme) || 0 : 0,
  }
}

function Bubble({ voter, size = 20 }: { voter: Voter; size?: number }) {
  return (
    <span
      title={voter.name}
      className="flex shrink-0 select-none items-center justify-center rounded-full font-bold ring-2 ring-[var(--c-panel)]"
      style={{ backgroundColor: voter.color, color: getTextColor(voter.color), width: size, height: size, fontSize: size * 0.45 }}
    >
      {voter.pseudo.charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * MJ automatique : raconte une aventure écrite d'avance (`lib/autoGm`),
 * installe le plateau, fait voter le groupe et demande les jets.
 *
 * En mode « gm », le MJ de la table mène : il ne vote pas, ne lance pas les
 * jets du groupe et tranche les égalités. S'il part, on revient à la règle du
 * meilleur Charisme.
 *
 * Tout le monde voit le même panneau. Un seul navigateur, le « meneur »,
 * fait avancer la partie : le premier MJ connecté, ou le premier joueur
 * connecté s'il n'y a pas de MJ. S'il part, le suivant prend le relais là où
 * en était la partie, puisque tout est rangé dans le stockage partagé.
 */
export default function AutoGmPanel({ adventureId, onEffect }: Props) {
  const t = useT()
  const { id: roomId } = useParams<{ id: string }>()
  const { settings } = useRoomSettings()
  const showImage = useShowImage()
  const gm = useStorage((root) => root.autoGm)
  const events = useStorage((root) => root.events)
  const pending = useStorage((root) => root.checks)
  const [open, setOpen] = useState(true)
  const [gmSide, setGmSide] = useState(false)
  const [askFailed, setAskFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Les présences changent à chaque mouvement de souris : on ne garde que ce
  // qui compte ici, sérialisé, pour ne pas redessiner le panneau pour rien.
  const selfKey = useSelf((me) =>
    JSON.stringify({
      connectionId: me.connectionId,
      id: me.id,
      pseudo: me.presence.name || me.info?.pseudo || '?',
      color: me.presence.color || me.info?.color || '#888',
      gm: me.info?.role === 'gm',
      character: me.presence.character,
    } satisfies Presence),
  )
  const othersKey = useOthers((others) =>
    JSON.stringify(
      others
        .filter((o) => o.presence?.name || o.info?.pseudo)
        .map((o) => ({
          connectionId: o.connectionId,
          id: o.id,
          pseudo: o.presence.name || o.info?.pseudo || '?',
          color: o.presence.color || o.info?.color || '#888',
          gm: o.info?.role === 'gm',
          character: o.presence.character,
        }) satisfies Presence),
    ),
  )
  const me = useMemo(() => (selfKey ? toVoter(JSON.parse(selfKey) as Presence) : null), [selfKey])
  const voters = useMemo(() => {
    const list = (JSON.parse(othersKey) as Presence[]).map(toVoter)
    if (me) list.push(me)
    return list.sort((a, b) => a.connectionId - b.connectionId)
  }, [othersKey, me])

  const leader = voters.find((v) => v.gm) ?? voters[0]
  const isLeader = !!me && leader?.connectionId === me.connectionId
  // Mode « gm » : le MJ mène, seuls les joueurs votent et lancent.
  const gmLeads = gm?.mode === 'gm' && voters.some((v) => v.gm) && voters.some((v) => !v.gm)
  const players = useMemo(() => (gmLeads ? voters.filter((v) => !v.gm) : voters), [gmLeads, voters])
  const humanGm = gmLeads ? voters.find((v) => v.gm) : undefined
  const iWatch = gmLeads && !!me?.gm

  const adventure = ADVENTURES[gm?.adventure ?? adventureId]
  const scene = gm && adventure ? adventure.scenes[gm.scene] : undefined
  const step = scene?.step
  const ready = !!gm && gm.setup >= gm.visit
  const flags = gm?.flags
  const options = useMemo(() => (scene && flags ? availableOptions(scene, flags) : []), [scene, flags])
  const votes = gm?.votes
  const result =
    gm?.check && events
      ? events.find((e) => e.kind === 'check' && e.requestId === gm.check?.id)
      : undefined
  const revealed = !!result && now >= result.ts

  // ── Mutations ──────────────────────────────────────────────────────────

  const start = useStartAdventure()

  const stop = useMutation(({ storage }) => {
    const previous = storage.get('autoGm')?.get('check')
    if (previous) storage.get('checks')?.delete(previous.id)
    storage.delete('autoGm')
  }, [])

  // Passer à la scène suivante. `expected` évite de sauter deux scènes quand
  // deux joueurs cliquent ensemble : le second clic ne trouve plus la même visite.
  const go = useMutation(({ storage }, next: string, expected: number) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected) return
    const nextScene = ADVENTURES[state.get('adventure')]?.scenes[next]
    if (!nextScene) return
    const flags = state.get('flags')
    state.update({
      scene: next,
      visit: expected + 1,
      path: [...state.get('path'), next],
      flags: [...flags, ...(nextScene.gains ?? []).filter((f) => !flags.includes(f))],
      votes: new LiveMap<string, string>(),
    })
    state.delete('voteStart')
    state.delete('tiebreak')
    state.delete('check')
  }, [])

  // Met en place la scène : plateau, puis récit dans l'historique. Une seule
  // fois par visite, même si le meneur change en route.
  const setUp = useMutation(({ storage }, expected: number, author: string) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected || state.get('setup') >= expected) return null
    state.set('setup', expected)
    const current = ADVENTURES[state.get('adventure')]?.scenes[state.get('scene')]
    if (!current) return null
    const setup = current.setup
    const now = Date.now()
    if (setup?.map || setup?.pieces) {
      const images = storage.get('images')
      const oldMap = Array.from(images.values()).find((img) => img.kind === 'map')?.url
      // Les pions des joueurs restent ; le décor de la scène d'avant s'en va.
      for (const [key, img] of Array.from(images.entries())) if (!img.ownerId) images.delete(key)
      if (setup.map) {
        const url = libraryUrl('cartes', setup.map)
        images.set('auto-map', { id: 'auto-map', url, kind: 'map', x: 0, y: 0, width: 1, height: 1, createdAt: now })
        // Nouvelle carte, ou début d'aventure : les dessins d'avant n'ont plus de sens.
        if (url !== oldMap || expected === 1) {
          const strokes = storage.get('strokes')
          while (strokes.length > 0) strokes.delete(strokes.length - 1)
        }
      }
      setup.pieces?.forEach((p, i) => {
        images.set(p.id, {
          id: p.id,
          url: libraryUrl(p.category, p.item),
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          createdAt: now + 1 + i,
        })
      })
    }
    const list = storage.get('events')
    current.narration.forEach((text, i) => {
      list.push({ id: crypto.randomUUID(), kind: 'chat', author, text, ts: now + i, isMJ: true })
    })
    for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    return setup?.show ?? null
  }, [])

  const vote = useMutation(({ storage, self }, option: string, expected: number) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected || state.get('tiebreak')) return
    state.get('votes').set(self.id, option)
  }, [])

  const markVoteStart = useMutation(({ storage }, expected: number) => {
    const state = storage.get('autoGm')
    if (state && state.get('visit') === expected && !state.get('voteStart')) state.set('voteStart', Date.now())
  }, [])

  const setTiebreak = useMutation(
    ({ storage }, expected: number, tiebreak: { userId: string; name: string; options: string[] }) => {
      const state = storage.get('autoGm')
      if (state && state.get('visit') === expected) state.set('tiebreak', tiebreak)
    },
    [],
  )

  const setCheck = useMutation(
    ({ storage }, check: { id: string; userId: string; name: string; visit: number }) => {
      const state = storage.get('autoGm')
      if (state && state.get('visit') === check.visit && !state.get('check')) state.set('check', check)
    },
    [],
  )

  const dropCheck = useMutation(({ storage }, expected: number) => {
    const state = storage.get('autoGm')
    if (state && state.get('visit') === expected) state.delete('check')
  }, [])

  // ── Le meneur fait avancer la partie ────────────────────────────────────

  useEffect(() => {
    if (!isLeader || !gm || gm.setup >= gm.visit) return
    const shown = setUp(gm.visit, t(gm.mode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle'))
    if (shown) showImage(libraryUrl(shown.category, shown.item), shown.label)
  }, [isLeader, gm, setUp, showImage, t])

  // Vote : dépouillé quand tout le monde a choisi, ou à la fin du délai.
  useEffect(() => {
    if (!isLeader || !gm || !ready || step?.kind !== 'vote' || !votes) return
    if (votes.size > 0 && !gm.voteStart) {
      markVoteStart(gm.visit)
      return
    }
    const tie = gm.tiebreak
    if (tie && voters.some((v) => v.id === tie.userId)) return
    const allVoted = players.every((v) => votes.has(v.id))
    let wait: number
    if (tie) wait = 0
    else if (allVoted) wait = VOTE_SETTLE_MS
    else if (gm.voteStart) wait = Math.max(0, gm.voteStart + VOTE_WINDOW_MS - Date.now())
    else return
    const expected = gm.visit
    const timer = setTimeout(() => {
      const outcome = decide(options, votes, players, humanGm)
      if (!outcome) return
      if (outcome.kind === 'winner') go(outcome.option.next, expected)
      else
        setTiebreak(expected, {
          userId: outcome.decider.id,
          name: outcome.decider.name,
          options: outcome.options.map((o) => o.id),
        })
    }, wait)
    return () => clearTimeout(timer)
  }, [isLeader, gm, ready, step, votes, voters, players, humanGm, options, go, markVoteStart, setTiebreak])

  // Jet : demandé au meilleur du groupe dans la caractéristique, puis suivi
  // jusqu'au résultat. Si le lanceur part, on redemande à quelqu'un d'autre.
  // Visite déjà demandée, partie comprise : une nouvelle partie repasse par les mêmes numéros.
  const asked = useRef('')
  // Demande vue dans la liste partagée : si elle en disparaît sans résultat,
  // le MJ l'a annulée. Avant de l'y avoir vue, elle peut simplement ne pas
  // être encore arrivée.
  const listed = useRef<string | null>(null)
  useEffect(() => {
    if (!isLeader || !gm || !ready || step?.kind !== 'check') return
    const current = gm.check
    if (current) {
      if (result) return
      if (pending?.has(current.id)) listed.current = current.id
      const gone = !voters.some((v) => v.id === current.userId)
      const cancelled = listed.current === current.id && !pending?.has(current.id)
      if (gone || cancelled) {
        if (gone) void postCheck(roomId, { action: 'cancel', id: current.id }).catch(() => {})
        asked.current = ''
        dropCheck(gm.visit)
      }
      return
    }
    const visitId = `${gm.run}:${gm.visit}`
    if (asked.current === visitId || askFailed) return
    const roller = best(players, step.stat)
    if (!roller) return
    asked.current = visitId
    const expected = gm.visit
    postCheck(roomId, {
      action: 'ask',
      targetId: roller.id,
      targetName: roller.name,
      stat: step.stat,
      mod: Math.max(-30, Math.min(30, roller.mods[step.stat] ?? 0)),
      dc: step.dc,
      showDc: true,
      reason: step.reason,
    })
      .then((d) => {
        if (d?.id) setCheck({ id: d.id, userId: roller.id, name: roller.name, visit: expected })
      })
      .catch(() => {
        asked.current = ''
        setAskFailed(true)
      })
  }, [isLeader, gm, ready, step, voters, players, result, pending, roomId, askFailed, dropCheck, setCheck])

  useEffect(() => {
    if (!isLeader || !gm || !result || step?.kind !== 'check' || !result.check) return
    const next = result.check.success ? step.success : step.failure
    const expected = gm.visit
    const timer = setTimeout(() => go(next, expected), Math.max(0, result.ts + CHECK_READ_MS - Date.now()))
    return () => clearTimeout(timer)
  }, [isLeader, gm, result, step, go])

  // ── Chacun applique à sa fiche ce que la scène lui fait ─────────────────

  // La première visite vue sert de point de départ : un joueur qui arrive en
  // pleine partie ne reprend pas les dégâts d'une scène déjà passée.
  const seen = useRef<string | null>(null)
  const visitKey = gm ? `${gm.run}:${gm.visit}` : gm === null ? null : 'none'
  useEffect(() => {
    if (visitKey === null) return
    if (seen.current === null || seen.current === visitKey) {
      seen.current = visitKey
      return
    }
    seen.current = visitKey
    // Le MJ qui mène ne joue pas de personnage dans l'aventure.
    if (iWatch) return
    if (scene && (scene.damage || scene.heal)) onEffect({ damage: scene.damage, heal: scene.heal })
  }, [visitKey, scene, onEffect, iWatch])

  // Horloge du compte à rebours et de l'apparition du résultat.
  const ticking = (step?.kind === 'vote' && !!gm?.voteStart) || (!!result && !revealed)
  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [ticking])

  // ── Affichage ───────────────────────────────────────────────────────────

  if (!adventure) return null
  const title = t(gm?.mode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle')
  const box =
    'ui-panel ui-pop pointer-events-auto absolute left-3 top-14 z-30 flex max-h-[calc(100%-8rem)] w-[min(24rem,calc(100%-1.5rem))] flex-col shadow-lg'

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="ui-btn pointer-events-auto absolute left-3 top-14 z-30 !bg-[var(--c-panel-head)] shadow-lg"
      >
        <Bot size={15} className="text-gm" aria-hidden />
        {title}
        {scene && <span className="max-w-[10rem] truncate text-ink/60">· {scene.title}</span>}
      </button>
    )
  }

  const header = (
    <div className="flex items-center gap-2 border-b border-[var(--c-panel-line)] px-3 py-2">
      <Bot size={16} className="shrink-0 text-gm" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {title} <span className="font-normal text-ink/60">· {adventure.title}</span>
      </span>
      {gm && (
        <button
          onClick={() => setGmSide((v) => !v)}
          aria-pressed={gmSide}
          className={`ui-btn ui-btn-ghost !min-h-7 !px-2 text-xs ${gmSide ? 'text-gm' : ''}`}
          title={t('autoGmGmSide')}
        >
          {gmSide ? <EyeOff size={13} /> : <Eye size={13} />}
          {t('autoGmGmSide')}
        </button>
      )}
      <button onClick={() => setOpen(false)} className="ui-btn ui-btn-ghost !min-h-7 !px-1.5" aria-label={t('autoGmFold')}>
        <ChevronUp size={15} />
      </button>
    </div>
  )

  if (!gm || !scene || !step) {
    return (
      <div className={box}>
        {header}
        <div className="flex flex-col gap-3 p-3">
          <p className="text-sm text-ink/80">{t('autoGmIntro')}</p>
          <p className="text-sm italic text-ink/70">{adventure.pitch}</p>
          <AdventureDuration adventure={adventure} />
          <button onClick={() => start(adventure.id, 'auto')} className="ui-btn ui-btn-primary">
            {t('autoGmStart')}
          </button>
        </div>
      </div>
    )
  }

  const byId = new Map(voters.map((v) => [v.id, v]))
  const votersFor = (option: string) => players.filter((v) => votes?.get(v.id) === option)
  const myVote = me ? votes?.get(me.id) : undefined
  const tie = gm.tiebreak
  const iDecide = !!me && tie?.userId === me.id
  const gmDecides = !!tie && gm.mode === 'gm' && !!byId.get(tie.userId)?.gm
  const voteCount = players.filter((v) => votes?.has(v.id)).length
  const secondsLeft = gm.voteStart ? Math.max(0, Math.ceil((gm.voteStart + VOTE_WINDOW_MS - now) / 1000)) : null
  const titleOf = (id: string) => adventure.scenes[id]?.title ?? id

  const voteButton = (id: string, label: string, extra?: ReactNode) => {
    const who = votersFor(id)
    const mine = myVote === id
    return (
      <button
        key={id}
        onClick={() => vote(id, gm.visit)}
        disabled={!ready || !!tie || iWatch}
        aria-pressed={mine}
        className={`flex w-full flex-col gap-1 rounded-lg border px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
          mine
            ? 'border-gm bg-[color-mix(in_srgb,var(--c-panel)_80%,var(--c-gm))]'
            : 'border-[var(--c-panel-line)] hover:border-gm/60'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="flex-1">{label}</span>
          {mine && <Check size={14} className="shrink-0 text-gm" aria-hidden />}
        </span>
        {extra}
        {who.length > 0 &&
          (settings.anonymousVotes ? (
            <span className="text-xs text-ink/60">{t('autoGmVoteCount').replace('{n}', String(who.length))}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {who.map((v) => (
                <Bubble key={v.id} voter={v} />
              ))}
            </span>
          ))}
      </button>
    )
  }

  let body: ReactNode
  if (step.kind === 'continue') {
    body = (
      <button onClick={() => go(step.next, gm.visit)} disabled={!ready} className="ui-btn ui-btn-primary">
        {step.label ?? t('autoGmContinue')}
      </button>
    )
  } else if (step.kind === 'random') {
    // Le tirage se fait au clic : chacun lit le récit à son rythme avant.
    body = (
      <div className="flex flex-col gap-1.5">
        <button onClick={() => go(draw(step, gm.flags), gm.visit)} disabled={!ready} className="ui-btn ui-btn-primary">
          {step.label ?? t('autoGmContinue')}
        </button>
        <p className="text-xs text-ink/55">
          {t('autoGmRandomHint')}
          {gmSide && ` · ${t('autoGmLeadsTo').replace('{n}', drawable(step, gm.flags).map((o) => titleOf(o.next)).join(' / '))}`}
        </p>
      </div>
    )
  } else if (step.kind === 'vote') {
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">{step.prompt}</p>
        {tie ? (
          <>
            <p className="text-sm text-amber-300">
              {iDecide
                ? t(gmDecides ? 'autoGmTieGmYou' : 'autoGmTieYou')
                : t(gmDecides ? 'autoGmTieGm' : 'autoGmTie').replace('{n}', byId.get(tie.userId)?.name ?? tie.name)}
            </p>
            {options
              .filter((o) => tie.options.includes(o.id))
              .map((o) =>
                iDecide ? (
                  <button key={o.id} onClick={() => go(o.next, gm.visit)} className="ui-btn ui-btn-primary justify-start">
                    {o.label}
                  </button>
                ) : (
                  <p key={o.id} className="rounded-lg border border-[var(--c-panel-line)] px-3 py-2 text-sm">
                    {o.label}
                  </p>
                ),
              )}
          </>
        ) : (
          <>
            {options.map((o) =>
              voteButton(
                o.id,
                o.label,
                (o.needs || gmSide) && (
                  <span className="text-[11px] text-ink/55">
                    {o.needs && `✦ ${t('autoGmNeedsClue')}`}
                    {o.needs && gmSide && ' · '}
                    {gmSide && t('autoGmLeadsTo').replace('{n}', titleOf(o.next))}
                  </span>
                ),
              ),
            )}
            {players.length > 1 && voteButton(NEUTRAL, t('autoGmNeutral'))}
            {iWatch && <p className="text-xs text-gm">{t('autoGmGmWatch')}</p>}
            <p className="text-xs text-ink/55">
              {t('autoGmVoted').replace('{n}', String(voteCount)).replace('{m}', String(players.length))}
              {' · '}
              {secondsLeft !== null
                ? t('autoGmVoteEndsIn').replace('{n}', String(secondsLeft))
                : t('autoGmVoteHint').replace('{n}', String(VOTE_WINDOW_MS / 1000))}
            </p>
          </>
        )}
      </div>
    )
  } else if (step.kind === 'check') {
    const stat = t(checkStatLabel(step.stat))
    const roller = gm.check ? byId.get(gm.check.userId) : undefined
    const outcome = revealed ? result?.check : undefined
    body = (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Target size={14} className="shrink-0 text-gm" aria-hidden />
          {step.prompt}
        </p>
        <p className="text-xs text-ink/60">
          {withStat(t('checkOf'), stat)} · {t('checkPromptDc').replace('{n}', String(step.dc))}
        </p>
        {outcome ? (
          <p className={`text-sm font-semibold ${outcome.success ? 'text-emerald-400' : 'text-red-400'}`}>
            {outcome.success ? t('checkPassed') : t('checkMissed')} · {outcome.total} {t('checkVs')} {outcome.dc}
          </p>
        ) : gm.check ? (
          <p className="flex items-center gap-2 text-sm">
            {roller && <Bubble voter={roller} />}
            {gm.check.userId === me?.id
              ? withStat(t('autoGmCheckYou'), stat)
              : withStat(t('autoGmCheckWho'), stat).replace('{n}', gm.check.name)}
          </p>
        ) : askFailed && isLeader ? (
          <div className="flex items-center gap-2 text-sm text-amber-300">
            {t('autoGmCheckFailed')}
            <button onClick={() => setAskFailed(false)} className="ui-btn !min-h-7 text-xs">
              {t('autoGmRetry')}
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink/60">{t('autoGmCheckAsking')}</p>
        )}
      </div>
    )
  } else {
    body = (
      <div className="flex flex-col gap-2">
        <p className="text-base font-semibold text-gm">{step.title}</p>
        <div>
          <p className="ui-label !text-[10px]">{t('autoGmPath')}</p>
          <ol className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-ink/70">
            {gm.path.map((id, i) => (
              <li key={`${id}-${i}`}>
                {i > 0 && '→ '}
                {titleOf(id)}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => start(gm.adventure, gm.mode)} className="ui-btn ui-btn-primary">
            {t('autoGmReplay')}
          </button>
          <Link href="/salles" className="ui-btn">
            {t('autoGmCreateTable')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={box}>
      {header}
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-3">
        <div>
          {scene.chapter && <p className="ui-label !text-[10px] text-gm">{scene.chapter}</p>}
          <h3 className="text-base font-semibold">{scene.title}</h3>
        </div>
        <div className="flex flex-col gap-2 text-sm leading-relaxed text-ink/85">
          {scene.narration.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {gmSide && scene.gmNotes && (
          <p className="rounded-lg border border-gm/40 bg-[color-mix(in_srgb,var(--c-panel)_88%,var(--c-gm))] px-3 py-2 text-xs leading-snug text-ink/80">
            <b className="text-gm">{t('autoGmGmNotes')} · </b>
            {scene.gmNotes}
          </p>
        )}
        {body}
        {step.kind !== 'end' && (
          <button onClick={stop} className="ui-btn ui-btn-ghost !min-h-7 self-start text-xs text-ink/55">
            <X size={12} /> {t('autoGmStop')}
          </button>
        )}
      </div>
    </div>
  )
}

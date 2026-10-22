'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useParams } from 'next/navigation'
import { useMutation, useOthers, useSelf, useStorage } from '@liveblocks/react'
import { LiveMap, LiveObject } from '@liveblocks/client'
import {
  BookOpen,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Crown,
  Dices,
  Eye,
  EyeOff,
  MessageSquare,
  Shuffle,
  Signpost,
  Swords,
  Target,
  UserRound,
  X,
} from 'lucide-react'
import { useT } from '@/lib/useT'
import { translations } from '@/lib/translations'
import { useIsDesktop } from '@/lib/useIsDesktop'
import { useLanguage } from '@/components/context/LanguageContext'
import { useGameSystem, useRoomSettings } from '@/lib/roomSettings'
import { levelUpDice } from '@/lib/gameSystems'
import { levelUpTargets } from '@/lib/levelUp'
import { XP_PER_LEVEL, sceneXp, xpOf } from '@/lib/xp'
import { CHECK_STATS, checkStatLabel, withStat } from '@/lib/checks'
import { statMod } from '@/lib/modifiers'
import { libraryUrl } from '@/lib/library'
import { actionBonus, backgroundOf } from '@/lib/backgrounds'
import { useShowImage } from '@/components/canvas/ShownImage'
import { postCheck } from '@/components/checks/postCheck'
import { getTextColor } from '@/components/chat/LiveAvatarStack'
import { MUSIC_JOIN_EVENT, useSoundVolume } from '@/lib/sound'
import { LOBBY_TRACK, sceneMood, trackFor } from '@/lib/autoGm/music'
import { useStartAdventure } from './useStartAdventure'
import PremadeHeroPicker from './PremadeHeroPicker'
import type { PremadeHero } from '@/lib/premadeHeroes'
import type { Character } from '@/types/character'
import {
  ADVENTURES,
  adventureIn,
  CANCEL_GRACE_MS,
  CHECK_READ_MS,
  DEMO_ADVENTURE,
  NEUTRAL,
  VOTE_SETTLE_MS,
  VOTE_WINDOW_MS,
  availableOptions,
  best,
  checkMod,
  decide,
  draw,
  drawable,
  optionHint,
  trialNext,
  type Voter,
} from '@/lib/autoGm'
import type { CombatState } from '@/lib/autoGm/combat'
import { itemCounts, itemsUsed } from '@/lib/autoGm/combatActions'
import type { Foe } from '@/lib/autoGm/types'
import AdventureDuration from './AdventureDuration'
import TableSettings from '@/components/gm/TableSettings'
import MusicPreview from '@/components/music/MusicPreview'
import CombatView from './CombatView'
import { combatLineText } from './combatText'
import { combatChoice, useAutoCombat } from './useAutoCombat'

/** Ce qu'une scène fait à la fiche de chacun en arrivant. */
export type AutoGmEffect = {
  damage?: number
  heal?: boolean | number
  xp?: number
  hp?: number
  /** Objets bus ou lancés pendant un combat : identifiant de l'action → nombre. */
  consume?: Record<string, number>
  /** Objets trouvés dans la scène, nommés dans la langue du joueur. */
  loot?: { nom: string; n: number }[]
}

type Props = {
  adventureId: string
  /** Appliqué par chaque joueur à sa propre fiche. */
  onEffect: (effect: AutoGmEffect) => void
  /** Le joueur n'a pas encore de fiche : on lui propose un héros tout prêt. */
  needsHero: boolean
  onPickHero: (hero: PremadeHero) => void
  /** Lance les dés de la table pour la demande qui m'attend (création guidée). */
  onRoll: () => void
  /** Le chat de la table, rangé dans le dernier onglet du panneau. */
  chat: ReactNode
  /** Ouvre le panneau du MJ (seulement pour le MJ), proposé dans le salon d'attente. */
  onOpenGmMenu?: () => void
  /** Le plateau : le salon d'attente s'y affiche en grand. */
  lobbySlot?: HTMLElement | null
}

type Tab = 'story' | 'combat' | 'hero' | 'chat'

/** Lignes que le MJ automatique écrit lui-même : elles n'allument pas l'onglet du chat. */
const AUTO_AUTHORS = new Set<string | undefined>([
  translations.fr.autoGmTitle,
  translations.fr.autoGmTitleGm,
  translations.en.autoGmTitle,
  translations.en.autoGmTitleGm,
])

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
    hero: !!(c?.nom && String(c.nom).trim()),
    historique: c?.historique,
    classe: c?.classe ? String(c.classe) : undefined,
    xp: xpOf(c),
    level: Number(c?.niveau) || 1,
    ...(c ? combatSheet(c) : {}),
    items: itemCounts(c?.objets),
  }
}

/** PV, défense et arme de la fiche, pour le combat. */
function combatSheet(c: Character): Pick<Voter, 'hp' | 'maxHp' | 'defense' | 'weapon'> {
  const maxHp = Number(c.pv_max ?? c.pvMax) || 0
  const pv = Number(c.pv)
  const defense = Number(c.defense)
  return {
    ...(maxHp > 0 ? { maxHp } : {}),
    ...(c.pv !== undefined && c.pv !== '' && Number.isFinite(pv) ? { hp: pv } : maxHp > 0 ? { hp: maxHp } : {}),
    ...(defense > 0 ? { defense } : {}),
    ...(c.degats_armes ? { weapon: String(c.degats_armes) } : {}),
  }
}

/**
 * Lance un morceau d'ambiance pour toute la table, repris en boucle. Celui
 * qui tourne déjà n'est pas relancé (ni remis en route s'il a été coupé),
 * sauf avec `restart` : au début de l'aventure, la musique coupée pendant
 * le salon d'attente repart.
 */
function playAmbiance(storage: LiveObject<Liveblocks['Storage']>, id: string, restart = false) {
  const music = storage.get('music') as Liveblocks['Storage']['music'] | undefined
  if (!restart && music instanceof LiveObject && music.get('id') === id) return
  const fields = { id, playing: true, pos: 0, at: Date.now(), loop: true }
  if (music instanceof LiveObject) music.update(fields)
  else storage.set('music', new LiveObject(fields))
}

/** La table laisse le MJ automatique choisir la musique (réglage du MJ). */
function autoMusicOn(storage: LiveObject<Liveblocks['Storage']>) {
  return storage.get('settings')?.get('autoMusic') !== false
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
export default function AutoGmPanel({ adventureId, onEffect, needsHero, onPickHero, onRoll, chat, onOpenGmMenu, lobbySlot }: Props) {
  const t = useT()
  const { lang } = useLanguage()
  const { id: roomId } = useParams<{ id: string }>()
  const { settings } = useRoomSettings()
  const system = useGameSystem()
  const showImage = useShowImage()
  const gm = useStorage((root) => root.autoGm)
  const events = useStorage((root) => root.events)
  const pending = useStorage((root) => root.checks)
  const [tab, setTab] = useState<Tab>('story')
  const [heroLater, setHeroLater] = useState(false)
  const [combatSeen, setCombatSeen] = useState<string | null>(null)
  const [heroSeen, setHeroSeen] = useState(false)
  const [chatSeen, setChatSeen] = useState<string | null | undefined>(undefined)
  // Replié sur grand écran, comme l'était le chat : la même préférence.
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('chatPanelCollapsed') === '1',
  )
  useEffect(() => {
    try {
      localStorage.setItem('chatPanelCollapsed', collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])
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

  const adventureKey = gm?.adventure ?? adventureId
  const adventure = useMemo(() => adventureIn(adventureKey, lang), [adventureKey, lang])
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

  // Ligne d'historique pour le choix retenu après un vote ou une égalité.
  const gmMode = gm?.mode
  const groupChoice = useCallback(
    (label: string) => ({
      author: t(gmMode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle'),
      text: t('autoGmGroupChoice').replace('{n}', label),
    }),
    [t, gmMode],
  )

  // ── Mutations ──────────────────────────────────────────────────────────

  const start = useStartAdventure()

  const stop = useMutation(({ storage }) => {
    const state = storage.get('autoGm')
    const previous = state?.get('check')
    if (previous) storage.get('checks')?.delete(previous.id)
    for (const atk of state?.get('combat')?.attacks ?? []) storage.get('checks')?.delete(atk.id)
    storage.delete('autoGm')
  }, [])

  // Passer à la scène suivante. `expected` évite de sauter deux scènes quand
  // deux joueurs cliquent ensemble : le second clic ne trouve plus la même visite.
  // `said` : une ligne pour l'historique, le choix retenu après un vote.
  const go = useMutation(({ storage }, next: string, expected: number, said?: { author: string; text: string }) => {
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
    state.delete('combat')
    state.delete('trial')
    if (said) {
      const list = storage.get('events')
      list.push({ id: crypto.randomUUID(), kind: 'chat', author: said.author, text: said.text, ts: Date.now(), isMJ: true })
      for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    }
  }, [])

  // Met en place la scène : plateau, puis son titre dans l'historique (le
  // récit reste dans le panneau, pour ne pas noyer le chat). Une seule fois
  // par visite, même si le meneur change en route.
  const setUp = useMutation(({ storage }, expected: number, author: string) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected || state.get('setup') >= expected) return null
    state.set('setup', expected)
    // Le récit part dans l'historique dans la langue de celui qui le pose.
    const current = adventureIn(state.get('adventure'), lang)?.scenes[state.get('scene')]
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
    const base = ADVENTURES[state.get('adventure')]
    if (base && autoMusicOn(storage)) {
      const music = storage.get('music') as Liveblocks['Storage']['music'] | undefined
      const playing = music instanceof LiveObject ? music.get('id') : undefined
      playAmbiance(storage, trackFor(sceneMood(base, state.get('path')), playing, `${state.get('run')}:${expected}`), expected === 1)
    }
    const list = storage.get('events')
    const text = [current.chapter, current.title].filter(Boolean).join(' · ')
    list.push({ id: crypto.randomUUID(), kind: 'chat', author, text, ts: now, isMJ: true })
    for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    return setup?.show ?? null
  }, [lang])

  // Salon d'attente : « Prêt » (ou plus prêt). Quand tous les présents le
  // sont, la partie commence : le meneur met alors la première scène en place.
  const toggleReady = useMutation(({ storage, self }, present: string[]) => {
    const state = storage.get('autoGm')
    if (!state?.get('lobby')) return
    const before = state.get('ready') ?? []
    const ready = before.includes(self.id) ? before.filter((id) => id !== self.id) : [...before, self.id]
    if (present.every((id) => ready.includes(id))) {
      state.delete('lobby')
      state.delete('ready')
    } else state.set('ready', ready)
  }, [])

  // Quelqu'un est parti sans être prêt : ceux qui restent l'étaient peut-être tous.
  const leaveLobby = useMutation(({ storage }, present: string[]) => {
    const state = storage.get('autoGm')
    if (!state?.get('lobby') || present.length === 0) return
    const ready = state.get('ready') ?? []
    if (!present.every((id) => ready.includes(id))) return
    state.delete('lobby')
    state.delete('ready')
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

  // Épreuve : compte le jet, puis libère la place pour le suivant. Renvoie
  // les réussites et échecs après ce jet (une seule fois par jet).
  const recordTrial = useMutation(({ storage }, expected: number, checkId: string, success: boolean) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected || state.get('check')?.id !== checkId) return null
    const before = state.get('trial')
    const trial = before && before.visit === expected ? before : { visit: expected, ok: 0, ko: 0 }
    const after = { visit: expected, ok: trial.ok + (success ? 1 : 0), ko: trial.ko + (success ? 0 : 1) }
    state.set('trial', after)
    state.delete('check')
    return after
  }, [])

  // ── Le meneur fait avancer la partie ────────────────────────────────────

  useEffect(() => {
    if (!isLeader || !gm || gm.lobby || gm.setup >= gm.visit) return
    const shown = setUp(gm.visit, t(gm.mode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle'))
    if (shown) showImage(libraryUrl(shown.category, shown.item), shown.label, { adventure: gm.adventure, scene: gm.scene })
  }, [isLeader, gm, setUp, showImage, t])

  // Salon d'attente : le départ si ceux qui restent sont tous prêts. Pas de
  // musique avant : chacun règle et essaie le son de son côté.
  const presentIds = useMemo(() => [...new Set(voters.map((v) => v.id))], [voters])
  useEffect(() => {
    if (!isLeader || !gm?.lobby) return
    leaveLobby(presentIds)
  }, [isLeader, gm, presentIds, leaveLobby])

  const [musicVolume, setMusicVolume] = useSoundVolume('music')
  const [uiVolume, setUiVolume] = useSoundVolume('ui')

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
      if (outcome.kind === 'winner') go(outcome.option.next, expected, groupChoice(outcome.option.label))
      else
        setTiebreak(expected, {
          userId: outcome.decider.id,
          name: outcome.decider.name,
          options: outcome.options.map((o) => o.id),
        })
    }, wait)
    return () => clearTimeout(timer)
  }, [isLeader, gm, ready, step, votes, voters, players, humanGm, options, go, markVoteStart, setTiebreak, groupChoice])

  // Jet : demandé au meilleur du groupe dans la caractéristique, puis suivi
  // jusqu'au résultat. Si le lanceur part, on redemande à quelqu'un d'autre.
  // Visite déjà demandée, partie comprise : une nouvelle partie repasse par les mêmes numéros.
  const asked = useRef('')
  // Demande vue dans la liste partagée : si elle en disparaît sans résultat,
  // le MJ l'a annulée. Avant de l'y avoir vue, elle peut simplement ne pas
  // être encore arrivée.
  const listed = useRef<string | null>(null)
  // Demande disparue de la liste : son résultat peut arriver juste après. On
  // la croit annulée seulement si rien n'est venu au bout de quelques secondes.
  const missing = useRef<{ id: string; at: number } | null>(null)
  const [graceTick, setGraceTick] = useState(0)
  // Épreuve en cours : réussites et échecs de cette visite.
  const trial = gm?.trial && gm.trial.visit === gm.visit ? gm.trial : { visit: gm?.visit ?? 0, ok: 0, ko: 0 }
  const rolls = step?.kind === 'trial' ? trial.ok + trial.ko : 0
  useEffect(() => {
    if (!isLeader || !gm || !ready || (step?.kind !== 'check' && step?.kind !== 'trial')) return
    const current = gm.check
    if (current) {
      if (result) return
      if (pending?.has(current.id)) listed.current = current.id
      const gone = !voters.some((v) => v.id === current.userId)
      const cancelled = listed.current === current.id && !pending?.has(current.id)
      if (cancelled && !gone) {
        const at = Date.now()
        if (missing.current?.id !== current.id) missing.current = { id: current.id, at }
        const left = missing.current.at + CANCEL_GRACE_MS - at
        if (left > 0) {
          const timer = setTimeout(() => setGraceTick((n) => n + 1), left)
          return () => clearTimeout(timer)
        }
      }
      if (gone || cancelled) {
        if (gone) void postCheck(roomId, { action: 'cancel', id: current.id }).catch(() => {})
        asked.current = ''
        dropCheck(gm.visit)
      }
      return
    }
    // Une épreuve demande un jet par essai, jusqu'à ce que l'issue soit jouée.
    const visitId = `${gm.run}:${gm.visit}:${rolls}`
    if (asked.current === visitId || askFailed) return
    if (step.kind === 'trial' && trialNext(step, trial.ok, trial.ko)) return
    // Un joueur encore en train de créer son héros n'est pas appelé à lancer.
    // Pour une épreuve, chacun lance à son tour, le meilleur d'abord.
    const heroes = players.filter((v) => v.hero)
    const roller =
      step.kind === 'trial'
        ? [...heroes].sort(
            (a, b) => checkMod(b, step.stat, step.action) - checkMod(a, step.stat, step.action) || a.connectionId - b.connectionId,
          )[rolls % Math.max(1, heroes.length)]
        : best(heroes, step.stat, step.action)
    if (!roller) return
    asked.current = visitId
    const expected = gm.visit
    postCheck(roomId, {
      action: 'ask',
      targetId: roller.id,
      targetName: roller.name,
      stat: step.stat,
      mod: Math.max(-30, Math.min(30, checkMod(roller, step.stat, step.action))),
      dc: step.dc,
      showDc: true,
      auto: 'scene',
      // Le bonus d'historique est dit dans la raison : on voit d'où vient le +2.
      reason: actionBonus(roller.historique, step.action)
        ? `${step.reason} · ${backgroundOf(roller.historique, lang)?.nom} +${actionBonus(roller.historique, step.action)}`
        : step.reason,
    })
      .then((d) => {
        if (d?.id) setCheck({ id: d.id, userId: roller.id, name: roller.name, visit: expected })
      })
      .catch(() => {
        asked.current = ''
        setAskFailed(true)
      })
    // `trial` change à chaque rendu : le nombre de jets suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, gm, ready, step, voters, players, result, pending, roomId, askFailed, dropCheck, setCheck, lang, graceTick, rolls])

  useEffect(() => {
    if (!isLeader || !gm || !result || !result.check || !gm.check) return
    if (step?.kind !== 'check' && step?.kind !== 'trial') return
    const expected = gm.visit
    const checkId = gm.check.id
    const success = result.check.success
    const timer = setTimeout(
      () => {
        if (step.kind === 'check') return go(success ? step.success : step.failure, expected)
        const after = recordTrial(expected, checkId, success)
        const next = after && trialNext(step, after.ok, after.ko)
        if (next) go(next, expected)
      },
      Math.max(0, result.ts + CHECK_READ_MS - Date.now()),
    )
    return () => clearTimeout(timer)
  }, [isLeader, gm, result, step, go, recordTrial])

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
    // Chaque scène traversée rapporte de l'XP, plus après un combat gagné ou
    // une étape de la quête : parler ou ruser fait aussi avancer.
    const xp = me?.hero && adventure && gm ? sceneXp(adventure, gm.scene, gm.path[gm.path.length - 2]) : 0
    const loot = me?.hero && scene?.loot?.length ? scene.loot.map((l) => ({ nom: l[lang], n: l.n ?? 1 })) : undefined
    if (scene && (scene.damage || scene.heal || xp || loot))
      onEffect({ damage: scene.damage, heal: scene.heal, ...(xp ? { xp } : {}), ...(loot ? { loot } : {}) })
  }, [visitKey, scene, onEffect, iWatch, me?.hero, adventure, gm, lang])

  // ── Montée de niveau automatique ────────────────────────────────────────

  // Barre d'XP pleine : le meneur demande les dés de niveau au héros, à un
  // moment calme seulement (ni jet en cours, ni scène qui fait mal). Une
  // seule demande par niveau ; si elle échoue, le MJ humain prend le relais.
  const leveled = useRef(new Set<string>())
  const calm = ready && step?.kind !== 'check' && step?.kind !== 'trial' && step?.kind !== 'combat' && !gm?.check && !scene?.damage
  useEffect(() => {
    if (!isLeader || !calm || !settings.autoLevelUp || system.levelUp.length === 0) return
    const busy = new Set(pending ? Array.from(pending.values(), (r) => r.targetId) : [])
    const hero = players.find(
      (v) => v.hero && (v.xp ?? 0) >= XP_PER_LEVEL && !busy.has(v.id) && !leveled.current.has(`${v.id}:${v.level}`),
    )
    if (!hero) return
    leveled.current.add(`${hero.id}:${hero.level}`)
    const level = (hero.level ?? 1) + 1
    void postCheck(roomId, {
      action: 'ask',
      type: 'rolls',
      system: system.id,
      targetId: hero.id,
      targetName: hero.name,
      dice: 6,
      count: levelUpDice(system),
      levelUp: true,
      ...(system.levelUpStats ? { targets: levelUpTargets(system, { classe: hero.classe ?? '', niveau: hero.level ?? 1 }) } : {}),
      auto: 'level',
      reason: t('xpAutoReason').replace('{n}', String(level)),
    }).catch(() => {})
  }, [isLeader, calm, settings.autoLevelUp, system, players, pending, roomId, t])

  // ── Combat ──────────────────────────────────────────────────────────────

  const combat = gm?.combat && gm.combat.visit === gm.visit ? (gm.combat as CombatState) : undefined
  const author = t(gm?.mode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle')
  // Le récit d'un tour part dans l'historique, dans la langue du meneur.
  const recap = useCallback(
    (lines: CombatState['lines'], round: number, foes: readonly Foe[], end?: CombatState['end']) => {
      const told = lines.map((line) => combatLineText(line, t, foes, lang)).join(' ')
      const endKey = end === 'victory' ? 'combatVictory' : end === 'fled' ? 'combatFled' : end ? 'combatDefeat' : null
      const parts = [told && `${t('combatRound').replace('{n}', String(round))} · ${told}`, endKey && t(endKey)].filter(Boolean)
      return parts.length > 0 ? parts.join(' ') : null
    },
    [t, lang],
  )
  useAutoCombat({
    roomId,
    isLeader,
    run: gm?.run,
    visit: gm?.visit,
    step,
    ready,
    combat,
    players,
    votes,
    events,
    pending,
    go,
    author,
    recap,
    lang,
  })

  // Mes PV suivent le combat sur ma fiche, tour après tour ; les objets
  // utilisés quittent le sac une fois le combat fini (un seul appel, la fiche
  // ne se met pas à jour deux fois dans le même instant).
  const myCombatHp = me ? combat?.heroes.find((h) => h.id === me.id)?.hp : undefined
  const myUsed = me && combat?.end ? JSON.stringify(itemsUsed(combat.used, me.id)) : ''
  const synced = useRef('')
  const consumed = useRef('')
  useEffect(() => {
    if (iWatch || myCombatHp === undefined || !gm) return
    const fight = `${gm.run}:${gm.visit}`
    const key = `${fight}:${myCombatHp}:${myUsed}`
    if (synced.current === key) return
    synced.current = key
    const used: Record<string, number> = myUsed && consumed.current !== fight ? JSON.parse(myUsed) : {}
    if (myUsed) consumed.current = fight
    const consume = Object.keys(used).length > 0 ? used : undefined
    if (myCombatHp !== me?.hp || consume) onEffect({ hp: myCombatHp, ...(consume ? { consume } : {}) })
  }, [iWatch, myCombatHp, myUsed, gm, me?.hp, onEffect])

  // Horloge du compte à rebours et de l'apparition du résultat.
  const ticking = (step?.kind === 'vote' && !!gm?.voteStart) || (!!result && !revealed) || (!!combat && !combat.end)
  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [ticking])

  // ── Onglets ─────────────────────────────────────────────────────────────

  // Combat et création du héros ont chacun leur onglet, ouvert d'office quand
  // ils commencent ; on revient au récit quand ils n'ont plus lieu d'être.
  const showCombat = !!adventure && step?.kind === 'combat'
  // « Plus tard » ramène au récit, mais l'onglet du héros reste là pour y revenir.
  const showHero = !!adventure && needsHero && !iWatch && step?.kind !== 'end'
  const combatKey = showCombat && gm ? `${gm.run}:${gm.visit}` : null
  if (combatKey !== combatSeen) {
    setCombatSeen(combatKey)
    if (combatKey) setTab('combat')
  }
  if (showHero !== heroSeen) {
    setHeroSeen(showHero)
    if (showHero && !heroLater) setTab('hero')
  }
  const current: Tab = !adventure
    ? 'chat'
    : (tab === 'combat' && !showCombat) || (tab === 'hero' && !showHero)
      ? 'story'
      : tab

  // Point sur l'onglet du chat : un message d'un joueur pas encore vu.
  const lastChat = useMemo(() => {
    if (!events) return null
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const e = events[i]
      if (e?.kind === 'chat' && !AUTO_AUTHORS.has(e.author)) return e.id
    }
    return null
  }, [events])
  if (events && (chatSeen === undefined || (current === 'chat' && chatSeen !== lastChat))) setChatSeen(lastChat)
  const chatUnread = current !== 'chat' && chatSeen !== undefined && chatSeen !== lastChat

  // ── Affichage ───────────────────────────────────────────────────────────

  const title = t(gm?.mode === 'gm' ? 'autoGmTitleGm' : 'autoGmTitle')

  // Tous les onglets restent montés, cachés : un héros en cours de création
  // garde ses réponses et ses dés, le chat son brouillon.
  const frame = (story: ReactNode, fight?: ReactNode) => {
    const tabs: { key: Tab; label: string; Icon: typeof Bot; dot?: boolean }[] = [
      ...(adventure ? [{ key: 'story' as const, label: t('autoGmTabStory'), Icon: BookOpen }] : []),
      ...(showCombat ? [{ key: 'combat' as const, label: t('autoGmTabCombat'), Icon: Swords }] : []),
      ...(showHero ? [{ key: 'hero' as const, label: t('autoGmTabHero'), Icon: UserRound }] : []),
      { key: 'chat', label: t('chat'), Icon: MessageSquare, dot: chatUnread },
    ]
    const pane = (key: Tab) => (current === key ? 'flex' : 'hidden')
    const folded = collapsed && isDesktop
    return (
      <>
        {folded && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label={t('expandPanel')}
            title={t('expandPanel')}
            className="ui-btn ui-btn-icon absolute right-3 top-16 z-50"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <aside
          className={`${folded ? 'hidden' : 'flex'} ui-panel relative min-h-0 w-full flex-1 flex-shrink-0 flex-col overflow-hidden lg:w-[380px] lg:flex-none`}
        >
          <div
            role="tablist"
            className="flex items-center gap-1 border-b border-[var(--c-panel-line)] px-2 py-1.5"
            style={{ background: 'var(--c-panel-head)' }}
          >
            {tabs.map(({ key, label, Icon, dot }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={current === key}
                onClick={() => setTab(key)}
                className={`relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-1.5 py-1.5 text-xs font-semibold transition ${
                  current === key ? 'bg-accent/15 text-accent' : 'text-ink/60 hover:text-ink'
                }`}
              >
                <Icon size={14} className="shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
                {dot && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />}
              </button>
            ))}
            <button
              onClick={() => setCollapsed(true)}
              aria-label={t('collapsePanel')}
              title={t('collapsePanel')}
              className="ui-btn ui-btn-ghost ui-btn-icon max-lg:hidden"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          {adventure && <div className={`${pane('story')} min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3`}>{story}</div>}
          {showCombat && <div className={`${pane('combat')} min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3`}>{fight}</div>}
          {showHero && (
            <div className={`${pane('hero')} min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3`}>
              <PremadeHeroPicker
                onPick={onPickHero}
                onRoll={onRoll}
                onLater={() => {
                  setHeroLater(true)
                  setTab('story')
                }}
              />
            </div>
          )}
          <div className={`${pane('chat')} min-h-0 flex-1 flex-col`}>{chat}</div>
        </aside>
      </>
    )
  }

  if (!adventure) return frame(null)

  const header = (
    <div className="flex items-center gap-2">
      <Bot size={16} className="shrink-0 text-gm" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink/70">
        {title} <span className="font-normal text-ink/55">· {adventure.title}</span>
      </span>
      {gm?.mode === 'gm' && me?.gm && (
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
    </div>
  )

  if (!gm || !scene || !step) {
    return frame(
      <>
        {header}
        <p className="text-sm text-ink/80">{t('autoGmIntro')}</p>
        <p className="text-sm italic text-ink/70">{adventure.pitch}</p>
        <AdventureDuration adventure={adventure} />
        <button onClick={() => start(adventure.id, 'auto')} className="ui-btn ui-btn-primary">
          {t('autoGmStart')}
        </button>
      </>,
    )
  }

  if (gm.lobby) {
    const readyIds = gm.ready ?? []
    const iAmReady = !!me && readyIds.includes(me.id)
    // Un clic de l'utilisateur : le navigateur laissera partir la musique de
    // la table quand l'aventure commencera.
    const joinMusic = () => window.dispatchEvent(new Event(MUSIC_JOIN_EVENT))
    const readyButton = (
      <button
        onClick={() => {
          joinMusic()
          toggleReady(presentIds)
        }}
        aria-pressed={iAmReady}
        className={`ui-btn ${iAmReady ? '' : 'ui-btn-primary'}`}
      >
        {iAmReady ? t('lobbyNotReady') : t('lobbyReady')}
      </button>
    )
    const slider = (label: string, value: number, onChange: (v: number) => void) => (
      <label className="flex items-center gap-3 text-sm text-ink/75">
        <span className="w-32 shrink-0">{label}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1"
        />
        <span className="w-8 shrink-0 text-right tabular-nums text-ink/55">{value}</span>
      </label>
    )
    // Avant la première scène, le plateau est vide : le salon s'y affiche en
    // grand, sur le fond du thème, pour toute la table.
    const lobby = (
      <div
        className="@container pointer-events-auto absolute inset-0 flex overflow-y-auto px-4 pb-4 pt-16"
        style={{ background: 'var(--c-page)' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="m-auto grid w-full max-w-5xl gap-4 @xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="ui-label !text-[11px] text-gm">{t('lobbyTitle')}</p>
              <h2 className="text-2xl font-semibold">{adventure.title}</h2>
              <p className="mt-1 text-sm italic text-ink/70">{adventure.pitch}</p>
              <div className="mt-2">
                <AdventureDuration adventure={adventure} />
              </div>
            </div>
            <section className="ui-panel flex flex-col gap-3 p-4">
              <h3 className="ui-label !text-[10px]">{t('lobbySound')}</h3>
              <p className="text-sm text-ink/80">{t('lobbySoundIntro')}</p>
              {slider(t('lobbyMusicVolume'), musicVolume, setMusicVolume)}
              {slider(t('uiSoundVolume'), uiVolume, setUiVolume)}
              <MusicPreview trackId={LOBBY_TRACK} />
              <p className="text-xs text-ink/55">{t('lobbySoundHint')}</p>
            </section>
            <section className="ui-panel flex flex-col gap-3 p-4">
              <h3 className="ui-label !text-[10px]">{t('lobbyTable')}</h3>
              {showHero && (
                <p className="text-sm text-amber-300">
                  {t('lobbyPickHero')}{' '}
                  <button
                    onClick={() => {
                      setCollapsed(false)
                      setTab('hero')
                    }}
                    className="font-semibold underline"
                  >
                    {t('autoGmTabHero')}
                  </button>
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {voters.map((v) => (
                  <li key={v.connectionId} className="flex items-center gap-2 text-sm">
                    <Bubble voter={v} />
                    <span className="min-w-0 flex-1 truncate">{v.name}</span>
                    {readyIds.includes(v.id) ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <Check size={12} aria-hidden /> {t('lobbyIsReady')}
                      </span>
                    ) : (
                      <span className="text-xs text-ink/50">{t('lobbyWaiting')}</span>
                    )}
                  </li>
                ))}
              </ul>
              {readyButton}
              <p className="text-xs text-ink/55">{t(voters.length > 1 ? 'lobbyReadyHint' : 'lobbySoloHint')}</p>
            </section>
          </div>
          <section className="ui-panel flex min-w-0 flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="ui-label !text-[10px]">{t('lobbySettings')}</h3>
              {me?.gm && onOpenGmMenu && (
                <button onClick={onOpenGmMenu} className="ui-btn !min-h-8 ml-auto text-xs">
                  <Crown size={13} className="text-gm" aria-hidden /> {t('lobbyGmMenu')}
                </button>
              )}
            </div>
            <p className="text-xs text-ink/60">{t(me?.gm ? 'lobbySettingsGm' : 'lobbySettingsPlayer')}</p>
            <TableSettings readOnly={!me?.gm} />
          </section>
        </div>
      </div>
    )
    return (
      <>
        {lobbySlot && createPortal(lobby, lobbySlot)}
        {frame(
          <>
            {header}
            <div>
              <p className="ui-label !text-[10px] text-gm">{t('lobbyTitle')}</p>
              <h3 className="text-base font-semibold">{adventure.title}</h3>
            </div>
            <p className="text-sm text-ink/75">{t('lobbyOnBoard')}</p>
            {readyButton}
          </>,
        )}
      </>
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

  // Sous chaque choix, le genre d'épreuve qui suit : jet de quelle
  // caractéristique, combat, hasard ou nouveau choix.
  const hintOf = (next: string) => {
    const hint = optionHint(adventure, next)
    if (hint.kind === 'check') return { Icon: Target, text: withStat(t('checkOf'), t(checkStatLabel(hint.stat))) }
    if (hint.kind === 'combat') return { Icon: Swords, text: t('autoGmHintCombat') }
    if (hint.kind === 'random') return { Icon: Shuffle, text: t('autoGmHintRandom') }
    if (hint.kind === 'choice') return { Icon: Signpost, text: t('autoGmHintChoice') }
    return { Icon: CircleHelp, text: t('autoGmHintUnknown') }
  }

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
                  <button key={o.id} onClick={() => go(o.next, gm.visit, groupChoice(o.label))} className="ui-btn ui-btn-primary justify-start">
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
            {options.map((o) => {
              const { Icon, text } = hintOf(o.next)
              return voteButton(
                o.id,
                o.label,
                <span className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-ink/55">
                  <Icon size={11} className="shrink-0 text-gm" aria-hidden />
                  {text}
                  {o.needs && ` · ✦ ${t('autoGmNeedsClue')}`}
                  {gmSide && ` · ${t('autoGmLeadsTo').replace('{n}', titleOf(o.next))}`}
                </span>,
              )
            })}
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
  } else if (step.kind === 'combat') {
    // Le combat a son onglet : ici, seulement de quoi y revenir.
    body = (
      <button onClick={() => setTab('combat')} className="ui-btn ui-btn-primary">
        <Swords size={14} aria-hidden /> {t('autoGmSeeCombat')}
      </button>
    )
  } else if (step.kind === 'check' || step.kind === 'trial') {
    const stat = t(checkStatLabel(step.stat))
    const roller = gm.check ? byId.get(gm.check.userId) : undefined
    const outcome = revealed ? result?.check : undefined
    body = (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          {step.kind === 'trial' ? (
            <Dices size={14} className="shrink-0 text-gm" aria-hidden />
          ) : (
            <Target size={14} className="shrink-0 text-gm" aria-hidden />
          )}
          {step.prompt}
        </p>
        <p className="text-xs text-ink/60">
          {withStat(t('checkOf'), stat)} · {t('checkPromptDc').replace('{n}', String(step.dc))}
        </p>
        {step.kind === 'trial' && (
          <p className="text-xs font-semibold text-gm">
            {t('trialProgress')
              .replace('{ok}', String(trial.ok))
              .replace('{need}', String(step.need))
              .replace('{left}', String(Math.max(0, step.tries - trial.ok - trial.ko)))}
          </p>
        )}
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
  } else if (step.kind === 'end') {
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
        {/* Rejouer reprend la même aventure au début, avec les mêmes héros :
            les choix et les tirages au hasard mènent ailleurs. */}
        <p className="text-xs text-ink/60">{t('autoGmReplayHint')}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => start(gm.adventure, gm.mode, false)} className="ui-btn ui-btn-primary">
            {t('autoGmReplay')}
          </button>
          <Link href="/salles" className="ui-btn">
            {gm.adventure === DEMO_ADVENTURE ? t('autoGmCreateTable') : t('autoGmQuit')}
          </Link>
        </div>
      </div>
    )
  }

  const sceneTitle = (
    <div>
      {scene.chapter && <p className="ui-label !text-[10px] text-gm">{scene.chapter}</p>}
      <h3 className="text-base font-semibold">{scene.title}</h3>
    </div>
  )

  return frame(
    <>
      {header}
      {sceneTitle}
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
      {step.kind !== 'end' && me?.gm && (
        <button onClick={stop} className="ui-btn ui-btn-ghost !min-h-7 self-start text-xs text-ink/55">
          <X size={12} /> {t('autoGmStop')}
        </button>
      )}
    </>,
    step.kind === 'combat' && (
      <>
        {sceneTitle}
        <CombatView
          combat={combat}
          step={step}
          me={me}
          players={players}
          iWatch={iWatch}
          myChoice={me ? votes?.get(me.id) : undefined}
          onChoose={(action, foe) => combat && vote(combatChoice(combat.round, action, foe), gm.visit)}
          now={now}
          lang={lang}
        />
      </>
    ),
  )
}

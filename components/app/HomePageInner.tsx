'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers, useSelf, useStorage } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
import DiceBoxTable, {
  RELAUNCH_MS, THROW_FADE_MS, THROW_HOLD_MS, type DiceBoxHandle, type ThrowResult, type ThrowSent,
} from '@/components/dice/DiceBoxTable'
import CheckPrompt from '@/components/checks/CheckPrompt'
import CheckBanner from '@/components/checks/CheckBanner'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import DemoBanner from '@/components/rooms/DemoBanner'
import MusicPlayer from '@/components/music/MusicPlayer'
import LiveAvatarStack from '@/components/chat/LiveAvatarStack'
import SignedOutPanel from '@/components/auth/SignedOutPanel'
import GMPanel from '@/components/gm/GMPanel'
import useProfile from './hooks/useProfile'
import ErrorBoundary from '@/components/misc/ErrorBoundary'
import MobileTabBar, { type MobileTab } from '@/components/app/MobileTabBar'
import { debug } from '@/lib/debug'
import { roomAuthHeaders } from '@/lib/roomsApi'
import { saveAccountCharacter } from '@/lib/charactersApi'
import { useTheme } from '@/components/context/ThemeContext'
import { useT } from '@/lib/useT'
import { canEditSheet, useRoomSettings } from '@/lib/roomSettings'
import type { RollsOutcome } from '@/lib/checks'
import { DICE_MAX_ROLL_MS, DICE_REVEAL_DELAY_MS } from '@/lib/dicePayload'
import { isDiceType, POOL_MAX, poolLabel, sortDice } from '@/lib/dicePool'
import { applyLevelUp } from '@/lib/levelUp'
import { Crown } from 'lucide-react'
import {
  type Character,
  buildCharacterKey,
  buildSelectionKey,
  normalizeCharacter,
  parseSelectionKey,
  isOwnedBy,
} from '@/types/character'

const SELECTED_CHARACTER_KEY = 'selectedCharacterId'
const DICE_POOL_KEY = 'dicePool'

// Le dernier choix du menu de dés, un D20 sinon.
function loadDicePool(): number[] {
  try {
    const saved = JSON.parse(localStorage.getItem(DICE_POOL_KEY) ?? 'null')
    if (Array.isArray(saved) && saved.length <= POOL_MAX && saved.every(isDiceType)) return sortDice(saved)
  } catch {}
  return [20]
}

export default function HomePageInner() {
  const router = useRouter()
  const { theme } = useTheme()
  const t = useT()
  const profile = useProfile()
  const user = profile?.pseudo ?? null
  const self = useSelf()
  const myConnectionId = self?.connectionId ?? null
  // Rôle dans cette table, fixé par le serveur à l'ouverture de la session.
  const isGM = self?.info?.role === 'gm'
  const { settings } = useRoomSettings()
  const sheetEditable = canEditSheet(settings, isGM)
  const [gmPanelOpen, setGmPanelOpen] = useState(false)
  const [perso, setPerso] = useState<Character>(() =>
    normalizeCharacter(defaultPerso),
  )
  const [characters, setCharacters] = useState<Character[]>([])
  // Le MJ peut ouvrir la fiche d'un joueur : ses modifications partent alors
  // vers ce joueur, et sa propre fiche est mise de côté le temps de la visite.
  const [viewedConnectionId, setViewedConnectionId] = useState<number | null>(null)
  const gmOwnPersoRef = useRef<Character | null>(null)
  const viewedStillHere = useOthers((others) =>
    viewedConnectionId === null || others.some((o) => o.connectionId === viewedConnectionId),
  )
  const viewedCharacter = useOthers(
    (others) =>
      viewedConnectionId === null
        ? null
        : others.find((o) => o.connectionId === viewedConnectionId)?.presence?.character ?? null,
    (a, b) => a?.id === b?.id && a?.updatedAt === b?.updatedAt,
  )
  // Compte Liveblocks du joueur consulté : c'est lui que vise une montée de niveau.
  const viewedUserId = useOthers((others) =>
    viewedConnectionId === null ? null : others.find((o) => o.connectionId === viewedConnectionId)?.id ?? null,
  )

  // Dés choisis dans le menu, gardés d'une visite à l'autre.
  const [dicePool, setDicePool] = useState<number[]>(loadDicePool)
  const changeDicePool = (dice: number[]) => {
    setDicePool(dice)
    try {
      localStorage.setItem(DICE_POOL_KEY, JSON.stringify(dice))
    } catch {}
  }
  const [diceDisabled, setDiceDisabled] = useState(false)
  // Mon lancer en cours sur la table, jusqu'à ce que ses dés disparaissent ;
  // `levelUp` : gains d'une montée de niveau, ajoutés à la fiche à ce moment-là.
  const [myThrow, setMyThrow] = useState<{ id: string; levelUp?: number[] } | null>(null)
  const myThrowRef = useRef<{ id: string; levelUp?: number[] } | null>(null)
  const tableDiceRef = useRef<DiceBoxHandle>(null)
  // Première demande du MJ qui m'attend : les dés lancés sont alors les siens.
  const checks = useStorage((root) => root.checks)
  const pending = checks && self?.id
    ? Array.from(checks.values())
      .filter((c) => c.targetId === self.id)
      .sort((a, b) => a.createdAt - b.createdAt)[0]
    : undefined
  const { id: roomId } = useParams<{ id: string }>()
  const [diceError, setDiceError] = useState(false)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [canvasKey, setCanvasKey] = useState(0)
  // Sous 1024 px, un seul panneau à la fois : fiche, table (canevas et dés)
  // ou chat. Au-dessus, les trois restent côte à côte et ceci ne sert pas.
  const [mobileTab, setMobileTab] = useState<MobileTab>('table')
  const [chatUnread, setChatUnread] = useState(false)
  const showMobileTab = (tab: MobileTab) => {
    setMobileTab(tab)
    if (tab === 'chat') setChatUnread(false)
  }
  const mobilePanel = (tab: MobileTab) => (mobileTab === tab ? 'flex' : 'hidden')
  const [cooldown, setCooldown] = useState(false)
  const remoteLoadedRef = useRef(false)
  // Vrai des qu'une fiche venue du serveur a ete appliquee. Empeche l'effet de
  // chargement local de la remplacer par la fiche vide quand le profil et la
  // connexion se stabilisent, ce qui relance cet effet.
  const remoteCharacterAppliedRef = useRef(false)
  const initialBackupDone = useRef(false)
  // Enregistrement de la fiche sur le compte, regroupe sur deux secondes.
  const accountSaveTimer = useRef<number | null>(null)
  const pendingAccountSave = useRef<Character | null>(null)
  // Durée d'indisponibilité du bouton : le roulement de mes dés, puis un court instant.
  const [rollMs, setRollMs] = useState(DICE_REVEAL_DELAY_MS + RELAUNCH_MS)

  const broadcast = useBroadcastEvent()
  const [, updateMyPresence] = useMyPresence()

  // Reset room-scoped flags when navigating between rooms
  useEffect(() => {
    remoteLoadedRef.current = false
    remoteCharacterAppliedRef.current = false
    initialBackupDone.current = false
  }, [roomId])

  const saveCharacterToCloud = useCallback(async (char: Character) => {
    if (!roomId) return
    const normalized = normalizeCharacter(char, profile?.pseudo ?? null)
    const owner = normalized.owner || profile?.pseudo
    if (!owner || !normalized.id) return
    try {
      const auth = await roomAuthHeaders(roomId)
      if (!auth) return
      await fetch('/api/roomstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({
          roomId,
          id: normalized.id,
          owner,
          character: { ...normalized, owner },
        }),
      })
    } catch {
      // best-effort : ne bloque pas l'UI en cas d'échec réseau
    }
  }, [roomId, profile?.pseudo])

  // listen for remote events
  useEventListener((payload) => {
    const { event } = payload
    if (event.type === 'chat') {
      if (mobileTab !== 'chat') setChatUnread(true)
      return
    }
    // Les lancers arrivent par la liste partagée (`useEventLog`), où le
    // serveur les inscrit lui-même (`/api/dice`).
    if (event.type === 'dice-roll') {
      debug('dice-roll received', event)
      return
    }

    if (event.type === 'gm-select') {
      // Seul un MJ de la table peut imposer une fiche à un joueur. Le rôle de
      // l'expéditeur vient des infos de session posées par le serveur : il ne
      // peut pas être usurpé en fabriquant l'événement à la main.
      if (payload.user?.info?.role !== 'gm') return
      const selectionTarget: number | null =
        typeof event.targetConnectionId === 'number' ? event.targetConnectionId : null
      // Ne change jamais la fiche des autres sauf si explicitement ciblé
      if (selectionTarget === null || selectionTarget !== myConnectionId) {
        return
      }

      const incomingChar = normalizeCharacter(
        event.character ?? defaultPerso,
        profile?.pseudo ?? null,
      )
      const owner = incomingChar.owner || profile?.pseudo || ''
      const finalChar: Character = { ...incomingChar, owner }

      setPerso(finalChar)
      updateMyPresence({
        character: {
          ...finalChar,
          ownerConnectionId: myConnectionId ?? undefined,
        },
      })
      void saveCharacterToCloud(finalChar)

      setCharacters((prev) => {
        const idx = prev.findIndex(
          (c) => c.id === finalChar.id && c.owner === finalChar.owner,
        )
        const next =
          idx !== -1
            ? prev.map((c, i) => (i === idx ? { ...c, ...finalChar } : c))
            : [...prev, finalChar]
        if (typeof window !== 'undefined') {
          localStorage.setItem('jdr_characters', JSON.stringify(next))
          localStorage.setItem(
            SELECTED_CHARACTER_KEY,
            buildSelectionKey(finalChar.id, finalChar.owner ?? null),
          )
          window.dispatchEvent(new Event('jdr_characters_change'))
        }
        return next
      })
    }
  })


  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sessionStorage.getItem('visitedMenu')) {
      sessionStorage.setItem('visitedMenu', 'true')
      router.push('/salles')
    }
  }, [router])

  useEffect(() => {
    if (profile) {
      updateMyPresence({ name: profile.pseudo, color: profile.color })
    }
  }, [profile, updateMyPresence])

  useEffect(() => {
    // Une fiche du serveur a deja ete choisie : ne pas la remplacer.
    if (remoteCharacterAppliedRef.current) return

    const savedChars = localStorage.getItem('jdr_characters')
    let chars: Character[] = []
    if (savedChars) {
      try {
        const parsed = JSON.parse(savedChars)
        if (Array.isArray(parsed)) {
          chars = parsed.map((c) =>
            normalizeCharacter(c, profile?.pseudo ?? null),
          )
          // eslint-disable-next-line react-hooks/set-state-in-effect -- fiches gardées dans le navigateur, lues à l'arrivée sur la table
          setCharacters(chars)
        }
      } catch {}
    }

    const { owner, id } = parseSelectionKey(
      localStorage.getItem(SELECTED_CHARACTER_KEY),
    )

    const found =
      id && chars.length
        ? chars.find(
            (c) =>
              c.id?.toString() === id && (!owner || c.owner === owner),
          )
        : null

    const nextChar = found
      ? found
      : normalizeCharacter(
          { ...defaultPerso, owner: profile?.pseudo || defaultPerso.owner },
          profile?.pseudo ?? null,
        )

    setPerso(nextChar)
    updateMyPresence({
      character: {
        ...nextChar,
        ownerConnectionId: myConnectionId ?? undefined,
      },
    })

    if (!found && typeof window !== 'undefined') {
      localStorage.removeItem(SELECTED_CHARACTER_KEY)
    }
  }, [profile?.pseudo, myConnectionId, updateMyPresence])

  // Chargement automatique des fiches stockées côté serveur (Liveblocks storage)
  useEffect(() => {
    if (!roomId || remoteLoadedRef.current) return
    // Guard posé AVANT le fetch pour éviter les doubles appels si l'effet re-fire
    remoteLoadedRef.current = true
    const loadRemote = async () => {
      try {
        const auth = await roomAuthHeaders(roomId)
        if (!auth) return
        const res = await fetch(
          `/api/roomstorage?roomId=${encodeURIComponent(roomId)}`,
          { headers: auth },
        )
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        const charsObj = (data?.characters as Record<string, Character> | undefined) ?? {}
        const values = Object.values(charsObj)
        if (!values.length) return
        const normalizedValues = values.map((c) =>
          normalizeCharacter(
            { ...c, owner: c.owner || profile?.pseudo || 'anon' },
            profile?.pseudo ?? null,
          ),
        )
        setCharacters((prev) => {
          const map = new Map<string, Character>()
          prev.forEach((c) => map.set(buildCharacterKey(c), c))
          normalizedValues.forEach((c) => {
            const key = buildCharacterKey(c)
            const current = map.get(key)
            const currentTs = Number(current?.updatedAt ?? 0)
            const incomingTs = Number(c.updatedAt ?? 0)
            if (!current || incomingTs > currentTs) {
              map.set(key, c)
            }
          })
          const merged = Array.from(map.values())
          if (typeof window !== 'undefined') {
            localStorage.setItem('jdr_characters', JSON.stringify(merged))
          }
          return merged
        })
        const preferred = (!perso?.id || characters.length === 0)
          ? normalizedValues.find((c) =>
              isOwnedBy(c, { id: profile?.id, pseudo: profile?.pseudo ?? '' }),
            ) ?? normalizedValues[0]
          : null
        // On applique meme si l'effet a ete relance entre-temps : le profil
        // arrive apres le montage, ce qui suffisait a annuler le chargement et
        // a laisser la fiche distante recuperee mais jamais affichee. Le drapeau
        // ci-dessous suffit a empecher une double application.
        if (preferred && !remoteCharacterAppliedRef.current) {
          remoteCharacterAppliedRef.current = true
          const finalChar = normalizeCharacter(
            { ...preferred, owner: preferred.owner || profile?.pseudo || '' },
            profile?.pseudo ?? null,
          )
          setPerso(finalChar)
          updateMyPresence({
            character: {
              ...finalChar,
              ownerConnectionId: myConnectionId ?? undefined,
            },
          })
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              SELECTED_CHARACTER_KEY,
              buildSelectionKey(finalChar.id, finalChar.owner ?? null),
            )
          }
        }
      } catch {
        // réseau indisponible : on ne bloque pas l'UX
      }
    }
    void loadRemote()
  // Volontairement limite a la salle et au compte.
  //
  // `myConnectionId` et `updateMyPresence` changeaient juste apres le montage,
  // ce qui relancait l'effet, annulait le chargement en cours par sa fonction
  // de nettoyage, et laissait `remoteLoadedRef` empecher toute reprise : la
  // fiche distante etait bien recuperee mais jamais affichee.
  //
  // `perso?.id` et `characters.length` sont exclus pour la meme raison : ils
  // changent a chaque modification de fiche.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, profile?.pseudo, profile?.id])

  // Sauvegarde initiale silencieuse dans le cloud pour éviter la perte de fiche
  useEffect(() => {
    if (!roomId || !perso?.id || initialBackupDone.current) return
    initialBackupDone.current = true
    void saveCharacterToCloud(perso)
  }, [roomId, perso, saveCharacterToCloud])

  // `gmApproved` : gains d'une montée de niveau lancée à la demande du MJ,
  // appliqués même quand il s'est réservé les fiches.
  const handleUpdatePerso = (incoming: Character, gmApproved = false) => {
    if (viewedConnectionId !== null) {
      // Fiche d'un joueur ouverte par le MJ : on la lui envoie, il l'applique
      // et l'enregistre de son côté. Rien n'est écrit sur la fiche du MJ.
      const forPlayer = normalizeCharacter({ ...incoming, updatedAt: Date.now() })
      setPerso(forPlayer)
      broadcast({ type: 'gm-select', character: forPlayer, targetConnectionId: viewedConnectionId })
      return
    }
    // Le MJ s'est réservé les fiches : le joueur ne modifie plus la sienne.
    if (!sheetEditable && !gmApproved) return
    const updatedPerso = normalizeCharacter(
      {
        ...incoming,
        owner: incoming.owner || profile?.pseudo || '',
        updatedAt: Date.now(),
      },
      profile?.pseudo ?? null,
    )
    const characterKey = buildCharacterKey(updatedPerso)

    setPerso(updatedPerso)
    updateMyPresence({
      character: {
        ...updatedPerso,
        ownerConnectionId: myConnectionId ?? undefined,
      },
    })

    setCharacters((prevChars) => {
      let found = false
      const next = prevChars.map((c) => {
        if (buildCharacterKey(c) === characterKey) {
          found = true
          return { ...c, ...updatedPerso }
        }
        return c
      })
      const finalList = found ? next : [...next, updatedPerso]
      if (typeof window !== 'undefined') {
        localStorage.setItem('jdr_characters', JSON.stringify(finalList))
        localStorage.setItem(
          SELECTED_CHARACTER_KEY,
          buildSelectionKey(updatedPerso.id, updatedPerso.owner ?? null),
        )
        window.dispatchEvent(new Event('jdr_characters_change'))
      }
      return finalList
    })
    void saveCharacterToCloud(updatedPerso)
    // La fiche du joueur suit son compte : chaque modification faite en jeu y
    // est enregistree, regroupee sur deux secondes pour ne pas envoyer une
    // requete par champ modifie. Les fiches des autres joueurs ne sont pas
    // concernees.
    if (profile?.signedIn && isOwnedBy(updatedPerso, profile)) {
      pendingAccountSave.current = updatedPerso
      if (accountSaveTimer.current) window.clearTimeout(accountSaveTimer.current)
      accountSaveTimer.current = window.setTimeout(() => {
        const pending = pendingAccountSave.current
        pendingAccountSave.current = null
        if (pending) void saveAccountCharacter(pending).catch(() => {})
      }, 2000)
    }
  }

  // En quittant la table, une modification encore en attente est envoyee
  // tout de suite plutot que perdue.
  useEffect(() => () => {
    if (accountSaveTimer.current) window.clearTimeout(accountSaveTimer.current)
    const pending = pendingAccountSave.current
    if (pending) void saveAccountCharacter(pending).catch(() => {})
  }, [])

  const handleGMSelect = (char: Character) => {
    if (typeof char.ownerConnectionId !== 'number') return
    if (viewedConnectionId === null) gmOwnPersoRef.current = perso
    const next = normalizeCharacter(
      { ...char, owner: char.owner || profile?.pseudo || '' },
      profile?.pseudo ?? null,
    )
    setViewedConnectionId(char.ownerConnectionId)
    setPerso(next)
    updateMyPresence({ gmView: { id: next.id, name: next.nom || next.name } })
  }

  const handleGMBackToOwn = useCallback(() => {
    setViewedConnectionId(null)
    if (gmOwnPersoRef.current) setPerso(gmOwnPersoRef.current)
    gmOwnPersoRef.current = null
    updateMyPresence({ gmView: null })
  }, [updateMyPresence])

  // La fiche consultée suit les changements du joueur ; s'il quitte la table,
  // le MJ retrouve sa propre fiche.
  useEffect(() => {
    if (viewedConnectionId === null) return
    if (!viewedStillHere) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- suit la fiche du joueur consulté, reçue par Liveblocks
      handleGMBackToOwn()
      return
    }
    if (viewedCharacter) {
      setPerso(normalizeCharacter({ ...viewedCharacter, ownerConnectionId: viewedConnectionId }))
    }
  }, [viewedConnectionId, viewedStillHere, viewedCharacter, handleGMBackToOwn])

  if (!user) {
    // Profil pas encore resolu : useProfile renvoie un profil « Visiteur »
    // des qu'il a tranche, donc cet ecran ne s'affiche qu'a l'initialisation.
    return (
      <div className="flex h-dvh w-screen items-center justify-center p-6">
        <SignedOutPanel />
      </div>
    )
  }

  // Les dés roulent ici et la physique décide ; le serveur inscrit le lancer
  // dans le chat, où le résultat n'apparaît qu'une fois les dés posés.
  const rollDice = async (sent: ThrowSent): Promise<ThrowResult | null> => {
    if (diceDisabled) return null
    setDiceDisabled(true)
    setCooldown(true)
    setDiceError(false)
    try {
      const res = await fetch('/api/dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, player: perso.nom || profile?.pseudo || '', ...sent }),
      })
      const data = (await res.json().catch(() => null)) as { roll?: { id: string } } | null
      if (!res.ok || !data?.roll) throw new Error(`dice ${res.status}`)
      debug('dice-roll', data.roll)
      startThrow({ id: data.roll.id })
      return { id: data.roll.id }
    } catch (e) {
      debug('dice-roll failed', e)
      setDiceError(true)
      window.setTimeout(() => setDiceError(false), 4000)
      setCooldown(false)
      setDiceDisabled(false)
      return null
    }
  }

  // Demande du MJ : le serveur vérifie les dés et calcule la réussite d'un test.
  const rollCheck = async (id: string, sent: ThrowSent): Promise<ThrowResult | null> => {
    if (diceDisabled) return null
    setDiceDisabled(true)
    setCooldown(true)
    setDiceError(false)
    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'roll', id, results: sent.results, throw: sent.throw, ms: sent.ms }),
      })
      const data = (await res.json().catch(() => null)) as
        | { roll?: { id: string; rolls?: RollsOutcome } }
        | null
      if (!res.ok || !data?.roll) throw new Error(`check ${res.status}`)
      debug('check-roll', data.roll)
      const rolls = data.roll.rolls
      startThrow({ id: data.roll.id, ...(rolls?.levelUp ? { levelUp: rolls.results } : {}) })
      return { id: data.roll.id, levelUp: rolls?.levelUp }
    } catch (e) {
      debug('check-roll failed', e)
      setDiceError(true)
      window.setTimeout(() => setDiceError(false), 4000)
      setCooldown(false)
      setDiceDisabled(false)
      return null
    }
  }

  // Les dés lancés partent pour la demande du MJ s'il y en a une.
  const throwDice = (sent: ThrowSent) => {
    if (!diceDisabled) setRollMs(sent.ms + RELAUNCH_MS)
    return pending ? rollCheck(pending.id, sent) : rollDice(sent)
  }
  const pendingDice = pending
    ? pending.type === 'rolls' ? Array.from({ length: pending.count }, () => pending.dice) : [20]
    : null
  const levelUpWaits = pending?.type === 'rolls' && pending.levelUp && viewedConnectionId !== null

  // Les gains arrivent sur la fiche une fois les dés révélés à toute la table.
  // Pendant que le MJ consulte une autre fiche, sa montée de niveau attend
  // (`levelUpBlocked`) : la fiche affichée est donc bien la sienne.
  // Si mes dés n'apparaissent jamais sur la table, le bouton revient quand même.
  const startThrow = (roll: { id: string; levelUp?: number[] }) => {
    myThrowRef.current = roll
    setMyThrow(roll)
    window.setTimeout(() => handleThrowDone(roll.id), DICE_MAX_ROLL_MS + THROW_HOLD_MS + THROW_FADE_MS + 4000)
  }

  const handleThrowDone = (id: string) => {
    const mine = myThrowRef.current
    if (mine?.id !== id) return
    myThrowRef.current = null
    setMyThrow(null)
    if (mine.levelUp && viewedConnectionId === null) handleUpdatePerso(applyLevelUp(perso, mine.levelUp), true)
    setCooldown(false)
    setDiceDisabled(false)
  }

  return (
    <div className="relative w-screen h-dvh font-sans overflow-hidden bg-transparent">
      <div className={`relative z-10 flex flex-col w-full h-full lg:gap-3 lg:p-3 lg:pb-6 ${theme.layout.sheetSide === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        {/* `lg:contents` efface l'enveloppe sur grand écran : la mise en page
            côte à côte reste celle d'avant les onglets. */}
        <div className={`${mobilePanel('sheet')} flex-1 min-h-0 flex-col items-center overflow-y-auto p-2 lg:contents`}>
          <CharacterSheet
            perso={perso}
            onUpdate={handleUpdatePerso}
            readOnly={!sheetEditable}
            canLevelUp={isGM}
            levelUpTarget={
              viewedConnectionId === null
                ? self ? { id: self.id, name: perso.nom || profile?.pseudo || '?' } : null
                : viewedUserId ? { id: viewedUserId, name: perso.nom || '?' } : null
            }
            notice={viewedConnectionId !== null ? (
              <div className="-mx-3 mb-1 flex items-center gap-2 border-b border-gm/30 bg-gm/10 px-3 py-2 text-xs">
                <Crown size={13} className="shrink-0 text-gm" aria-hidden />
                <span className="min-w-0 flex-1">{t('gmEditingSheet').replace('{n}', perso.nom || '?')}</span>
                <button onClick={handleGMBackToOwn} className="ui-btn ui-btn-ghost shrink-0 !min-h-7 !px-2 text-xs">
                  ← {t('myCharacter')}
                </button>
              </div>
            ) : !sheetEditable ? (
              <div className="-mx-3 mb-1 flex items-center gap-2 border-b border-[var(--c-panel-line)] px-3 py-2 text-xs text-ink/65">
                <Crown size={13} className="shrink-0 text-gm" aria-hidden />
                {t('sheetLockedByGm')}
              </div>
            ) : null}
          />
        </div>

        <main className={`${mobilePanel('table')} lg:flex flex-1 flex-col min-h-0 min-w-0 gap-2 max-lg:p-2 lg:gap-3`}>
          {/* Le plateau : un panneau comme la fiche et le chat. */}
          <div className="ui-panel flex-1 flex flex-col justify-center items-center relative min-h-0 overflow-hidden">
            <ErrorBoundary
              key={canvasKey}
              fallbackRender={({ error, reset }) => (
                <div className="p-4 text-red-500 flex flex-col items-center gap-2">
                  <div>Canvas error: {String(error?.message || 'Unknown')}</div>
                  <button
                    className="ui-btn ui-btn-primary"
                    onClick={() => { reset(); setCanvasKey((k) => k + 1) }}
                  >Reload canvas</button>
                  <button
                    className="ui-btn"
                    onClick={() => window.location.reload()}
                  >Reload page</button>
                </div>
              )}
            >
              <InteractiveCanvas
                toolbarExtra={isGM ? (
                  <button
                    onClick={() => setGmPanelOpen((o) => !o)}
                    aria-expanded={gmPanelOpen}
                    className={`ui-btn shadow-lg !min-h-9 ${gmPanelOpen ? 'ui-btn-primary' : '!bg-[var(--c-panel-head)]'}`}
                  >
                    <Crown size={14} className={gmPanelOpen ? '' : 'text-gm'} />
                    {t('gmLabel')}
                  </button>
                ) : null}
                overlay={isGM && gmPanelOpen ? (
                  <div
                    className="pointer-events-none absolute top-14 left-3 right-3 bottom-3 z-40 flex items-start justify-end"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <GMPanel
                      viewingConnectionId={viewedConnectionId}
                      onOpenSheet={handleGMSelect}
                      onBackToOwn={handleGMBackToOwn}
                      onClose={() => setGmPanelOpen(false)}
                    />
                  </div>
                ) : null}
              />
            </ErrorBoundary>
            {/* Bandeau de la salle de démo, en bas du plateau : il ne cache pas les outils. */}
            <DemoBanner />
            <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice display error</div>}>
              <DiceBoxTable
                ref={tableDiceRef}
                dice={pendingDice ?? dicePool}
                disabled={diceDisabled || levelUpWaits}
                onThrow={throwDice}
                onDone={handleThrowDone}
              />
            </ErrorBoundary>
            <CheckBanner isGM={isGM} />
            {!myThrow && (
              <CheckPrompt
                onRoll={() => tableDiceRef.current?.throwNow()}
                disabled={diceDisabled}
                levelUpBlocked={viewedConnectionId !== null}
              />
            )}
            {diceError && (
              <p role="alert" className="ui-panel absolute bottom-14 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 text-sm">
                {t('diceRollFailed')}
              </p>
            )}
          </div>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice roller error</div>}>
            <DiceRoller
              dice={dicePool}
              onChange={changeDicePool}
              lockedLabel={pendingDice ? poolLabel(pendingDice) : undefined}
              onRoll={() => tableDiceRef.current?.throwNow()}
              disabled={diceDisabled}
              cooldown={cooldown}
              cooldownDuration={rollMs}
              leading={<MusicPlayer />}
            >
              <LiveAvatarStack />
            </DiceRoller>
          </ErrorBoundary>
        </main>

        <div className={`${mobilePanel('chat')} flex-1 min-h-0 flex-col p-2 lg:contents`}>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Chat error</div>}>
            <ChatBox
              chatBoxRef={chatBoxRef}
              author={isGM
                ? (profile?.pseudo ?? 'MJ')
                : perso.nom || profile?.pseudo || 'Anonymous'}
            />
          </ErrorBoundary>
        </div>

        <MobileTabBar active={mobileTab} onSelect={showMobileTab} chatUnread={chatUnread} />
      </div>
    </div>
  )
}






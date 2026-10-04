'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers, useSelf } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
import PopupResult from '@/components/dice/PopupResult'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import MusicPlayer from '@/components/music/MusicPlayer'
import LiveAvatarStack from '@/components/chat/LiveAvatarStack'
import SignedOutPanel from '@/components/auth/SignedOutPanel'
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
import ImportExportMenu from '@/components/character/ImportExportMenu'
import useEventLog from './hooks/useEventLog'
import useProfile from './hooks/useProfile'
import ErrorBoundary from '@/components/misc/ErrorBoundary'
import MobileTabBar, { type MobileTab } from '@/components/app/MobileTabBar'
import { debug } from '@/lib/debug'
import { roomAuthHeaders } from '@/lib/roomsApi'
import { saveAccountCharacter } from '@/lib/charactersApi'
import { useTheme } from '@/components/context/ThemeContext'
import {
  type Character,
  buildCharacterKey,
  buildSelectionKey,
  normalizeCharacter,
  parseSelectionKey,
  isOwnedBy,
} from '@/types/character'

const SELECTED_CHARACTER_KEY = 'selectedCharacterId'

export default function HomePageInner() {
  const router = useRouter()
  const { theme } = useTheme()
  const [user, setUser] = useState<string | null>(null)
  const profile = useProfile()
  const self = useSelf()
  const myConnectionId = self?.connectionId ?? null
  // Rôle dans cette table, fixé par le serveur à l'ouverture de la session.
  const isGM = self?.info?.role === 'gm'
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

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const { id: roomId } = useParams<{ id: string }>()
  const [pendingRoll, setPendingRoll] = useState<{ result: number; dice: number; nom: string } | null>(null)
  const { addEvent } = useEventLog(roomId)
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
  // total durée d'indisponibilité du bouton (animation + hold + cooldown)
  const ROLL_TOTAL_MS = 2000 + 300 + 2000 + 1000

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
    // Les lancers des autres arrivent par la liste partagée (`useEventLog`),
    // écrite une seule fois par celui qui lance.
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
      router.push('/menu')
    }
  }, [router])

  useEffect(() => {
    if (profile) setUser(profile.pseudo)
  }, [profile])

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

  const handleUpdatePerso = (incoming: Character) => {
    if (viewedConnectionId !== null) {
      // Fiche d'un joueur ouverte par le MJ : on la lui envoie, il l'applique
      // et l'enregistre de son côté. Rien n'est écrit sur la fiche du MJ.
      const forPlayer = normalizeCharacter({ ...incoming, updatedAt: Date.now() })
      setPerso(forPlayer)
      broadcast({ type: 'gm-select', character: forPlayer, targetConnectionId: viewedConnectionId })
      return
    }
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

  const rollDice = () => {
    if (diceDisabled) return
    setDiceDisabled(true)
    setCooldown(true)
    const result = Math.floor(Math.random() * diceType) + 1
    setDiceResult(result)
    setShowPopup(true)
    setPendingRoll({ result, dice: diceType, nom: perso.nom || profile?.pseudo || '?' })
  }

  const handlePopupReveal = () => {
    if (!pendingRoll) return
    const { nom, dice, result } = pendingRoll

    const ts = Date.now()
    const entry = { player: nom, dice, result, ts }

    addEvent({ id: crypto.randomUUID(), kind: 'dice', ...entry })

    broadcast({ type: 'dice-roll', player: nom, dice, result, ts })
    debug('dice-roll send', entry)
    setPendingRoll(null)

  }

  const handlePopupFinish = () => {
    setShowPopup(false)
    window.setTimeout(() => {
      setCooldown(false)
      setDiceDisabled(false)
      setDiceResult(null)
    }, 1000)
  }

  return (
    <div className="relative w-screen h-dvh font-sans overflow-hidden bg-transparent">
      <div className={`relative z-10 flex flex-col w-full h-full ${theme.layout.sheetSide === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        {/* `lg:contents` efface l'enveloppe sur grand écran : la mise en page
            côte à côte reste celle d'avant les onglets. */}
        <div className={`${mobilePanel('sheet')} flex-1 min-h-0 flex-col items-center overflow-y-auto p-2 lg:contents`}>
          <CharacterSheet perso={perso} onUpdate={handleUpdatePerso} chatBoxRef={chatBoxRef} logoOnly>
            <span className="ml-2">
              {isGM && (
                <GMCharacterSelector
                  onSelect={handleGMSelect}
                  onSelectOwn={handleGMBackToOwn}
                  viewingConnectionId={viewedConnectionId}
                />
              )}
            </span>
            <span className="ml-1">
              <ImportExportMenu perso={perso} onUpdate={handleUpdatePerso} />
            </span>
          </CharacterSheet>
        </div>

        <main className={`${mobilePanel('table')} lg:flex flex-1 flex-col min-h-0`}>
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <ErrorBoundary
              key={canvasKey}
              fallbackRender={({ error, reset }) => (
                <div className="p-4 text-red-500 flex flex-col items-center gap-2">
                  <div>Canvas error: {String(error?.message || 'Unknown')}</div>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => { reset(); setCanvasKey((k) => k + 1) }}
                  >Reload canvas</button>
                  <button
                    className="px-3 py-1 rounded bg-surface-hover text-ink hover:bg-surface-hover"
                    onClick={() => window.location.reload()}
                  >Reload page</button>
                </div>
              )}
            >
              <InteractiveCanvas />
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice display error</div>}>
              <PopupResult show={showPopup} result={diceResult} diceType={diceType} onReveal={handlePopupReveal} onFinish={handlePopupFinish} />
            </ErrorBoundary>
          </div>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice roller error</div>}>
            <DiceRoller
              diceType={diceType}
              onChange={setDiceType}
              onRoll={rollDice}
              disabled={diceDisabled}
              cooldown={cooldown}
              cooldownDuration={ROLL_TOTAL_MS}
              afterRoll={<MusicPlayer />}
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






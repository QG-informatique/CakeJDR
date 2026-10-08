// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { RoomSettings } from './lib/roomSettings'
import type { LiveMap, LiveObject, LiveList } from '@liveblocks/client'
import type { Character } from '@/types/character'
import type { CheckOutcome, GmRequest, RollsOutcome } from '@/lib/checks'
import type { AutoGmCheck, AutoGmTiebreak } from '@/lib/autoGm/types'

// Canvas images stored in Liveblocks. Keep in sync with components/canvas/ImageItem.tsx
// but defined here to satisfy Liveblocks Lson constraints.
type CanvasImage = {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  xRatio?: number
  yRatio?: number
  widthRatio?: number
  heightRatio?: number
  local?: boolean
  createdAt?: number
  /** Carte posée en fond du plateau : couvre tout, ne bouge pas. */
  kind?: 'map'
  /** Pion d'un joueur (celui de son personnage) : lui seul et le MJ le déplacent. */
  ownerId?: string
  /** Pion de couleur dessiné par le code : un rond avec une initiale. */
  token?: { text: string; color: string }
}

/** Image envoyée dans la bibliothèque de la table (voir lib/library.ts). */
type LibraryUpload = {
  id: string
  url: string
  category: string
  width: number
  height: number
  ownerId: string
  ownerName?: string
  createdAt: number
}

type StrokeSegment = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: 'draw' | 'erase'
}

type SessionEvent = {
  id: string
  /** `check` : test demandé par le MJ, un lancer de dé avec son résultat. */
  kind: 'chat' | 'dice' | 'check' | 'rolls'
  author?: string
  text?: string
  player?: string
  dice?: number
  result?: number
  ts: number
  isMJ?: boolean
  /** Signature du serveur sur un lancer de dé (`lib/diceSigning.ts`). */
  sig?: string
  check?: CheckOutcome
  /** `rolls` : plusieurs dés demandés par le MJ, `result` est leur somme. */
  rolls?: RollsOutcome
  /** `check` : la demande à laquelle ce jet répond (`app/api/check`). */
  requestId?: string
}

type Room = {
  id: string
  name: string
  passwordHash?: string
  hasPassword?: boolean | string
  owner?: string | null
}

type CharacterData = Character
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Currently selected character data
      character?: CharacterData
      // Optional information about which character the GM is consulting
      gmView?: { id: string; name?: string } | null
      // Cursor position in canvas coordinates
      cursor?: { x: number; y: number } | null
      // Display name and color for cursors
      name?: string
      color?: string
    }

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      characters: LiveMap<string, CharacterData>
      images: LiveMap<string, CanvasImage>
      library: LiveMap<string, LibraryUpload>
      strokes: LiveList<StrokeSegment>
      // `pos` (secondes) relevée à `at` (horloge en ms) : d'où on en est dans
      // le morceau, pour qu'un joueur qui arrive ou reprend tombe au même endroit.
      music: LiveObject<{ id: string; playing: boolean; volume?: number; pos?: number; at?: number }>
      musicQueue: LiveList<{ id: string }>
      summary: LiveObject<{
        acts: LiveList<{ id: string; title: string }>
        currentId?: string
      }>
      quickNote: LiveObject<{ text: string; updatedAt: number }>
      editor: LiveMap<string, string>
      events: LiveList<SessionEvent>
      rooms: LiveList<Room>
      /** Réglages posés par le MJ (absents tant qu'il n'a rien changé). */
      settings?: LiveObject<RoomSettings>
      /** Tests demandés par le MJ, en attente du jet du joueur (`app/api/check`). */
      checks?: LiveMap<string, GmRequest>
      /**
       * Partie menée par le MJ automatique (`components/autogm/AutoGmPanel.tsx`).
       * `visit` compte les passages de scène en scène ; `setup` est le dernier
       * passage dont le plateau et le récit ont été mis en place.
       */
      autoGm?: LiveObject<{
        /** Tiré à chaque lancement : distingue deux parties de la même aventure. */
        run: string
        adventure: string
        scene: string
        visit: number
        setup: number
        path: string[]
        flags: string[]
        /** Vote de chaque joueur (identifiant Liveblocks), une option ou `neutral`. */
        votes: LiveMap<string, string>
        voteStart?: number
        tiebreak?: AutoGmTiebreak
        check?: AutoGmCheck
      }>
    }

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      /** Identifiant du compte pour un joueur connecte, aleatoire pour un visiteur. */
      id: string
      /** Renseigne cote serveur : le client ne peut donc pas usurper un nom. */
      info: {
        pseudo: string
        color: string
        /** Faux pour un visiteur non connecte. */
        signedIn: boolean
        /** Role dans cette table, decide par le serveur a l'ouverture de la session. */
        role: 'gm' | 'player'
      }
    }

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | { type: 'add-image'; image: CanvasImage }
      | { type: 'update-image'; image: CanvasImage }
      | { type: 'delete-image'; id: string }
      | { type: 'clear-canvas' }
      | {
          type: 'draw-line'
          x1: number
          y1: number
          x2: number
          y2: number
          color: string
          width: number
          mode: 'draw' | 'erase'
        }
      | { type: 'chat'; author: string; text: string; isMJ?: boolean; ts?: number }
      | { type: 'dice-roll'; player: string; dice: number; result: number; ts?: number }
      // Dé tenu en main par un joueur, position en fraction du plateau ; `dice-drop` : reposé sans lancer.
      | { type: 'dice-hold'; x: number; y: number; name: string; dice: number; count: number; rot: number }
      | { type: 'dice-drop' }
      | { type: 'gm-select'; character: CharacterData; targetConnectionId?: number | null }
      // Rencontre montrée en grand par le MJ à toute la table (`components/canvas/ShownImage.tsx`).
      | { type: 'show-image'; url: string; label: string }
      | { type: 'show-close' }

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>
  }
}

export {}

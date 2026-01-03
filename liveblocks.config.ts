// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveMap, LiveObject, LiveList } from '@liveblocks/client'

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
  kind: 'chat' | 'dice'
  author?: string
  text?: string
  player?: string
  dice?: number
  result?: number
  ts: number
  isMJ?: boolean
}

type Room = {
  id: string
  name: string
  passwordHash?: string
  hasPassword?: boolean | string
  owner?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CharacterData = any
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Currently selected character data
      character?: CharacterData
      // Optional information about which character the GM is consulting
      gmView?: { id: string | number; name?: string }
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
      strokes: LiveList<StrokeSegment>
      music: LiveObject<{ id: string; playing: boolean; volume?: number }>
      summary: LiveObject<{
        acts: LiveList<{ id: string; title: string }>
        currentId?: string
      }>
      quickNote: LiveObject<{ text: string; updatedAt: number }>
      editor: LiveMap<string, string>
      events: LiveList<SessionEvent>
      rooms: LiveList<Room>
    }

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string
      info: Record<string, never>
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
      | { type: 'chat'; author: string; text: string; isMJ?: boolean }
      | { type: 'dice-roll'; player: string; dice: number; result: number }
      | { type: 'gm-select'; character: CharacterData; targetConnectionId?: number | null }

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>
  }
}

export {}

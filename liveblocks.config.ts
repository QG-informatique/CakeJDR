// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveMap } from '@liveblocks/client'

type CanvasImage = {
  id: number
  src: string
  x: number
  y: number
  width: number
  height: number
  local?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CharacterData = any
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: Record<string, never>;

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      characters: LiveMap<string, CharacterData>;
      images: LiveMap<string, CanvasImage>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        // Example properties, for useSelf, useUser, useOthers, etc.
        // name: string;
        // avatar: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent:
      | { type: 'add-image'; image: CanvasImage }
      | { type: 'update-image'; image: CanvasImage }
      | { type: 'delete-image'; id: number }
      | { type: 'clear-canvas' }
      | { type: 'draw-line'; x1:number; y1:number; x2:number; y2:number; color:string; width:number; mode:'draw'|'erase' }
      | { type: 'chat'; author: string; text: string }
      | { type: 'dice-roll'; player: string; dice: number; result: number }
      | { type: 'gm-select'; character: CharacterData };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export {};

// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveMap } from '@liveblocks/client'
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: Record<string, never>;

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      characters: LiveMap<Record<string, unknown>>;
      images: LiveMap<Record<string, unknown>>;
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
      | { type: 'add-image'; image: Record<string, unknown> }
      | { type: 'update-image'; image: Record<string, unknown> }
      | { type: 'delete-image'; id: number }
      | { type: 'clear-canvas' }
      | { type: 'draw-line'; x1:number; y1:number; x2:number; y2:number; color:string; width:number; mode:'draw'|'erase' }
      | { type: 'chat'; author: string; text: string }
      | { type: 'dice-roll'; player: string; dice: number; result: number }
      | { type: 'gm-select'; character: Record<string, unknown> };

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

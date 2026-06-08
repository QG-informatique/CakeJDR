"use client";
import { ReactNode, useCallback } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'

export function Room({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  /**
   * authEndpoint sous forme de fonction pour pouvoir passer le token d'accès
   * signé côté serveur lors de la vérification du mot de passe de room.
   * Pour les rooms sans MDP, le token est absent et l'accès est accordé librement.
   */
  const authEndpoint = useCallback(async (roomId?: string) => {
    const room = roomId ?? ''
    const accessToken = typeof sessionStorage !== 'undefined'
      ? (sessionStorage.getItem(`room_token_${room}`) ?? undefined)
      : undefined
    const ts = typeof sessionStorage !== 'undefined'
      ? (sessionStorage.getItem(`room_token_ts_${room}`) ?? undefined)
      : undefined
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, accessToken, ts }),
    })
    return res.json() as Promise<{ token: string }>
  }, [])

  return (
    <LiveblocksProvider authEndpoint={authEndpoint}>
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images:     new LiveMap(),
          strokes:    new LiveList([]),
          music:      new LiveObject({ id: '', playing: false }),
          musicQueue: new LiveList([]),
          summary:    new LiveObject({
            acts: new LiveList<{ id: string; title: string }>([]),
            currentId: undefined,
          }),
          quickNote: new LiveObject({ text: '', updatedAt: 0 }),
          editor:    new LiveMap(),
          events:    new LiveList([]),
          rooms:     new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}


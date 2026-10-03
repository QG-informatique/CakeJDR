"use client";
import { ReactNode, useCallback, useState } from "react";
import RoomAccessDenied, { type DeniedReason } from "@/components/rooms/RoomAccessDenied";
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
   * authEndpoint sous forme de fonction pour pouvoir afficher la raison d'un
   * refus. L'accès est réservé aux membres de la table : c'est le serveur qui
   * décide.
   */
  const [denied, setDenied] = useState<DeniedReason | null>(null)

  const authEndpoint = useCallback(async (roomId?: string) => {
    const room = roomId ?? ''
    const res = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room }),
    })
    if (!res.ok) {
      // Refus d'accès. Avant, le message d'erreur partait dans res.json(), la
      // connexion échouait sans explication et l'écran restait sur
      // « Loading... » indéfiniment.
      const text = await res.text().catch(() => '')
      setDenied(
        res.status === 403
          ? text.startsWith('Sign in') ? 'sign-in' : 'not-member'
          : 'other',
      )
      throw new Error(text || `Room access denied (${res.status})`)
    }
    return res.json() as Promise<{ token: string }>
  }, [])

  if (denied) return <RoomAccessDenied reason={denied} />

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


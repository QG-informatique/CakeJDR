"use client";
import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveMap, LiveObject } from '@liveblocks/client'

export function Room({ id, children }: { id: string; children: ReactNode }) {

  // NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY contains the public API key for the Liveblocks project.
  // It is exposed via the environment. If it's missing we cannot connect.
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined');
  }

  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images: new LiveMap(),
          music: new LiveObject({ id: '', playing: false })
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

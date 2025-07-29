"use client";
import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { useStorage } from '@liveblocks/react'
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'

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
          music: new LiveObject({ id: '', playing: false }),
          summary: new LiveObject({ acts: [] }),
          editor: '',
          pages: new LiveList([]),
          currentPageId: '',
          events: new LiveList([]),
          rooms: new LiveList([])
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <StorageSync>{children}</StorageSync>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function StorageSync({ children }: { children: ReactNode }) {
  const pages = useStorage(root => root.pages)
  const currentPageId = useStorage(root => root.currentPageId)
  const current = pages?.find(p => p.id === currentPageId)
  return (
    <LiveblocksProvider
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ storage: { editor: current, pages }, allowNesting: true } as any)}
    >
      {children}
    </LiveblocksProvider>
  )
}

"use client";
import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { LiveMap, LiveObject, LiveList } from '@liveblocks/client'

export function Room({
  id,
  children,
  pages = [],
  currentPageId = 0,
}: {
  id: string
  children: ReactNode
  pages?: Array<unknown>
  currentPageId?: number
}) {

  const devtoolsProps = {
    storage: {
      editor: pages.at(currentPageId),
      pages,
    },
  } as unknown as Record<string, unknown>;

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" {...devtoolsProps}>
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images: new LiveMap(),
            music: new LiveObject({ id: '', playing: false, volume: 5 }),
          summary: new LiveObject({ acts: [], currentId: '' }),
          quickNote: new LiveObject({ text: '', updatedAt: 0 }),
          editor: new LiveMap(),
          events: new LiveList([]),
          rooms: new LiveList([])
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

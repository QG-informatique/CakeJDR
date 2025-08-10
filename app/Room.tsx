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

  // NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY contains the public API key for the Liveblocks project.
  // It is exposed via the environment. If it's missing we cannot connect.
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY is not defined');
  }

  const devtoolsProps = {
    storage: {
      editor: pages.at(currentPageId),
      pages,
    },
  } as unknown as Record<string, unknown>;

  return (
    <LiveblocksProvider publicApiKey={key} {...devtoolsProps}>
      <RoomProvider
        id={id}
        initialPresence={{}}
        initialStorage={{
          characters: new LiveMap(),
          images: new LiveMap(),
            music: new LiveObject({ id: '', playing: false, volume: 5 }),
          summary: new LiveObject({ acts: [], currentId: '' }),
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

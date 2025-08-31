"use client";
import { ReactNode, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useMutation,
  useStorage,
} from "@liveblocks/react/suspense";
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
        initialStorage={undefined as unknown as Liveblocks['Storage']}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          <StorageInitializer>{children}</StorageInitializer>
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function StorageInitializer({ children }: { children: ReactNode }) {
  const init = useMutation(({ storage }) => {
    if (!storage.get('characters')) storage.set('characters', new LiveMap());
    if (!storage.get('images')) storage.set('images', new LiveMap());
    if (!storage.get('music'))
      storage.set('music', new LiveObject({ id: '', playing: false, volume: 5 }));
    if (!storage.get('summary'))
      storage.set('summary', new LiveObject({ acts: [], currentId: '' }));
    if (!storage.get('editor')) storage.set('editor', new LiveMap());
    if (!storage.get('events')) storage.set('events', new LiveList([]));
    if (!storage.get('rooms')) storage.set('rooms', new LiveList([]));
  }, []);

  const ready = useStorage(
    root =>
      !!root.characters &&
      !!root.images &&
      !!root.music &&
      !!root.summary &&
      !!root.editor &&
      !!root.events &&
      !!root.rooms,
  );

  useEffect(() => {
    if (!ready) init();
  }, [ready, init]);

  if (!ready) {
    return <div>Loading…</div>;
  }

  return <>{children}</>;
}

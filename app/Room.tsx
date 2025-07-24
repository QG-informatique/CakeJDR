"use client";
import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";

export function Room({ id, children }: { id: string; children: ReactNode }) {
  // LIVEBLOCKS_KEY contains the public API key for the Liveblocks project.
  // It is exposed via next.config.ts. If it's missing we cannot connect.
  const key = process.env.LIVEBLOCKS_KEY;
  if (!key) {
    throw new Error('LIVEBLOCKS_KEY is not defined');
  }
  return (
    <LiveblocksProvider publicApiKey={key}>
      <RoomProvider id={id} initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

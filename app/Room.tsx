"use client";
import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";

export function Room({ id, children }: { id: string; children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_demo";
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

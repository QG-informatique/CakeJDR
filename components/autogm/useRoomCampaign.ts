'use client'

import { useMemo } from 'react'
import { useStorage } from '@liveblocks/react'
import { parseCampaign } from '@/lib/autoGm/custom'

/** La campagne écrite par le MJ et copiée dans la salle (`lib/autoGm/custom.ts`), ou rien. */
export function useRoomCampaign() {
  const raw = useStorage((root) => root.customAdventure)
  return useMemo(() => (raw ? parseCampaign(raw) : null), [raw])
}

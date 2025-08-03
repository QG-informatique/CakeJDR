'use client'

import { create } from 'zustand'

export type RollRequest = {
  id: string
  type: string
  seed: number
  playerName: string
  isLocal: boolean
}

interface State {
  current: RollRequest | null
  queue: RollRequest[]
  enqueue: (r: RollRequest) => void
  finish: () => void
}

export const useDiceQueue = create<State>((set, get) => ({
  current: null,
  queue: [],
  enqueue: (r: RollRequest) => {
    const { current, queue } = get()
    if (current) set({ queue: [...queue, r] })
    else set({ current: r })
  },
  finish: () => {
    const { queue } = get()
    if (queue.length > 0) {
      const [next, ...rest] = queue
      set({ current: next, queue: rest })
    } else {
      set({ current: null })
    }
  }
}))

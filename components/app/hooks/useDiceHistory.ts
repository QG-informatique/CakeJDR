import { useState, useEffect, useRef } from 'react'

export type DiceEntry = { player: string; dice: number; result: number; ts: number }

export default function useDiceHistory(roomId: string) {
  const HISTORY_KEY = `jdr_dice_${roomId}`
  const [history, setHistory] = useState<DiceEntry[]>([])
  const lastLen = useRef(0)

  useEffect(() => {
    // Reset state when switching rooms to avoid leaking previous history
    lastLen.current = 0
    setHistory([])
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) return
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        setHistory(arr)
        lastLen.current = arr.length
      }
    } catch {
      // ignore parse errors; keep empty state
    }
  }, [HISTORY_KEY])

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
      lastLen.current = history.length
    } catch {
      // ignore write errors (quota, private mode, etc.)
    }
  }, [history, HISTORY_KEY])

  return [history, setHistory] as const
}

import { useState, useEffect, useRef } from 'react'

export type DiceEntry = { player: string; dice: number; result: number; ts: number }

export default function useDiceHistory(roomId: string) {
  const HISTORY_KEY = `jdr_dice_${roomId}`
  const [history, setHistory] = useState<DiceEntry[]>([])
  const lastLen = useRef(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr) && arr.length !== lastLen.current) {
          setHistory(arr)
          lastLen.current = arr.length
        }
      }
    } catch {}
  }, [HISTORY_KEY])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    lastLen.current = history.length
  }, [history, HISTORY_KEY])

  return [history, setHistory] as const
}

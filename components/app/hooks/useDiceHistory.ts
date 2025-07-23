import { useState, useEffect, useRef } from 'react'

export type DiceEntry = { player: string; dice: number; result: number }

const HISTORY_KEY = 'jdr_dice_history'

export default function useDiceHistory() {
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
  }, [])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    lastLen.current = history.length
  }, [history])

  return [history, setHistory] as const
}

'use client'

import { useState } from 'react'
import { useBroadcastEvent, useEventListener } from '@liveblocks/react'
import DiceRoller from './DiceRoller'
import PopupResult from './PopupResult'
import type { DiceEntry } from '../app/hooks/useDiceHistory'
import type { SessionEvent } from '../app/hooks/useEventLog'

interface Props {
  player: string
  setHistory: React.Dispatch<React.SetStateAction<DiceEntry[]>>
  addEvent: (e: SessionEvent) => void
  children?: React.ReactNode
}

// Centralises dice logic: local animation, broadcast result only, and cooldown lock
export default function DiceHub({ player, setHistory, addEvent, children }: Props) {
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [showPopup, setShowPopup] = useState(false)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [pendingRoll, setPendingRoll] = useState<{ id: string; result: number; dice: number; player: string } | null>(null)

  const broadcast = useBroadcastEvent()

  // total disabled time = spin + reveal + hold + extra cooldown
  const ROLL_TOTAL_MS = 2000 + 300 + 2000 + 1000

  // local roll: trigger animation, store roll info but do not broadcast yet
  const rollDice = () => {
    if (diceDisabled) return
    setDiceDisabled(true)
    setCooldown(true)
    const result = Math.floor(Math.random() * diceType) + 1
    const id = crypto.randomUUID()
    setDiceResult(result)
    setShowPopup(true)
    setPendingRoll({ id, result, dice: diceType, player })
  }

  // receive remote rolls and append using the provided timestamp for strict ordering
  useEventListener(({ event }: { event: Liveblocks['RoomEvent'] }) => {
    if (event.type === 'dice-roll') {
      const ts = event.ts ?? Date.now()
      setHistory((h) => [...h, { player: event.player, dice: event.dice, result: event.result, ts }])
    }
  })

  // after animation reveals result, broadcast it and log into history/event log
  const handlePopupReveal = () => {
    if (!pendingRoll) return
    const { id, dice, result, player } = pendingRoll
    const ts = Date.now()
    const entry = { player, dice, result, ts }
    setHistory((h) => [...h, entry])
    broadcast({ type: 'dice-roll', id, ts, player, dice, result } as Liveblocks['RoomEvent'])
    addEvent({ id, kind: 'dice', player, dice, result, ts })
    setPendingRoll(null)
  }

  // cleanup after popup disappears; remove cooldown after a short delay
  const handlePopupFinish = () => {
    setShowPopup(false)
    window.setTimeout(() => {
      setCooldown(false)
      setDiceDisabled(false)
      setDiceResult(null)
    }, 1000)
  }

  return (
    <>
      <PopupResult
        show={showPopup}
        result={diceResult}
        diceType={diceType}
        onReveal={handlePopupReveal}
        onFinish={handlePopupFinish}
      />
      <DiceRoller
        diceType={diceType}
        onChange={setDiceType}
        onRoll={rollDice}
        disabled={diceDisabled}
        cooldown={cooldown}
        cooldownDuration={ROLL_TOTAL_MS}
      >
        {children}
      </DiceRoller>
    </>
  )
}


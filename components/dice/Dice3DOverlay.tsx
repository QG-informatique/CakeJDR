'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useEffect, useRef, useState } from 'react'
import { useBroadcastEvent } from '@liveblocks/react'
import { useDiceQueue, RollRequest } from './useDiceQueue'
import RollAnnouncement from './RollAnnouncement'

export interface Dice3DOverlayProps {
  onComplete: (result: number[], roll: RollRequest) => void
}

// Hook to send roll to other clients via Liveblocks
export const useSendRollToOthers = () => {
  const broadcast = useBroadcastEvent()
  return (roll: RollRequest) => {
    broadcast({ type: 'dice-3d-roll', ...roll } as any)
  }
}

const Dice3DOverlay: FC<Dice3DOverlayProps> = ({ onComplete }) => {
  const { current, finish } = useDiceQueue()
  const containerRef = useRef<HTMLDivElement>(null)
  const [showMsg, setShowMsg] = useState(false)

  useEffect(() => {
    if (!current || !containerRef.current) return

    let cancelled = false
    const run = async () => {
      setShowMsg(true)
      const mod = await import('@3d-dice/dice-box')
      const DiceBoxCtor: any = (mod as any).DiceBox || (mod as any).default
      const box = new DiceBoxCtor(containerRef.current, {
        assetPath: 'https://unpkg.com/@3d-dice/dice-box/dist/assets/',
        theme: 'default'
      })
      await box.init()
      await box.roll(current.type, {
        seed: current.seed,
        onComplete: (results: { value: number }[]) => {
          if (cancelled) return
          const values = results.map(r => r.value)
          onComplete(values, current)
          setShowMsg(false)
          box.dispose()
          finish()
        }
      })
    }

    run()

    return () => {
      cancelled = true
    }
  }, [current, finish, onComplete])

  if (!current) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div ref={containerRef} className="w-full h-full" />
      <RollAnnouncement player={current.playerName} type={current.type} show={showMsg} />
    </div>
  )
}

export default Dice3DOverlay

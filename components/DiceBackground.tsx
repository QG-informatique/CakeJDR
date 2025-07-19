'use client'
import { useEffect, useState } from 'react'
import useClientHydrated from '@/hooks/useClientHydrated'

export default function DiceBackground() {
  const hydrated = useClientHydrated()
  const [rects, setRects] = useState<JSX.Element[]>([])

  useEffect(() => {
    if (!hydrated) return
    setRects(
      [...Array(20)].map((_, i) => {
        const x = Math.random() * 100
        const y = Math.random() * 100
        const size = 3 + Math.random() * 5
        const rotate = Math.random() * 360
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={size}
            height={size}
            fill="white"
            opacity="0.15"
            transform={`rotate(${rotate} ${x + size / 2} ${y + size / 2})`}
            rx="0.5"
            ry="0.5"
          />
        )
      })
    )
  }, [hydrated])

  if (!hydrated) {
    return <svg className="w-full h-full opacity-10" />
  }

  return (
    <svg
      className="w-full h-full opacity-10"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      viewBox="0 0 100 100"
    >
      {rects}
    </svg>
  )
}

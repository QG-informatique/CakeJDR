'use client'
import React from 'react'

export default function DiceBackground() {
  // Disposition déterministe (plus aucun aléatoire)
  const rects = [
    { x: 10,  y: 15,  size: 6,  rotate: 10 },
    { x: 22,  y: 37,  size: 4,  rotate: 45 },
    { x: 30,  y: 60,  size: 7,  rotate: 12 },
    { x: 45,  y: 10,  size: 5,  rotate: 78 },
    { x: 50,  y: 50,  size: 8,  rotate: 24 },
    { x: 65,  y: 35,  size: 4,  rotate: 140 },
    { x: 72,  y: 80,  size: 6,  rotate: 300 },
    { x: 80,  y: 15,  size: 5,  rotate: 200 },
    { x: 90,  y: 55,  size: 7,  rotate: 55 },
    { x: 15,  y: 80,  size: 3,  rotate: 160 },
    { x: 18,  y: 52,  size: 6,  rotate: 33 },
    { x: 33,  y: 28,  size: 4,  rotate: 70 },
    { x: 60,  y: 18,  size: 5,  rotate: 100 },
    { x: 80,  y: 40,  size: 5,  rotate: 20 },
    { x: 42,  y: 72,  size: 7,  rotate: 80 },
    { x: 55,  y: 85,  size: 4,  rotate: 115 },
    { x: 73,  y: 63,  size: 6,  rotate: 310 },
    { x: 64,  y: 59,  size: 3,  rotate: 225 },
    { x: 27,  y: 10,  size: 5,  rotate: 280 },
    { x: 88,  y: 23,  size: 6,  rotate: 150 },
  ]

  return (
    <svg
      className="w-full h-full opacity-10"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      viewBox="0 0 100 100"
    >
      {rects.map((r, i) => (
        <rect
          key={i}
          x={r.x}
          y={r.y}
          width={r.size}
          height={r.size}
          fill="white"
          opacity="0.15"
          transform={`rotate(${r.rotate} ${r.x + r.size / 2} ${r.y + r.size / 2})`}
          rx="0.5"
          ry="0.5"
        />
      ))}
    </svg>
  )
}

'use client'
import React from 'react'

export default function RpgBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black"
      style={{
        backgroundImage:
          'radial-gradient(circle,rgba(255,255,255,0.07) 1px,transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    />
  )
}

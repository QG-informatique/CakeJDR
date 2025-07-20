'use client'
import { Cake } from 'lucide-react'
import React from 'react'

export default function CakeLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Cake className="w-8 h-8 text-pink-400" />
      <span className="text-white font-extrabold text-3xl drop-shadow">Cake JDR</span>
    </span>
  )
}

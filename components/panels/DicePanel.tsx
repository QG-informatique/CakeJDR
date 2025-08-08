'use client'
import { ChevronDown, ChevronUp } from 'lucide-react'
import DiceRoller from '@/components/dice/DiceRoller'
import { ComponentProps } from 'react'

type Props = {
  collapsed: boolean
  onToggle: () => void
} & ComponentProps<typeof DiceRoller>

export default function DicePanel({ collapsed, onToggle, ...props }: Props) {
  return (
    <div
      className={`relative w-full transition-all duration-300 overflow-hidden flex-shrink-0 ${collapsed ? 'h-12 bg-black/15 border border-white/10 rounded-xl' : ''}`}
    >
      <button
        aria-label={collapsed ? 'Ouvrir le panneau des dés' : 'Fermer le panneau des dés'}
        onClick={onToggle}
        className={`absolute top-2 right-2 z-20 p-1 rounded bg-black/40 text-white hover:bg-black/60`}
      >
        {collapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {!collapsed && <DiceRoller {...props} />}
    </div>
  )
}

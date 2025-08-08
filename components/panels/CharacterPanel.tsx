'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import CharacterSheet from '@/components/sheet/CharacterSheet'
import { ComponentProps } from 'react'

type Props = {
  collapsed: boolean
  onToggle: () => void
} & ComponentProps<typeof CharacterSheet>

export default function CharacterPanel({ collapsed, onToggle, ...props }: Props) {
  return (
    <div
      className={`relative h-full flex-shrink-0 transition-all duration-300 overflow-hidden ${collapsed ? 'w-12 bg-black/10 border border-white/10 rounded-2xl' : 'w-full md:w-[420px]'}`}
    >
      <button
        aria-label={collapsed ? 'Ouvrir la fiche personnage' : 'Fermer la fiche personnage'}
        onClick={onToggle}
        className={`absolute top-2 right-2 z-20 p-1 rounded bg-black/40 text-white hover:bg-black/60`}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      {!collapsed && <CharacterSheet {...props} />}
    </div>
  )
}

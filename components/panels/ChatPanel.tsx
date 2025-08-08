'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ChatBox from '@/components/chat/ChatBox'
import { ComponentProps } from 'react'

type Props = {
  collapsed: boolean
  onToggle: () => void
} & ComponentProps<typeof ChatBox>

export default function ChatPanel({ collapsed, onToggle, ...props }: Props) {
  return (
    <div
      className={`relative h-full flex-shrink-0 transition-all duration-300 overflow-hidden ${collapsed ? 'w-12 bg-black/15 border border-white/10 rounded-xl' : 'w-full lg:w-1/5'}`}
    >
      <button
        aria-label={collapsed ? 'Ouvrir le chat' : 'Fermer le chat'}
        onClick={onToggle}
        className={`absolute top-2 left-2 z-20 p-1 rounded bg-black/40 text-white hover:bg-black/60`}
      >
        {collapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
      {!collapsed && <ChatBox {...props} />}
    </div>
  )
}

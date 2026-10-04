'use client'

import { Dices, MessageCircle, ScrollText } from 'lucide-react'
import { useT } from '@/lib/useT'

export type MobileTab = 'sheet' | 'table' | 'chat'

/**
 * Onglets du bas de la table sur téléphone et tablette (sous 1024 px) : on
 * n'y a pas la place de montrer fiche, canevas et chat côte à côte.
 *
 * Le bas de la barre garde une bande libre pour le crédit QG Informatique,
 * fixé en bas de l'écran, afin qu'il ne passe jamais sous les boutons.
 */
export default function MobileTabBar({
  active,
  onSelect,
  chatUnread,
}: {
  active: MobileTab
  onSelect: (tab: MobileTab) => void
  chatUnread: boolean
}) {
  const t = useT()
  const tabs: { key: MobileTab; label: string; Icon: typeof Dices }[] = [
    { key: 'sheet', label: t('tabSheet'), Icon: ScrollText },
    { key: 'table', label: t('tabTable'), Icon: Dices },
    { key: 'chat', label: t('chat'), Icon: MessageCircle },
  ]

  return (
    <nav className="lg:hidden flex-shrink-0 border-t border-ink/10 bg-shade/40 px-2 pt-1.5 pb-6 backdrop-blur">
      <div role="tablist" className="flex gap-1">
        {tabs.map(({ key, label, Icon }) => {
          const selected = active === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelect(key)}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-xs font-semibold transition ${
                selected ? 'bg-ink/15 text-ink' : 'text-ink/60 hover:text-ink'
              }`}
            >
              <Icon size={20} />
              {label}
              {key === 'chat' && chatUnread && !selected && (
                <span className="absolute right-[30%] top-1 h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

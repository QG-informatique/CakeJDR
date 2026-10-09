'use client'

import { useState } from 'react'
import { useRoom } from '@liveblocks/react'
import { Dices, Pencil } from 'lucide-react'
import { useT } from '@/lib/useT'
import { DICE_TYPES } from '@/lib/dicePayload'
import type { GameSystem } from '@/lib/gameSystems'
import { postCheck } from '@/components/checks/postCheck'

type Props = {
  /** Joueur qui lancera les dés ; absent quand il n'est plus à la table. */
  target: { id: string; name: string } | null
  /** Le MJ monte le niveau et ouvre l'édition de la fiche. */
  onByHand: () => void
  system: GameSystem
}

/**
 * Montée de niveau, réservée au MJ. Deux façons de faire : le joueur lance un
 * dé pour les PV et un par caractéristique (tirés par le serveur, ajoutés à sa
 * fiche après la révélation), ou le MJ augmente lui-même ce qu'il veut.
 */
export default function LevelUpPanel({ target, onByHand, system }: Props) {
  const t = useT()
  const room = useRoom()
  const [dice, setDice] = useState(6)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const ask = async () => {
    if (!target || state === 'sending') return
    setState('sending')
    try {
      await postCheck(room.id, {
        action: 'ask', type: 'rolls', system: system.id, targetId: target.id, targetName: target.name, dice, count: system.levelUp.length, levelUp: true,
      })
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <section className="ui-well mt-4 flex flex-col gap-2 p-2.5 text-xs">
      <p className="text-ink/65">{t(system.levelUp.length === 1 ? 'levelUpExplainHitDie' : 'levelUpExplain')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={dice}
          onChange={(e) => { setDice(Number(e.target.value)); setState('idle') }}
          aria-label={t('rollsDice')}
          className="ui-input !min-h-8 w-20"
        >
          {DICE_TYPES.map((d) => (
            <option key={d} value={d}>D{d}</option>
          ))}
        </select>
        <button onClick={ask} disabled={!target || state === 'sending'} className="ui-btn ui-btn-primary !min-h-8 text-xs">
          <Dices size={13} />
          {t('levelUpByDice')}
        </button>
        <button onClick={onByHand} className="ui-btn !min-h-8 text-xs">
          <Pencil size={13} />
          {t('levelUpByHand')}
        </button>
      </div>
      {state === 'sent' && target && (
        <p role="status" className="text-ink/70">{t('levelUpAsked').replace('{n}', target.name)}</p>
      )}
      {state === 'error' && <p role="alert" className="text-red-400">{t('checkFailed')}</p>}
    </section>
  )
}

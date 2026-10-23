'use client'

import { LifeBuoy } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useConfirm } from '@/lib/useConfirm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { drawable } from '@/lib/autoGm'
import type { AutoGmMode, SceneStep } from '@/lib/autoGm/types'
import { useCancelRoll, useRestartScene, useSetGmMode, useStopAdventure } from './useAdventureControls'

/** La scène où mène « Passer à la suite » : l'issue réussie, sans la montrer. */
function skipTarget(step: SceneStep, flags: readonly string[]): string | null {
  switch (step.kind) {
    case 'continue':
      return step.next
    case 'random':
      return drawable(step, flags)[0]?.next ?? null
    case 'vote':
      return (step.options.find((o) => (!o.needs || flags.includes(o.needs)) && (!o.unless || !flags.includes(o.unless))) ?? step.options[0])?.next ?? null
    case 'check':
      return step.success
    case 'trial':
      return step.best
    case 'combat':
      return step.victory
    default:
      return null
  }
}

type Props = {
  visit: number
  step: SceneStep
  flags: readonly string[]
  mode: AutoGmMode
  /** Un jet du groupe attend d'être lancé. */
  rollPending: boolean
  /** Passe à cette scène (avec une ligne dans l'historique). */
  onSkip: (next: string) => void
}

/**
 * Menu de secours du MJ de la table : débloquer une partie sans rien
 * révéler de l'histoire (ni les scènes suivantes, ni les difficultés).
 */
export default function RescueMenu({ visit, step, flags, mode, rollPending, onSkip }: Props) {
  const t = useT()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const stop = useStopAdventure()
  const restart = useRestartScene()
  const cancelRoll = useCancelRoll()
  const setMode = useSetGmMode()
  const next = skipTarget(step, flags)

  const ask = async (message: string, action: () => void, danger = false) => {
    if (await confirm(message, { danger })) action()
  }

  return (
    <details className="self-start text-xs">
      <summary className="ui-btn ui-btn-ghost !min-h-7 cursor-pointer list-none text-ink/55">
        <LifeBuoy size={12} aria-hidden /> {t('autoGmRescue')}
      </summary>
      <div className="mt-1.5 flex flex-col items-start gap-1 rounded-lg border border-[var(--c-panel-line)] p-2">
        <p className="text-[11px] text-ink/55">{t('autoGmRescueHint')}</p>
        <button onClick={() => ask(t('autoGmRestartConfirm'), () => restart(visit))} className="ui-btn ui-btn-ghost !min-h-7 text-xs">
          {t('autoGmRestartScene')}
        </button>
        {rollPending && (
          <button onClick={() => cancelRoll(visit)} className="ui-btn ui-btn-ghost !min-h-7 text-xs">
            {t('autoGmCancelRoll')}
          </button>
        )}
        {next && (
          <button onClick={() => ask(t('autoGmSkipConfirm'), () => onSkip(next))} className="ui-btn ui-btn-ghost !min-h-7 text-xs">
            {t('autoGmSkip')}
          </button>
        )}
        <button onClick={() => setMode(mode === 'gm' ? 'auto' : 'gm')} className="ui-btn ui-btn-ghost !min-h-7 text-xs">
          {t(mode === 'gm' ? 'autoGmGiveBack' : 'autoGmTakeOver')}
        </button>
        <button onClick={() => ask(t('autoGmStopConfirm'), stop, true)} className="ui-btn ui-btn-ghost !min-h-7 text-xs text-red-400">
          {t('autoGmStop')}
        </button>
      </div>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </details>
  )
}

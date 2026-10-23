'use client'

import { Bot } from 'lucide-react'
import { useStorage } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { useConfirm } from '@/lib/useConfirm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useStopAdventure } from './useAdventureControls'

/**
 * Interrupteur du MJ automatique dans la barre du plateau, pour le MJ de la
 * table : allumé quand une aventure tourne (un clic l'arrête, après
 * confirmation), éteint sinon (un clic ouvre le panneau du MJ pour en choisir une).
 */
export default function AutoGmSwitch({ onOpenGmPanel }: { onOpenGmPanel: () => void }) {
  const t = useT()
  const running = useStorage((root) => !!root.autoGm)
  const stop = useStopAdventure()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

  const toggle = async () => {
    if (!running) return onOpenGmPanel()
    if (await confirm(t('autoGmStopConfirm'), { danger: true })) stop()
  }

  return (
    <>
      <button
        onClick={toggle}
        aria-pressed={!!running}
        title={t(running ? 'autoGmSwitchOn' : 'autoGmSwitchOff')}
        className={`ui-btn shadow-lg !min-h-9 ${running ? 'ui-btn-primary' : '!bg-[var(--c-panel-head)]'}`}
      >
        <Bot size={14} className={running ? '' : 'text-gm'} aria-hidden />
        {t('autoGmSwitch')}
        <span
          aria-hidden
          className={`ml-0.5 inline-block h-2 w-2 rounded-full ${running ? 'bg-emerald-400' : 'bg-[var(--c-panel-line)]'}`}
        />
      </button>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        danger={confirmState?.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}

'use client'

import { useMutation, useStorage } from '@liveblocks/react'
import { Check, ShieldQuestion, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useGameSystem } from '@/lib/roomSettings'
import { HERO_STAT_MAX, heroCheckWarnings, type HeroCheck } from '@/lib/heroChecks'

/**
 * Fiches déjà faites que les joueurs gardent pour l'aventure : le MJ les
 * accepte ou les refuse. Montré au MJ seulement (`AutoGmPanel`).
 */
export default function HeroApprovals() {
  const t = useT()
  const system = useGameSystem()
  const checks = useStorage((root) => root.heroChecks)
  const pending = [...(checks?.entries() ?? [])].filter(([, c]) => c.status === 'pending').sort(([, a], [, b]) => a.at - b.at)
  const decide = useMutation(({ storage }, key: string, status: HeroCheck['status']) => {
    const check = storage.get('heroChecks')?.get(key)
    if (check) storage.get('heroChecks')?.set(key, { ...check, status, at: Date.now() })
  }, [])

  if (!pending.length) return null
  return (
    <section className="flex max-h-[40%] shrink-0 flex-col gap-2 overflow-y-auto border-b border-[var(--c-panel-line)] p-3" aria-label={t('heroApprovalsTitle')}>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gm">
        <ShieldQuestion size={14} aria-hidden /> {t('heroApprovalsTitle')}
      </p>
      {pending.map(([key, check]) => {
        const warnings = heroCheckWarnings(check)
        return (
          <div key={key} className="flex flex-col gap-1.5 rounded-lg border border-gm/40 p-2 text-xs">
            <p>
              <b>{check.name}</b> <span className="text-ink/60">· {check.player} · {t('autoGmOwnLevel').replace('{n}', String(check.level))}</span>
            </p>
            <p className="flex flex-wrap gap-x-2 gap-y-0.5 text-ink/75">
              {system.stats.map(({ key: stat, label }) => {
                const value = check.stats[stat] ?? 0
                return (
                  <span key={stat} className={value > HERO_STAT_MAX ? 'font-semibold text-red-400' : ''}>
                    {t(label)} {value}
                  </span>
                )
              })}
            </p>
            {warnings.length > 0 ? (
              <ul className="text-red-400">
                {warnings.map((w) => (
                  <li key={w}>{t(w === 'level' ? 'heroApprovalLevel' : w === 'stat' ? 'heroApprovalStat' : 'heroApprovalMean')}</li>
                ))}
              </ul>
            ) : (
              <p className="text-ink/60">{t('heroApprovalFine')}</p>
            )}
            <div className="flex gap-1.5">
              <button onClick={() => decide(key, 'ok')} className="ui-btn !min-h-7 flex-1 text-xs">
                <Check size={13} aria-hidden /> {t('heroApprovalAccept')}
              </button>
              <button onClick={() => decide(key, 'refused')} className="ui-btn ui-btn-ghost !min-h-7 flex-1 text-xs">
                <X size={13} aria-hidden /> {t('heroApprovalRefuse')}
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}

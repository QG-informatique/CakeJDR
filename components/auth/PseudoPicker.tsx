'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useT } from '@/lib/useT'

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'reserved' | 'length' | 'error'

/**
 * Choix du pseudo à la première connexion.
 *
 * Le champ est prérempli avec le nom du compte Google ou Discord, et la
 * disponibilité s'affiche pendant la frappe : le joueur ajuste son pseudo
 * avant de valider, sans essuyer de refus. Les pseudos sont uniques sans
 * tenir compte des majuscules ; c'est le serveur qui tranche.
 */
export default function PseudoPicker({ initial }: { initial: string }) {
  const t = useT()
  const [value, setValue] = useState(initial)
  const [status, setStatus] = useState<Status>('idle')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const pseudo = value.trim()
    const controller = new AbortController()
    // Attente courte : on n'interroge le serveur qu'une fois la frappe posée.
    const timer = setTimeout(
      () => {
        if (pseudo.length < 2 || pseudo.length > 32) {
          setStatus('length')
          return
        }
        setStatus('checking')
        fetch(`/api/me/pseudo?value=${encodeURIComponent(pseudo)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
          .then((r) => r.json())
          .then((d) => {
            if (d?.available) setStatus('available')
            else if (d?.problem === 'taken' || d?.problem === 'reserved' || d?.problem === 'length')
              setStatus(d.problem)
            else setStatus('error')
          })
          .catch((err) => {
            if (err?.name !== 'AbortError') setStatus('error')
          })
      },
      status === 'idle' ? 0 : 300,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // `status` ne sert qu'à vérifier tout de suite le pseudo proposé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== 'available' || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: value }),
      })
      if (res.status === 409) setStatus('taken')
      else if (!res.ok) setStatus('error')
      else window.dispatchEvent(new Event('jdr_profile_change'))
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const message: Record<Status, string> = {
    idle: '',
    checking: t('pseudoChecking'),
    available: t('pseudoAvailable'),
    taken: t('pseudoTaken'),
    reserved: t('pseudoReserved'),
    length: t('pseudoLength'),
    error: t('pseudoError'),
  }
  const good = status === 'available'
  const bad = status !== 'available' && status !== 'checking' && status !== 'idle'

  return (
    <form
      onSubmit={submit}
      className="flex w-full max-w-md flex-col gap-5 rounded-2xl border border-ink/10 bg-shade/40 px-8 py-10 text-center backdrop-blur-md"
    >
      <div className="space-y-2">
        <h1 className="m-0 text-2xl font-bold text-ink">{t('pseudoTitle')}</h1>
        <p className="m-0 text-sm text-ink/60">{t('pseudoIntro')}</p>
      </div>

      <div className="flex flex-col gap-2 text-left">
        <div className="relative">
          <input
            // Seul champ de l'écran, et seule chose à faire avant d'entrer.
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={32}
            aria-label={t('pseudoTitle')}
            aria-invalid={bad}
            aria-describedby="pseudo-status"
            className={`w-full rounded-lg border bg-shade/40 px-4 py-3 pr-10 text-lg text-ink outline-none transition focus:ring-2 ${
              good
                ? 'border-emerald-400/70 focus:ring-emerald-300/30'
                : bad
                  ? 'border-rose-400/70 focus:ring-rose-300/30'
                  : 'border-ink/20 focus:ring-gm-soft/30'
            }`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            {good && <Check size={20} className="text-emerald-400" />}
            {bad && <X size={20} className="text-rose-400" />}
          </span>
        </div>
        <p
          id="pseudo-status"
          aria-live="polite"
          className={`m-0 min-h-[1.25rem] text-sm ${
            good ? 'text-emerald-300' : bad ? 'text-rose-300' : 'text-ink/50'
          }`}
        >
          {message[status]}
        </p>
      </div>

      <button
        type="submit"
        disabled={!good || saving}
        className="rounded-lg bg-gm px-4 py-3 font-semibold text-black transition hover:bg-gm-soft disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('pseudoConfirm')}
      </button>
    </form>
  )
}

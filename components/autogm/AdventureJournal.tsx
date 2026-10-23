'use client'

import { useState } from 'react'
import { useMutation } from '@liveblocks/react'
import { BookMarked, Eye, MapPinned } from 'lucide-react'
import { useT } from '@/lib/useT'
import type { Adventure } from '@/lib/autoGm/types'

const MAX_EVENTS = 2000

/** Clé d'un indice : l'identifiant de la scène et celui de l'indice. */
const clueKey = (scene: string, clue: string) => `${scene}:${clue}`

/**
 * Journal des joueurs (chemin parcouru, indices découverts) et, pour le MJ
 * qui mène avec « Voir côté MJ », son carnet : révéler les indices de la
 * scène, aller à n'importe quelle scène.
 */
export default function AdventureJournal({
  adventure,
  path,
  scene,
  revealed,
  auto,
  book,
  author,
  onJump,
}: {
  adventure: Adventure
  path: string[]
  scene: string
  revealed?: string[]
  /** MJ automatique : chaque indice d'une scène vue est noté d'office. */
  auto: boolean
  /** Carnet du MJ ouvert. */
  book: boolean
  /** Nom du meneur, pour les lignes du chat. */
  author: string
  onJump: (scene: string) => void
}) {
  const t = useT()
  const [target, setTarget] = useState('')
  const reveal = useMutation(({ storage }, key: string, text: string) => {
    const state = storage.get('autoGm')
    if (!state) return
    const list = state.get('revealed') ?? []
    if (list.includes(key)) return
    state.set('revealed', [...list, key])
    const events = storage.get('events')
    events.push({ id: crypto.randomUUID(), kind: 'chat', author, text: t('journalClueChat').replace('{n}', text), ts: Date.now(), isMJ: true })
    for (let i = events.length - MAX_EVENTS; i > 0; i -= 1) events.delete(0)
  }, [author, t])

  const steps = path.filter((id, i) => id !== path[i - 1])
  const seen = new Set(path)
  const shown = new Set(revealed ?? [])
  const clues = [...seen].flatMap((id) =>
    (adventure.scenes[id]?.clues ?? []).filter((c) => auto || shown.has(clueKey(id, c.id))).map((c) => ({ key: clueKey(id, c.id), text: c.text })),
  )
  const here = adventure.scenes[scene]?.clues ?? []

  return (
    <>
      <details className="rounded-lg border border-[var(--c-panel-line)] px-3 py-2 text-xs">
        <summary className="flex cursor-pointer items-center gap-1.5 font-semibold text-ink/75">
          <BookMarked size={13} className="text-gm" aria-hidden />
          {t('journalTitle')}
          {clues.length > 0 && <span className="text-ink/55">· {t('journalClueCount').replace('{n}', String(clues.length))}</span>}
        </summary>
        <p className="ui-label mt-2 !text-[10px]">{t('autoGmPath')}</p>
        <ol className="mt-1 flex flex-wrap items-center gap-x-1 text-ink/70">
          {steps.map((id, i) => (
            <li key={`${id}-${i}`}>
              {i > 0 && '→ '}
              {adventure.scenes[id]?.title ?? id}
            </li>
          ))}
        </ol>
        <p className="ui-label mt-2 !text-[10px]">{t('journalClues')}</p>
        {clues.length ? (
          <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4 text-ink/80">
            {clues.map((c) => (
              <li key={c.key}>{c.text}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-ink/55">{t('journalNoClue')}</p>
        )}
      </details>

      {book && (
        <div className="flex flex-col gap-2 rounded-lg border border-gm/40 px-3 py-2 text-xs">
          <p className="flex items-center gap-1.5 font-semibold text-gm">
            <MapPinned size={13} aria-hidden /> {t('journalBook')}
          </p>
          {here.length > 0 && (
            <ul className="flex flex-col gap-1">
              {here.map((c) => {
                const key = clueKey(scene, c.id)
                return (
                  <li key={key} className="flex items-start gap-2">
                    <span className="flex-1 text-ink/80">{c.text}</span>
                    {shown.has(key) ? (
                      <span className="shrink-0 text-ink/55">{t('journalRevealed')}</span>
                    ) : (
                      <button onClick={() => reveal(key, c.text)} className="ui-btn ui-btn-ghost !min-h-6 shrink-0 !px-1.5 text-xs">
                        <Eye size={12} aria-hidden /> {t('journalReveal')}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          <div className="flex items-center gap-1.5">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label={t('journalJump')}
              className="ui-input !min-h-7 min-w-0 flex-1 !py-0 text-xs"
            >
              <option value="">{t('journalJump')}</option>
              {Object.values(adventure.scenes)
                .filter((s) => s.id !== scene)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.chapter ? `${s.chapter} · ` : ''}
                    {s.title}
                  </option>
                ))}
            </select>
            <button
              disabled={!target}
              onClick={() => {
                onJump(target)
                setTarget('')
              }}
              className="ui-btn !min-h-7 shrink-0 text-xs"
            >
              {t('journalGo')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { Bot, ChevronDown, Crown, X } from 'lucide-react'
import type { RoomInfo } from './RoomList'
import { useT } from '@/lib/useT'
import { createRoom as createRoomApi } from '@/lib/roomsApi'
import { DEFAULT_SYSTEM, GAME_SYSTEMS, GAME_SYSTEM_IDS, type GameSystemId } from '@/lib/gameSystems'
import { ADVENTURES, adventureIn } from '@/lib/autoGm'
import { useLanguage } from '@/components/context/LanguageContext'
import AdventureDuration from '@/components/autogm/AdventureDuration'

interface Props {
  open: boolean
  onClose: () => void
  onCreated?: (room: RoomInfo) => void
}

/** Carte à choisir : bordure verte quand elle est retenue. */
function Choice({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${selected ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-ink/15 hover:bg-surface-hover'}`}
    >
      {children}
    </button>
  )
}

/**
 * Création d'une salle, dans l'ordre où l'on se pose les questions : son nom,
 * qui mène (et, avec le MJ automatique, quelle campagne), puis les réglages
 * qu'on garde le plus souvent tels quels, repliés sous « Options ».
 */
export default function RoomCreateModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [system, setSystem] = useState<GameSystemId>(DEFAULT_SYSTEM)
  // Qui mène : un humain (le créateur, MJ de la table) ou le MJ automatique,
  // qui démarre la campagne choisie dès l'ouverture de la salle.
  const [gm, setGm] = useState<'human' | 'auto'>('human')
  const adventureIds = Object.keys(ADVENTURES)
  const [adventure, setAdventure] = useState(adventureIds[0] ?? '')
  const [newHeroes, setNewHeroes] = useState(true)
  const { lang } = useLanguage()
  const [creating, setCreating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const t = useT()

  if (!open) return null

  const createRoom = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setErrorMsg('')
    try {
      const data = await createRoomApi({ name, system, gm, adventure: gm === 'auto' ? adventure : undefined, newHeroes })
      const room = {
        id: data.id,
        name,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('jdr_my_room', data.id)
      window.dispatchEvent(new Event('jdr_rooms_change'))
      onCreated?.(room)
      onClose()
    } catch (error) {
      // Le serveur refuse au-delà de MAX_ROOMS_PER_ACCOUNT tables.
      const message = error instanceof Error ? error.message : ''
      setErrorMsg(message === 'room limit reached' ? t('roomLimitReached') : message || t('creationFailed'))
    } finally {
      setCreating(false)
    }
  }

  const optionsSummary = `${GAME_SYSTEMS[system].name} · ${t(newHeroes ? 'gmHeroesNew' : 'gmHeroesOwn')}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-ink/10 bg-shade/80 p-5 text-ink shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('createRoom')}</h2>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-ghost !min-h-8 !px-1.5" aria-label={t('cancel')}>
            <X size={16} />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/70">{t('roomNameLabel')}</span>
          <input
            className="w-full rounded-md border border-ink/20 bg-surface px-3 py-2 text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-gm/30"
            placeholder={t('roomNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void createRoom() }}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-sm text-ink/70">{t('roomGmLabel')}</legend>
          <div className="grid grid-cols-2 gap-2">
            <Choice selected={gm === 'human'} onSelect={() => setGm('human')}>
              <span className="flex items-center gap-1.5 font-semibold"><Crown size={15} className="text-gm" aria-hidden /> {t('roomGmHuman')}</span>
              <span className="text-xs text-ink/60">{t('roomGmHumanHint')}</span>
            </Choice>
            <Choice selected={gm === 'auto'} onSelect={() => setGm('auto')}>
              <span className="flex items-center gap-1.5 font-semibold"><Bot size={15} className="text-gm" aria-hidden /> {t('autoGmModeAuto')}</span>
              <span className="text-xs text-ink/60">{t('roomGmAutoHint')}</span>
            </Choice>
          </div>
        </fieldset>

        {gm === 'auto' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm text-ink/70">{t('roomCampaign')}</legend>
            {adventureIds.map((id) => {
              const adv = adventureIn(id, lang)!
              return (
                <Choice key={id} selected={adventure === id} onSelect={() => setAdventure(id)}>
                  <span className="font-semibold">{adv.title}</span>
                  <span className="text-xs italic text-ink/65">{adv.pitch}</span>
                  <AdventureDuration adventure={adv} />
                </Choice>
              )
            })}
          </fieldset>
        )}

        <details className="group rounded-xl border border-ink/15">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm [&::-webkit-details-marker]:hidden">
            <span className="font-semibold">{t('roomOptions')}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-ink/55">{optionsSummary}</span>
            <ChevronDown size={15} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="flex flex-col gap-3 border-t border-ink/10 px-3 py-3">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={newHeroes} onChange={(e) => setNewHeroes(e.target.checked)} />
              <span className="flex flex-col">
                <span className="font-semibold">{t('newHeroesLabel')}</span>
                <span className="text-xs text-ink/60">{t(newHeroes ? 'newHeroesHint' : 'newHeroesOffHint')}</span>
              </span>
            </label>
            <fieldset className="flex flex-col gap-1.5">
              <legend className="mb-1 text-sm text-ink/70">{t('gameSystem')}</legend>
              {GAME_SYSTEM_IDS.map((id) => (
                <label
                  key={id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-sm ${system === id ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-ink/15 hover:bg-surface-hover'}`}
                >
                  <input
                    type="radio"
                    name="game-system"
                    className="mt-1"
                    checked={system === id}
                    onChange={() => setSystem(id)}
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{GAME_SYSTEMS[id].name}</span>
                    <span className="text-xs text-ink/60">{t(GAME_SYSTEMS[id].pitch)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </div>
        </details>

        <div className="flex flex-col gap-2">
          {creating ? (
            <div className="h-2 w-full overflow-hidden rounded bg-surface-hover">
              <div className="h-full animate-pulse bg-emerald-500" style={{ width: '100%' }} />
            </div>
          ) : (
            <button
              type="button"
              className="w-full rounded-md bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              disabled={!name.trim()}
              onClick={() => void createRoom()}
            >
              {t(gm === 'auto' ? 'roomCreateAndPlay' : 'createRoom')}
            </button>
          )}
          {errorMsg && <p className="text-center text-sm text-red-400">{errorMsg}</p>}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Bot, ChevronDown, Crown, Hammer, X } from 'lucide-react'
import type { RoomInfo } from './RoomList'
import { useT } from '@/lib/useT'
import { createRoom as createRoomApi } from '@/lib/roomsApi'
import { DEFAULT_SYSTEM, GAME_SYSTEMS, GAME_SYSTEM_IDS, type GameSystemId } from '@/lib/gameSystems'
import { ADVENTURES, adventureIn } from '@/lib/autoGm'
import { useLanguage } from '@/components/context/LanguageContext'
import AdventureDuration from '@/components/autogm/AdventureDuration'
import { useMyCreations } from '@/lib/creationsApi'

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
  // Créations de l'atelier du MJ : elles prennent le pas sur le choix tout prêt.
  const mySystems = useMyCreations('system', open)
  const myCampaigns = useMyCreations('campaign', open)
  const [customSystem, setCustomSystem] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<string | null>(null)
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
      const data = await createRoomApi({
        name,
        system,
        gm,
        adventure: gm === 'auto' && !campaign ? adventure : undefined,
        campaign: gm === 'auto' ? campaign ?? undefined : undefined,
        customSystem: customSystem ?? undefined,
        newHeroes,
      })
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

  const systemName = mySystems.items.find((c) => c.id === customSystem)?.name ?? GAME_SYSTEMS[system].name
  const optionsSummary = `${systemName} · ${t(newHeroes ? 'gmHeroesNew' : 'gmHeroesOwn')}`

  return (
    // Un clic sur le fond ferme la fenêtre ; Échap aussi.
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('createRoom')}
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
                <Choice key={id} selected={!campaign && adventure === id} onSelect={() => { setAdventure(id); setCampaign(null) }}>
                  <span className="font-semibold">{adv.title}</span>
                  <span className="text-xs italic text-ink/65">{adv.pitch}</span>
                  <AdventureDuration adventure={adv} />
                </Choice>
              )
            })}
            {myCampaigns.items.length > 0 && (
              <>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/55">{t('roomMyCampaigns')}</p>
                {myCampaigns.items.map((c) => (
                  <Choice key={c.id} selected={campaign === c.id} onSelect={() => setCampaign(c.id)}>
                    <span className="font-semibold">{c.name}</span>
                    {c.data.pitch && <span className="text-xs italic text-ink/65">{c.data.pitch}</span>}
                    <AdventureDuration adventure={c.data} />
                  </Choice>
                ))}
              </>
            )}
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
                    checked={!customSystem && system === id}
                    onChange={() => { setSystem(id); setCustomSystem(null) }}
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{GAME_SYSTEMS[id].name}</span>
                    <span className="text-xs text-ink/60">{t(GAME_SYSTEMS[id].pitch)}</span>
                  </span>
                </label>
              ))}
              {mySystems.items.length > 0 && (
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/55">{t('roomMySystems')}</p>
              )}
              {mySystems.items.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-2 py-1.5 text-sm ${customSystem === c.id ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-ink/15 hover:bg-surface-hover'}`}
                >
                  <input
                    type="radio"
                    name="game-system"
                    className="mt-1"
                    checked={customSystem === c.id}
                    onChange={() => setCustomSystem(c.id)}
                  />
                  <span className="flex flex-col">
                    <span className="font-semibold">{c.name}</span>
                    {c.data.pitch && <span className="text-xs text-ink/60">{c.data.pitch}</span>}
                  </span>
                </label>
              ))}
            </fieldset>
            <Link href="/atelier" className="flex items-center gap-1.5 self-start text-xs text-ink/70 underline underline-offset-2 hover:text-ink">
              <Hammer size={13} aria-hidden />
              {t('roomOpenAtelier')}
            </Link>
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

'use client'

import type { ReactNode } from 'react'
import { useT } from '@/lib/useT'
import { useGameSystem, useRoomSettings, useSetGameSystem, type DrawPermission, type SheetEditMode } from '@/lib/roomSettings'
import { GAME_SYSTEMS, GAME_SYSTEM_IDS, isGameSystemId } from '@/lib/gameSystems'
import { useMyCreations } from '@/lib/creationsApi'
import { parseCustomSystem } from '@/lib/customSystem'

/** Valeurs du choix de système qui ne sont pas un preset. */
const ROOM_CUSTOM = '__room__'
const MINE = 'mine:'

type Props = {
  /** Les joueurs voient les réglages sans pouvoir les changer. */
  readOnly?: boolean
  /** Glissé entre les niveaux et les votes (le lanceur d'aventure du panneau MJ). */
  middle?: ReactNode
  /** Sous chaque réglage, sous le choix de qui dessine (cases par joueur, MJ seulement). */
  drawExtra?: ReactNode
}

/**
 * Réglages de la table : fiches, dessin, système, héros, niveaux, votes,
 * musique. Le panneau du MJ s'en sert pour les changer ; l'écran d'avant
 * l'aventure les montre à tout le monde, en lecture seule pour les joueurs.
 */
export default function TableSettings({ readOnly = false, middle, drawExtra }: Props) {
  const t = useT()
  const { settings, update } = useRoomSettings()
  const system = useGameSystem()
  const levels = system.levelUp.length > 0
  const setSystem = useSetGameSystem()
  // Les systèmes de l'atelier du MJ, proposés à côté des presets.
  const mySystems = useMyCreations('system', !readOnly)
  const pickSystem = (value: string) => {
    if (isGameSystemId(value)) return setSystem(value)
    if (!value.startsWith(MINE)) return
    const data = parseCustomSystem(mySystems.items.find((c) => c.id === value.slice(MINE.length))?.data)
    if (data) setSystem(data)
  }

  const SHEET_OPTIONS: Array<[SheetEditMode, string]> = [
    ['own', t('gmSheetOwn')],
    ['gm', t('gmSheetGm')],
  ]
  const DRAW_OPTIONS: Array<[DrawPermission, string]> = [
    ['all', t('gmDrawAll')],
    ['gm', t('gmDrawGm')],
    ['some', t('gmDrawSome')],
  ]

  return (
    <>
      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmWhoEditsSheets')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmWhoEditsSheets')}>
          {SHEET_OPTIONS.map(([value, label]) => (
            <button key={value} disabled={readOnly} aria-pressed={settings.sheetEdit === value} onClick={() => update({ sheetEdit: value })}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmWhoDraws')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmWhoDraws')}>
          {DRAW_OPTIONS.map(([value, label]) => (
            <button key={value} disabled={readOnly} aria-pressed={settings.draw === value} onClick={() => update({ draw: value })}>
              {label}
            </button>
          ))}
        </div>
        {drawExtra}
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gameSystem')}</h3>
        <select
          value={settings.customSystem ? ROOM_CUSTOM : settings.system}
          disabled={readOnly}
          onChange={(e) => pickSystem(e.target.value)}
          className="ui-input w-full min-w-0 !min-h-8 text-sm"
          aria-label={t('gameSystem')}
        >
          {GAME_SYSTEM_IDS.map((id) => (
            <option key={id} value={id}>{GAME_SYSTEMS[id].name}</option>
          ))}
          {settings.customSystem && <option value={ROOM_CUSTOM}>{system.name}</option>}
          {mySystems.items.length > 0 && (
            <optgroup label={t('gmSystemMine')}>
              {mySystems.items.map((c) => (
                <option key={c.id} value={MINE + c.id}>{c.name}</option>
              ))}
            </optgroup>
          )}
        </select>
        {!readOnly && <p className="text-xs text-ink/55">{t('gmSystemHint')}</p>}
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmHeroesTitle')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmHeroesTitle')}>
          <button disabled={readOnly} aria-pressed={settings.newHeroes} onClick={() => update({ newHeroes: true })}>
            {t('gmHeroesNew')}
          </button>
          <button disabled={readOnly} aria-pressed={!settings.newHeroes} onClick={() => update({ newHeroes: false })}>
            {t('gmHeroesOwn')}
          </button>
        </div>
        <p className="text-xs text-ink/55">{t(settings.newHeroes ? 'newHeroesHint' : 'newHeroesOffHint')}</p>
      </section>

      {levels && (
        <section className="flex flex-col gap-1.5">
          <h3 className="ui-label !text-[10px]">{t('xpLevelUpTitle')}</h3>
          <div className="ui-seg" role="group" aria-label={t('xpLevelUpTitle')}>
            <button disabled={readOnly} aria-pressed={settings.autoLevelUp} onClick={() => update({ autoLevelUp: true })}>
              {t('xpLevelUpAuto')}
            </button>
            <button disabled={readOnly} aria-pressed={!settings.autoLevelUp} onClick={() => update({ autoLevelUp: false })}>
              {t('xpLevelUpGm')}
            </button>
          </div>
          <p className="text-xs text-ink/55">{t(settings.autoLevelUp ? 'xpLevelUpAutoHint' : 'xpLevelUpGmHint')}</p>
        </section>
      )}

      {middle}

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('gmVotes')}</h3>
        <div className="ui-seg" role="group" aria-label={t('gmVotes')}>
          <button disabled={readOnly} aria-pressed={!settings.anonymousVotes} onClick={() => update({ anonymousVotes: false })}>
            {t('gmVotesVisible')}
          </button>
          <button disabled={readOnly} aria-pressed={settings.anonymousVotes} onClick={() => update({ anonymousVotes: true })}>
            {t('gmVotesAnonymous')}
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-1.5">
        <h3 className="ui-label !text-[10px]">{t('autoMusic')}</h3>
        <div className="ui-seg" role="group" aria-label={t('autoMusic')}>
          <button disabled={readOnly} aria-pressed={settings.autoMusic} onClick={() => update({ autoMusic: true })}>
            {t('autoMusicOn')}
          </button>
          <button disabled={readOnly} aria-pressed={!settings.autoMusic} onClick={() => update({ autoMusic: false })}>
            {t('autoMusicOff')}
          </button>
        </div>
        <p className="text-xs text-ink/55">{t(settings.autoMusic ? 'autoMusicHint' : 'autoMusicOffHint')}</p>
      </section>
    </>
  )
}

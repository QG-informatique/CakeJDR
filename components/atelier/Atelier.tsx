'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Download, FileUp, Link2, Plus, Save, Share2, Trash2 } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useConfirm } from '@/lib/useConfirm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SmallSpinner from '@/components/ui/SmallSpinner'
import ThemeSwitcher from '@/components/ui/ThemeSwitcher'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import useProfile from '@/components/app/hooks/useProfile'
import { deleteCreation, readCreation, saveCreation, useMyCreations, type CreationKind } from '@/lib/creationsApi'
import { customFromPreset, parseCustomSystem, type CustomSystemData } from '@/lib/customSystem'
import { emptyCampaign, parseCampaign } from '@/lib/autoGm/custom'
import type { Adventure } from '@/lib/autoGm/types'
import SystemEditor from './SystemEditor'
import CampaignEditor from './CampaignEditor'
import { downloadJson, readJsonFile } from './fields'

type Draft =
  | { kind: 'system'; id?: string; data: CustomSystemData; shared: boolean }
  | { kind: 'campaign'; id?: string; data: Adventure; shared: boolean }

/** Ce qu'un autre MJ partage par son lien, en attendant d'être copié. */
type Incoming = { draft: Draft; name: string }

const SHARE_PARAM = 'partage'
const nameOf = (d: Draft) => (d.kind === 'system' ? d.data.name : d.data.title)

/** Une copie neuve, à soi : une campagne copiée prend un nouvel identifiant. */
function asCopy(d: Draft): Draft {
  return d.kind === 'campaign' ? { ...d, id: undefined, shared: false, data: { ...d.data, id: emptyCampaign().id } } : { ...d, id: undefined, shared: false }
}

function parseDraft(kind: CreationKind, raw: unknown): Draft | null {
  if (kind === 'system') {
    const data = parseCustomSystem(raw)
    return data ? { kind, data, shared: false } : null
  }
  const data = parseCampaign(raw)
  return data ? { kind, data, shared: false } : null
}

/**
 * Atelier du MJ (`/atelier`) : il y crée ses systèmes de jeu et ses
 * campagnes, rangés sur son compte, puis les choisit à la création d'une
 * table. Il peut les partager par un lien, ou les échanger en fichier.
 */
export default function Atelier() {
  const t = useT()
  const profile = useProfile()
  const signedIn = !!profile?.signedIn
  const systems = useMyCreations('system', signedIn)
  const campaigns = useMyCreations('campaign', signedIn)
  const [tab, setTab] = useState<CreationKind>('system')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const [incoming, setIncoming] = useState<Incoming | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const ask = (message: string) => confirm(message)

  // Un lien de partage ouvre la création : la sienne dans l'éditeur, celle d'un autre en attente de copie.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(SHARE_PARAM) ?? ''
    const [kind, id] = raw.split(':')
    if ((kind !== 'system' && kind !== 'campaign') || !id) return
    readCreation(kind, id)
      .then((c) => {
        const parsed = parseDraft(kind, c.data)
        if (!parsed) return
        setTab(kind)
        if (c.mine) setDraft({ ...parsed, id: c.id, shared: c.shared })
        else setIncoming({ draft: parsed, name: c.name })
      })
      .catch(() => setStatus({ text: t('atelierShareMissing'), error: true }))
  }, [t])

  // Prévenir avant de quitter la page avec des changements non enregistrés.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const open = async (next: Draft | null, markDirty = false) => {
    if (dirty && !(await ask(t('atelierDiscardConfirm')))) return false
    setDraft(next)
    setDirty(markDirty)
    setStatus(null)
    if (next) setTab(next.kind)
    return true
  }

  const edit = (next: Draft) => {
    setDraft(next)
    setDirty(true)
    setStatus(null)
  }

  const newDraft = () =>
    open(
      tab === 'system'
        ? { kind: 'system', data: { ...customFromPreset('narratif', t), name: t('atelierNewSystemName') }, shared: false }
        : { kind: 'campaign', data: emptyCampaign(), shared: false },
      true,
    )

  const save = async () => {
    if (!draft) return
    if (!nameOf(draft).trim()) {
      setStatus({ text: t('atelierNeedName'), error: true })
      return
    }
    setBusy(true)
    try {
      const res = await saveCreation(draft.kind, draft.data as never, draft.shared, draft.id)
      setDraft({ ...draft, id: res.id, data: res.data } as Draft)
      setDirty(false)
      setStatus({ text: t('atelierSaved') })
      ;(draft.kind === 'system' ? systems : campaigns).reload()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      setStatus({ text: msg === 'creation limit reached' ? t('atelierLimit') : msg === 'too many saves' ? t('atelierTooMany') : t('atelierSaveError'), error: true })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!draft) return
    if (!(await ask(t('atelierDeleteConfirm').replace('{n}', nameOf(draft) || '—')))) return
    if (draft.id) {
      try {
        await deleteCreation(draft.id)
      } catch {
        setStatus({ text: t('atelierSaveError'), error: true })
        return
      }
      ;(draft.kind === 'system' ? systems : campaigns).reload()
    }
    setDraft(null)
    setDirty(false)
  }

  const importFile = async (file: File) => {
    const raw = await readJsonFile(file)
    const content = raw && typeof raw === 'object' && 'data' in raw ? (raw as { data: unknown }).data : raw
    const parsed = parseDraft(tab, content)
    if (!parsed) {
      setStatus({ text: t('atelierImportError'), error: true })
      return
    }
    await open(asCopy(parsed), true)
  }

  const shareUrl = draft?.id ? `${window.location.origin}/atelier?${SHARE_PARAM}=${draft.kind}:${draft.id}` : ''
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus({ text: t('atelierLinkCopied') })
    } catch {
      setStatus({ text: shareUrl })
    }
  }

  const list = tab === 'system' ? systems : campaigns

  return (
    <>
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-3 text-ink sm:px-6">
        <header className="mb-4 flex flex-wrap items-center gap-3 pr-28">
          <Link href="/salles" className="ui-btn ui-btn-ghost">
            <ArrowLeft size={16} />
            {t('atelierBack')}
          </Link>
          <div>
            <h1 className="text-xl font-bold">{t('atelierTitle')}</h1>
            <p className="text-sm text-ink/60">{t('atelierIntro')}</p>
          </div>
        </header>

        {profile === null ? (
          <div className="flex flex-1 items-center justify-center" aria-busy="true">
            <SmallSpinner />
          </div>
        ) : !signedIn ? (
          <div className="ui-panel mx-auto mt-10 max-w-md space-y-3 p-6 text-center">
            {incoming && <p className="font-semibold">{t('atelierSharedBy').replace('{n}', incoming.name)}</p>}
            <p>{t('atelierSignIn')}</p>
            <Link href="/" className="ui-btn ui-btn-primary">
              {t('atelierSignInButton')}
            </Link>
          </div>
        ) : (
          <div className="grid flex-1 items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <aside className="ui-panel space-y-3 p-3 lg:sticky lg:top-3">
              <div className="ui-seg" role="tablist">
                {(['system', 'campaign'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => {
                      if (tab === k) return
                      void open(null).then((ok) => ok && setTab(k))
                    }}
                  >
                    {k === 'system' ? t('atelierTabSystems') : t('atelierTabCampaigns')}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" className="ui-btn ui-btn-primary flex-1" onClick={newDraft}>
                  <Plus size={14} />
                  {tab === 'system' ? t('atelierNewSystem') : t('atelierNewCampaign')}
                </button>
                <button type="button" className="ui-btn ui-btn-icon" onClick={() => fileRef.current?.click()} aria-label={t('atelierImport')} title={t('atelierImport')}>
                  <FileUp size={14} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void importFile(file)
                  }}
                />
              </div>
              {!list.loaded ? (
                <SmallSpinner />
              ) : list.items.length === 0 ? (
                <p className="text-xs text-ink/55">{tab === 'system' ? t('atelierNoSystems') : t('atelierNoCampaigns')}</p>
              ) : (
                <ul className="space-y-1">
                  {list.items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = parseDraft(tab, item.data)
                          if (parsed) void open({ ...parsed, id: item.id, shared: item.shared })
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--c-surface-hover)] ${draft?.id === item.id ? 'bg-[var(--c-surface-hover)] font-semibold' : ''}`}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.name || '—'}</span>
                        {item.shared && <Share2 size={12} className="shrink-0 text-ink/50" aria-label={t('atelierShared')} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-ink/50">{t('atelierUseHint')}</p>
            </aside>

            <section className="min-w-0 space-y-4">
              {incoming && (
                <div className="ui-panel flex flex-wrap items-center gap-3 p-4">
                  <p className="min-w-0 flex-1 text-sm">{t('atelierSharedBy').replace('{n}', incoming.name)}</p>
                  <button
                    type="button"
                    className="ui-btn ui-btn-primary"
                    onClick={() => void open(asCopy(incoming.draft), true).then((ok) => ok && setIncoming(null))}
                  >
                    <Copy size={14} />
                    {t('atelierCopyShared')}
                  </button>
                  <button type="button" className="ui-btn ui-btn-ghost" onClick={() => setIncoming(null)}>
                    {t('cancel')}
                  </button>
                </div>
              )}

              {!draft ? (
                <div className="ui-panel p-8 text-center text-sm text-ink/60">{tab === 'system' ? t('atelierEmptySystem') : t('atelierEmptyCampaign')}</div>
              ) : (
                <>
                  <div className="ui-panel sticky top-3 z-10 flex flex-wrap items-center gap-2 p-3">
                    <button type="button" className="ui-btn ui-btn-primary" onClick={save} disabled={busy || !dirty}>
                      {busy ? <SmallSpinner /> : <Save size={14} />}
                      {t('atelierSave')}
                    </button>
                    <label className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={draft.shared} onChange={(e) => edit({ ...draft, shared: e.target.checked } as Draft)} />
                      {t('atelierShareToggle')}
                    </label>
                    {draft.shared && draft.id && !dirty && (
                      <button type="button" className="ui-btn ui-btn-ghost" onClick={copyLink}>
                        <Link2 size={14} />
                        {t('atelierCopyLink')}
                      </button>
                    )}
                    <span className={`min-w-0 flex-1 truncate text-xs ${status?.error ? 'text-red-500' : 'text-ink/60'}`} role="status">
                      {status?.text ?? (dirty ? t('atelierUnsaved') : '')}
                    </span>
                    <button
                      type="button"
                      className="ui-btn ui-btn-ghost"
                      onClick={() => downloadJson(nameOf(draft), { cakejdr: draft.kind, data: draft.data })}
                    >
                      <Download size={14} />
                      {t('atelierExport')}
                    </button>
                    <button type="button" className="ui-btn ui-btn-ghost ui-btn-danger" onClick={remove}>
                      <Trash2 size={14} />
                      {t('atelierDelete')}
                    </button>
                  </div>

                  {draft.kind === 'system' ? (
                    <SystemEditor value={draft.data} onChange={(data) => edit({ ...draft, data })} confirm={ask} />
                  ) : (
                    <CampaignEditor key={draft.data.id} value={draft.data} onChange={(data) => edit({ ...draft, data })} confirm={ask} />
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  )
}

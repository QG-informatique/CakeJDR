'use client'

import { FC, useState } from 'react'
import { AddCompetenceModal } from './AddCompetenceModal'
import { useT } from '@/lib/useT'
import { type Competence } from '@/types/character'

type Props = {
  competences: Competence[],
  edit: boolean,
  onAdd: (comp: Competence) => void,
  onDelete: (id: string) => void,
}

const CompetencesPanel: FC<Props> = ({ competences = [], edit, onAdd, onDelete }) => {
  const [showCompModal, setShowCompModal] = useState(false)
  const t = useT()

  return (
    <div className="mt-4">
      <div className="ui-label mb-1.5">{t('skills')}</div>
      {edit ? (
        <>
          <div className="flex flex-col gap-2 mb-2">
            {competences.map((c, idx) => (
              <div key={`${c.id}-${idx}`} className="ui-well px-3 py-2 flex flex-col relative">
                <div className="flex items-center gap-2 pr-14 font-semibold leading-snug">{c.nom} {c.type && <span className="rounded-full border border-[var(--c-panel-line)] px-1.5 py-px text-[10px] font-medium text-ink/60">{c.type}</span>}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-ink/70">{t('effects')}: {c.effets} {c.degats && <span>- {t('damageOptional').replace(' (optional)','')}: {c.degats}</span>}</div>
                <button className="absolute top-1 right-2 text-xs text-red-400 hover:underline" onClick={() => onDelete(c.id)}>{t('delete')}</button>
              </div>
            ))}
          </div>
          {/* Add skill modal */}
          <AddCompetenceModal
            open={showCompModal}
            onClose={() => setShowCompModal(false)}
            onAdd={comp => { setShowCompModal(false); onAdd(comp); }}
          />
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setShowCompModal(true)}
          >
            {t('addSkill')}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          {competences.map((c, idx) => (
            <div key={`${c.id}-${idx}`} className="ui-well px-3 py-2">
              <div className="flex items-center gap-2 pr-14 font-semibold leading-snug">{c.nom} {c.type && <span className="rounded-full border border-[var(--c-panel-line)] px-1.5 py-px text-[10px] font-medium text-ink/60">{c.type}</span>}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-ink/70">{t('effects')}: {c.effets} {c.degats && <span>- {t('damageOptional').replace(' (optional)','')}: {c.degats}</span>}</div>
            </div>
          ))}
          {competences.length === 0 && <span className="text-ink/55 text-xs">{t('noSkill')}</span>}
        </div>
      )}
    </div>
  )
}

export default CompetencesPanel

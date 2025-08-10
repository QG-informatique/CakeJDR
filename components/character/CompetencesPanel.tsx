'use client'

import { FC, useState } from 'react'
import { AddCompetenceModal } from './AddCompetenceModal'
import { useT } from '@/lib/useT'

type Competence = { id: string; nom: string; type: string; effets: string; degats?: string }

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
      <div className="font-semibold text-base mb-1">{t('skills')}</div>
      {edit ? (
        <>
          <div className="flex flex-col gap-2 mb-2">
            {competences.map((c, idx) => (
              <div key={`${c.id}-${idx}`} className="bg-gray-800 rounded px-2 py-1 flex flex-col relative">
                <div className="font-semibold">{c.nom} <span className="text-xs italic text-gray-300">({c.type})</span></div>
                <div className="text-xs">{t('effects')}: {c.effets} {c.degats && <span>- {t('damageOptional').replace(' (optional)','')}: {c.degats}</span>}</div>
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-2 py-1"
            onClick={() => setShowCompModal(true)}
          >
            {t('addSkill')}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          {competences.map((c, idx) => (
            <div key={`${c.id}-${idx}`} className="bg-gray-800 rounded px-2 py-1">
              <div className="font-semibold">{c.nom} <span className="text-xs italic text-gray-300">({c.type})</span></div>
              <div className="text-xs">{t('effects')}: {c.effets} {c.degats && <span>- {t('damageOptional').replace(' (optional)','')}: {c.degats}</span>}</div>
            </div>
          ))}
          {competences.length === 0 && <span className="text-gray-400 text-xs">{t('noSkill')}</span>}
        </div>
      )}
    </div>
  )
}

export default CompetencesPanel

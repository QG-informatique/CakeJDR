import React, { useState } from "react";
import { useT } from '@/lib/useT'

export type NewCompetence = {
    id: string;
    nom: string;
    type: string;
    effets: string;
    degats?: string;
};

type AddCompetenceModalProps = {
    open: boolean;
    onClose: () => void;
    onAdd: (comp: NewCompetence) => void;
};

const competenceTypes = [
    "Physique",
    "Magique",
    "Sociale",
    "Technique",
    "Spéciale",
    "Passive",
    "Active",
    // Ajoute d'autres types si besoin
];

export const AddCompetenceModal: React.FC<AddCompetenceModalProps> = ({
    open,
    onClose,
    onAdd,
}) => {
    const t = useT()
    const [nom, setNom] = useState("");
    const [type, setType] = useState(competenceTypes[0]);
    const [effets, setEffets] = useState("");
    const [degats, setDegats] = useState("");

    const handleAdd = () => {
        if (!nom || !type || !effets) return;
        onAdd({
            id: crypto.randomUUID(),
            nom,
            type,
            effets,
            degats: degats ? degats : undefined,
        });
        setNom("");
        setType(competenceTypes[0]);
        setEffets("");
        setDegats("");
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div className="bg-surface-deep rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button
                    className="absolute top-2 right-2 text-ink/55 hover:text-ink"
                    onClick={onClose}
                >
                    ✕
                </button>
                <div className="text-lg font-semibold mb-4">{t('addSkill')}</div>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-sm mb-1">{t('name')}</label>
                        <input
                            className="w-full px-2 py-1 rounded bg-surface text-ink placeholder-ink"
                            value={nom}
                            onChange={e => setNom(e.target.value)}
                            placeholder={t('skillName')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t('type')}</label>
                        <select
                            className="w-full px-2 py-1 rounded bg-surface text-ink"
                            value={type}
                            onChange={e => setType(e.target.value)}
                        >
                            {competenceTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t('effects')}</label>
                        <input
                            className="w-full px-2 py-1 rounded bg-surface text-ink placeholder-ink"
                            value={effets}
                            onChange={e => setEffets(e.target.value)}
                            placeholder={t('effectDesc')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t('damageOptional')}</label>
                        <input
                            className="w-full px-2 py-1 rounded bg-surface text-ink placeholder-ink"
                            value={degats}
                            onChange={e => setDegats(e.target.value)}
                            placeholder="Ex: 2d6+3"
                        />
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        className="bg-surface-hover hover:bg-surface-hover text-ink rounded px-3 py-1"
                        onClick={onClose}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        className="bg-accent hover:bg-accent-hover text-on-accent rounded px-3 py-1"
                        onClick={handleAdd}
                        disabled={!nom || !type || !effets}
                    >
                        {t('add')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddCompetenceModal;
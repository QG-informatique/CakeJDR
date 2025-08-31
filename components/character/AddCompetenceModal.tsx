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
            <div className="bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    onClick={onClose}
                >
                    ✕
                </button>
                <div className="text-lg font-semibold mb-4">{t('addSkill')}</div>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="block text-sm mb-1">{t('name')}</label>
                        <input
                            className="w-full px-2 py-1 rounded bg-gray-800 text-white placeholder-white"
                            value={nom}
                            onChange={e => setNom(e.target.value)}
                            placeholder={t('skillName')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t('type')}</label>
                        <select
                            className="w-full px-2 py-1 rounded bg-gray-800 text-white"
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
                            className="w-full px-2 py-1 rounded bg-gray-800 text-white placeholder-white"
                            value={effets}
                            onChange={e => setEffets(e.target.value)}
                            placeholder={t('effectDesc')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">{t('damageOptional')}</label>
                        <input
                            className="w-full px-2 py-1 rounded bg-gray-800 text-white placeholder-white"
                            value={degats}
                            onChange={e => setDegats(e.target.value)}
                            placeholder="Ex: 2d6+3"
                        />
                    </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        className="bg-gray-700 hover:bg-gray-600 text-white rounded px-3 py-1"
                        onClick={onClose}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1"
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
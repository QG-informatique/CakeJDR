import React, { useState, useEffect, useRef } from 'react';
import CharacterSheet, { defaultPerso } from './CharacterSheet';

const loadProfile = () => JSON.parse(localStorage.getItem('jdr_profile') || '{"pseudo":"","color":"#1d4ed8","isMJ":false}');
const saveProfile = (profile: any) => {
  localStorage.setItem('jdr_profile', JSON.stringify(profile));
  window.dispatchEvent(new Event('jdr_profile_change'));
};

const loadCharacters = () => JSON.parse(localStorage.getItem('jdr_characters') || '[]');
const saveCharacters = (chars: any) => {
  localStorage.setItem('jdr_characters', JSON.stringify(chars));
  window.dispatchEvent(new Event('jdr_characters_change'));
};

const COLORS = ['#e11d48', '#1d4ed8', '#16a34a', '#f59e0b', '#d946ef', '#0d9488', '#f97316', '#a3a3a3', '#ffffff', '#000000'];

export default function MenuAccueil() {
  const [profile, setProfile] = useState({ pseudo: '', color: '#1d4ed8', isMJ: false });
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draftChar, setDraftChar] = useState<any>(defaultPerso);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setProfile(loadProfile());
    setCharacters(loadCharacters());
  }, []);

  const handleProfileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    saveProfile(profile);
    alert('Profil sauvegardé !');
  };

  const handleNewCharacter = () => {
    setDraftChar({ ...defaultPerso, id: Date.now() });
    setModalOpen(true);
  };

  const handleSelectChar = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleSaveDraft = () => {
    const toSave = { ...draftChar, name: draftChar.name || draftChar.nom };
    const updated = [...characters, toSave];
    setCharacters(updated);
    saveCharacters(updated);
    setModalOpen(false);
    setSelectedIdx(updated.length - 1);
  };

  const handleDeleteChar = (idx: number) => {
    if (!window.confirm('Supprimer cette fiche ?')) return;
    const updated = characters.filter((_, i) => i !== idx);
    setCharacters(updated);
    saveCharacters(updated);
    setSelectedIdx(null);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: ProgressEvent<FileReader>) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        const toSave = { ...imported, name: imported.name || imported.nom };
        const updated = [...characters, toSave];
        setCharacters(updated);
        saveCharacters(updated);
        alert('Fiche importée !');
      } catch {
        alert('Erreur : fichier invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportChar = () => {
    if (selectedIdx === null) return;
    const char = characters[selectedIdx];
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(char.name || char.nom || 'fiche').replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Fond adapté à la partie jeu */}
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 text-black dark:text-white transition-colors">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Profil */}
          <section className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Profil</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-1" htmlFor="pseudoInput">
                  Nom de profil :
                </label>
                <input
                  id="pseudoInput"
                  type="text"
                  value={profile.pseudo}
                  onChange={handleProfileChange('pseudo')}
                  className="w-full border-2 border-gray-300 rounded p-2 text-black"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Couleur préférée :</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setProfile(prev => ({ ...prev, color: c }))}
                      className={`w-6 h-6 rounded-full border-2 ${profile.color === c ? 'border-black dark:border-white scale-110' : 'border-gray-400'}`}
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="mjCheck"
                  type="checkbox"
                  checked={profile.isMJ}
                  onChange={handleProfileChange('isMJ')}
                  className="form-checkbox scale-125"
                />
                <label htmlFor="mjCheck" className="font-semibold">
                  MJ (Maître du Jeu) — accès aux fonctions MJ
                </label>
              </div>
              <button
                onClick={handleSaveProfile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
              >
                Sauvegarder le profil
              </button>
            </div>
          </section>

          {/* Liste Fiches */}
          <section className="bg-gray-100 dark:bg-gray-800 rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Vos fiches de personnage</h2>
            {characters.length === 0 ? (
              <p>Aucune fiche sauvegardée.</p>
            ) : (
              <ul className="divide-y">
                {characters.map((ch, idx) => (
                  <li key={ch.id} className="flex justify-between items-center py-2">
                    <span className="font-semibold">
                      {ch.nom || ch.name || `Fiche #${idx + 1}`}
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleSelectChar(idx)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                      >
                        Sélectionner
                      </button>
                      <button
                        onClick={() => handleDeleteChar(idx)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-x-2">
              <button
                onClick={handleNewCharacter}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
              >
                Nouvelle fiche
              </button>
              <button
                onClick={handleImportClick}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded"
              >
                Importer
              </button>
              <button
                onClick={handleExportChar}
                disabled={selectedIdx === null}
                className={`font-semibold px-4 py-2 rounded ${selectedIdx === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
              >
                Exporter
              </button>
              {/* Input hidden pour importer JSON */}
              <input
                type="file"
                accept="application/json"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </section>

          {/* Détail de fiche sélectionnée */}
          {selectedIdx !== null && (
            <section className="bg-gray-200 dark:bg-gray-700 rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold mb-4">Détails de la fiche</h2>
              <pre className="whitespace-pre-wrap bg-white dark:bg-gray-900 text-black dark:text-white p-4 rounded overflow-auto text-sm">
                {JSON.stringify(characters[selectedIdx], null, 2)}
              </pre>
            </section>
          )}
        </div>
      </div>
      {/* Modal fiche personnage (création/édition), plus large */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl overflow-y-auto max-h-full min-w-[480px]">
            <CharacterSheet perso={draftChar} onUpdate={setDraftChar} creation />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-gray-600 rounded text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDraft}
                className="px-3 py-1 bg-blue-600 rounded text-white"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

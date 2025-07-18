/* ---------------------------------------------------------------------------
 * Composant MenuAccueil.jsx
 * ---------------------------------------------------------------------------
 * Modifications history:
 *   v1.0 - 18/07/2025 - Création initiale du composant MenuAccueil.
 * ---------------------------------------------------------------------------
 * Fonctionnalités :
 *   • Gestion du profil (pseudo + couleur) persistant dans localStorage (clé "jdr_profile").
 *   • Liste dynamique des fiches de personnage (localStorage clé "jdr_characters") :
 *       - Création, sélection, suppression, import (.json) & export (.json).
 *   • Affichage d’un aperçu JSON de la fiche sélectionnée.
 * ---------------------------------------------------------------------------
 * Intégration :
 *   1. Copie ce fichier dans ton dossier "components" (ou équivalent).
 *   2. Importe-le depuis ta page d’accueil :
 *        import MenuAccueil from './components/MenuAccueil';
 *        ...
 *        <MenuAccueil />
 *   3. Assure‑toi d’avoir React (18+) et tailwind.css OU adapte les classes.
 * ---------------------------------------------------------------------------*/

import React, { useState, useEffect, useRef } from 'react';

/**
 * Helpers localStorage – isolés pour être réutilisés / testés.
 */
const loadProfile = () => JSON.parse(localStorage.getItem('jdr_profile') || '{"pseudo":"","color":"#ff0000"}');
const saveProfile = (profile) => localStorage.setItem('jdr_profile', JSON.stringify(profile));

const loadCharacters = () => JSON.parse(localStorage.getItem('jdr_characters') || '[]');
const saveCharacters = (chars) => localStorage.setItem('jdr_characters', JSON.stringify(chars));

export default function MenuAccueil() {
  /* ---------------------------------------------------------------------
   * ÉTATS
   * -------------------------------------------------------------------*/
  const [profile, setProfile] = useState({ pseudo: '', color: '#ff0000' });
  const [characters, setCharacters] = useState([]); // liste des fiches
  const [selectedIdx, setSelectedIdx] = useState(null); // index de la fiche affichée

  // Réf pour l’input hidden (import JSON)
  const fileInputRef = useRef(null);

  /* ---------------------------------------------------------------------
   * CHARGEMENT INIT.
   * -------------------------------------------------------------------*/
  useEffect(() => {
    setProfile(loadProfile());
    setCharacters(loadCharacters());
  }, []);

  /* ---------------------------------------------------------------------
   * Handlers Profil
   * -------------------------------------------------------------------*/
  const handleProfileChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSaveProfile = () => {
    saveProfile(profile);
    alert('Profil sauvegardé !');
  };

  /* ---------------------------------------------------------------------
   * Handlers Fiches Personnage
   * -------------------------------------------------------------------*/
  const handleNewCharacter = () => {
    const name = prompt('Nom du personnage ?');
    if (!name) return;

    const newChar = {
      id: Date.now(),
      name,
      stats: { force: 0, agilite: 0, intelligence: 0 },
      createdAt: new Date().toISOString()
    };

    const updated = [...characters, newChar];
    setCharacters(updated);
    saveCharacters(updated);
  };

  const handleSelectChar = (idx) => {
    setSelectedIdx(idx);
  };

  const handleDeleteChar = (idx) => {
    if (!window.confirm('Supprimer cette fiche ?')) return;
    const updated = characters.filter((_, i) => i !== idx);
    setCharacters(updated);
    saveCharacters(updated);
    setSelectedIdx(null);
  };

  /* ------------------ Import / Export ------------------ */
  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target.result);
        const updated = [...characters, imported];
        setCharacters(updated);
        saveCharacters(updated);
        alert('Fiche importée !');
      } catch (err) {
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
    a.download = `${char.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ---------------------------------------------------------------------
   * Rendu JSX – Tailwind pour layout simple.
   * -------------------------------------------------------------------*/
  return (
    <div className="mx-auto max-w-2xl p-4 space-y-6">
      {/* ---------------- Profil ---------------- */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Profil</h2>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold" htmlFor="pseudoInput">Pseudo :</label>
            <input
              id="pseudoInput"
              type="text"
              value={profile.pseudo}
              onChange={handleProfileChange('pseudo')}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block font-semibold" htmlFor="colorInput">Couleur préférée :</label>
            <input
              id="colorInput"
              type="color"
              value={profile.color}
              onChange={handleProfileChange('color')}
              className="h-10 w-full p-1"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >Sauvegarder le profil</button>
        </div>
      </section>

      {/* ---------------- Liste Fiches ---------------- */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Vos fiches de personnage</h2>
        {characters.length === 0 ? (
          <p>Aucune fiche sauvegardée.</p>
        ) : (
          <ul className="divide-y">
            {characters.map((ch, idx) => (
              <li key={ch.id} className="flex justify-between items-center py-2">
                <span>{ch.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleSelectChar(idx)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  >Sélectionner</button>
                  <button
                    onClick={() => handleDeleteChar(idx)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                  >Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-x-2">
          <button
            onClick={handleNewCharacter}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >Nouvelle fiche</button>
          <button
            onClick={handleImportClick}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded"
          >Importer</button>
          <button
            onClick={handleExportChar}
            disabled={selectedIdx === null}
            className={`font-semibold px-4 py-2 rounded ${selectedIdx === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
          >Exporter</button>
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

      {/* ---------------- Aperçu Fiche ---------------- */}
      {selectedIdx !== null && (
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold mb-4">Détails de la fiche</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(characters[selectedIdx], null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}

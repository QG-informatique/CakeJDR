'use client'

import { useState, useEffect } from 'react'
const PROFILE_KEY = 'jdr_profile'

export default function Login({ onLogin }:{ onLogin:(pseudo:string)=>void }) {
  /* ----------------------------------------------------------------------- */
  /*  État local                                                             */
  /* ----------------------------------------------------------------------- */
  const [pseudo, setPseudo] = useState('')
  const [error,  setError]  = useState<string | null>(null)
  const [registerMode, setRegisterMode] = useState(false)

  /* ----------------------------------------------------------------------- */
  /*  Pré‑remplissage si profil déjà présent                                 */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (!raw) return
      const prof = JSON.parse(raw)
      setPseudo(prof.pseudo || '')
    } catch {}
  }, [])

  /* ----------------------------------------------------------------------- */
  /*  Validation                                                             */
  /* ----------------------------------------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPseudo = pseudo.trim()
    if (!trimmedPseudo) { setError('Choisis un pseudo'); return }

    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')

    if (registerMode) {
      /* ---------- Création ---------- */
      const newProf = {
        pseudo: trimmedPseudo,
        color: '#1d4ed8',
        isMJ: false,
        loggedIn: true
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(newProf))
      window.dispatchEvent(new Event('jdr_profile_change'))
      setError(null)
      onLogin(trimmedPseudo)
    } else {
      /* ---------- Connexion ---------- */
      if (!saved.pseudo) { setError('Aucun compte, créez-en un'); return }
      if (saved.pseudo !== trimmedPseudo) { setError('Pseudo inconnu'); return }

      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...saved, loggedIn: true }))
      window.dispatchEvent(new Event('jdr_profile_change'))
      setError(null)
      onLogin(trimmedPseudo)
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  UI                                                                     */
  /* ----------------------------------------------------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 w-72 shadow-lg"
    >

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <input
        value={pseudo}
        onChange={e => setPseudo(e.target.value)}
        placeholder="Pseudo"
        className="px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400"
      />

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
      >
        Valider
      </button>
      <button
        type="button"
        onClick={() => { setRegisterMode(m => !m); setError(null) }}
        className="text-sm text-blue-300 hover:underline self-center"
      >
        {registerMode ? 'Déjà inscrit ?' : 'Pas encore de compte ? S\’inscrire'}
      </button>
    </form>
  )
}

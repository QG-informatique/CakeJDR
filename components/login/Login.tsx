'use client'

import { useState, useEffect } from 'react'
const PROFILE_KEY = 'jdr_profile'

export default function Login({ onLogin }:{ onLogin:(pseudo:string)=>void }) {
  /* ----------------------------------------------------------------------- */
  /*  État local                                                             */
  /* ----------------------------------------------------------------------- */
  const [pseudo, setPseudo] = useState('')
  const [pass,   setPass]   = useState('')
  const [error,  setError]  = useState<string | null>(null)

  /* ----------------------------------------------------------------------- */
  /*  Pré‑remplissage si profil déjà présent                                 */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (!raw) return
      const prof = JSON.parse(raw)
      setPseudo(prof.pseudo || '')
      if (prof.loggedIn) onLogin(prof.pseudo)  // auto‑login seulement si flag
    } catch {}
  }, [])

  /* ----------------------------------------------------------------------- */
  /*  Validation                                                             */
  /* ----------------------------------------------------------------------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPseudo = pseudo.trim()
    const trimmedPass   = pass.trim()
    if (!trimmedPseudo || !trimmedPass) { setError('Remplis tous les champs'); return }

    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')

    /* ---------- Connexion ---------- */
    if (saved.pseudo) {
      if (saved.pseudo !== trimmedPseudo) { setError('Pseudo inconnu, créez un compte'); return }
      if (saved.password !== trimmedPass) { setError('Mot de passe incorrect'); return }

      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...saved, loggedIn: true }))
      window.dispatchEvent(new Event('jdr_profile_change'))
      setError(null)
      onLogin(trimmedPseudo)
      return
    }

    /* ---------- Création ---------- */
    const newProf = {
      pseudo: trimmedPseudo,
      password: trimmedPass,
      color: '#1d4ed8',
      isMJ: false,
      loggedIn: true
    }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProf))
    window.dispatchEvent(new Event('jdr_profile_change'))
    setError(null)
    onLogin(trimmedPseudo)
  }

  /* ----------------------------------------------------------------------- */
  /*  UI                                                                     */
  /* ----------------------------------------------------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-lg flex flex-col gap-4 w-72 shadow-lg"
    >
      <h2 className="text-xl font-bold text-white text-center">Connexion</h2>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <input
        value={pseudo}
        onChange={e => setPseudo(e.target.value)}
        placeholder="Pseudo"
        className="px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400"
      />
      <input
        type="password"
        value={pass}
        onChange={e => setPass(e.target.value)}
        placeholder="Mot de passe"
        className="px-3 py-2 rounded bg-gray-700 text-white placeholder-gray-400"
      />

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
      >
        Valider
      </button>
    </form>
  )
}

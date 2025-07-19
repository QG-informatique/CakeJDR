'use client'

import { useState, useEffect } from 'react'

interface Props {
  onLogin: (pseudo: string) => void
}

const PROFILE_KEY = 'jdr_profile'

export default function Login({ onLogin }: Props) {
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const prof = JSON.parse(saved)
        if (prof.pseudo) onLogin(prof.pseudo)
        setPseudo(prof.pseudo || '')
      }
    } catch {}
  }, [onLogin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedPseudo = pseudo.trim()
    const trimmedPass = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedPseudo || !trimmedPass) {
      setError('Pseudo et mot de passe requis')
      return
    }
    if (mode === 'register' && trimmedPass !== trimmedConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      const existing = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')

      if (mode === 'login') {
        if (existing.pseudo !== trimmedPseudo) {
          setError('Pseudo inconnu, créez un compte')
          return
        }
        if (existing.password && existing.password !== trimmedPass) {
          setError('Mot de passe incorrect')
          return
        }
        // Connexion OK
        setError(null)
        onLogin(trimmedPseudo)
      } else {
        // Inscription
        if (existing.pseudo === trimmedPseudo) {
          setError('Ce pseudo est déjà utilisé')
          return
        }
        const updated = { pseudo: trimmedPseudo, password: trimmedPass }
        localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
        window.dispatchEvent(new Event('jdr_profile_change'))
        setError(null)
        onLogin(trimmedPseudo)
      }
    } catch {
      setError('Erreur interne, réessayez')
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
      {/* Fond animé de dés (svg ou css) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          viewBox="0 0 100 100"
        >
          {[...Array(20)].map((_, i) => {
            const x = Math.random() * 100
            const y = Math.random() * 100
            const size = 3 + Math.random() * 5
            const rotate = Math.random() * 360
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={size}
                height={size}
                fill="white"
                opacity="0.15"
                transform={`rotate(${rotate} ${x + size / 2} ${y + size / 2})`}
                rx="0.5"
                ry="0.5"
              />
            )
          })}
        </svg>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen pt-20 px-4">
        <h1
          className="text-5xl font-extrabold mb-10 tracking-wide select-none flex items-center gap-3"
          style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
        >
          CAKE <span className="ml-1">JDR</span>{' '}
          {/* Tu peux changer cet emoji par un svg plus stylé si tu veux */}
          <span aria-label="gâteau" role="img">
            🎂
          </span>
        </h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm bg-gray-800 bg-opacity-80 rounded-lg p-8 shadow-lg"
          noValidate
        >
          <label htmlFor="pseudo" className="block text-lg font-semibold mb-2">
            Pseudo
          </label>
          <input
            id="pseudo"
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Entrez votre pseudo"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
            autoFocus
            spellCheck={false}
          />

          <label htmlFor="password" className="block text-lg font-semibold mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Entrez votre mot de passe"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            spellCheck={false}
          />

          {mode === 'register' && (
            <>
              <label htmlFor="confirmPassword" className="block text-lg font-semibold mb-2">
                Confirmez le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                spellCheck={false}
              />
            </>
          )}

          {error && (
            <p className="text-red-400 mb-4 font-semibold select-none" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 transition-colors rounded py-2 font-semibold text-white shadow-md"
          >
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p
          className="mt-6 text-gray-300 italic select-none text-center max-w-xs cursor-pointer hover:underline"
          onClick={() => {
            setError(null)
            setMode(mode === 'login' ? 'register' : 'login')
            setPassword('')
            setConfirmPassword('')
          }}
        >
          {mode === 'login'
            ? "Pas encore de compte ? Cliquez ici pour vous inscrire."
            : 'Vous avez déjà un compte ? Cliquez ici pour vous connecter.'}
        </p>

        {/* Icône D20 en bas */}
        <div className="mt-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            className="w-16 h-16 text-white opacity-40 mx-auto"
            fill="currentColor"
          >
            <path d="M32 2 2 22l30 40 30-40L32 2zM11.9 23.8 32 52.6 52.1 23.8 32 6.8l-20.1 17z" />
          </svg>
        </div>
      </main>
    </div>
  )
}

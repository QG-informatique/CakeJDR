'use client'
import { useState, useEffect } from 'react'

interface Props { onLogin: (name: string) => void }

const PROFILE_KEY = 'jdr_profile'

export default function Login({ onLogin }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const prof = JSON.parse(saved)
        if (prof.pseudo) onLogin(prof.pseudo)
        setName(prof.pseudo || '')
      }
    } catch {
      /* empty */
    }
  }, [onLogin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } catch { return {} }
    })()
    const updated = { ...existing, pseudo: trimmed }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('jdr_profile_change'))
    onLogin(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded shadow-lg">
        <label className="block mb-2">Pseudo :</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="px-2 py-1 rounded text-black"
        />
        <button type="submit" className="ml-2 px-3 py-1 bg-blue-600 rounded text-white">Entrer</button>
      </div>
    </form>
  )
}

'use client'
import { useState, useEffect } from 'react'

interface Props { onLogin: (name: string) => void }

const STORAGE_KEY = 'cakejdr_user'

export default function Login({ onLogin }: Props) {
  const [name, setName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) onLogin(saved)
  }, [onLogin])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
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

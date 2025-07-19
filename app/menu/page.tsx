'use client'
import MenuAccueil from '@/components/MenuAccueil'
import Link from 'next/link'

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4">
        <Link href="/" className="bg-gray-800 px-3 py-1 rounded">Retour au jeu</Link>
      </div>
      <MenuAccueil />
    </div>
  )
}

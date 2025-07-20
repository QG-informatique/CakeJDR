"use client"
import { FC } from 'react'
import Link from 'next/link'
import ProfileColorPicker from './ProfileColorPicker'

export type User = { pseudo: string; isMJ: boolean; color: string }

interface Props {
  user: User | null
  onLogout: () => void
  onToggleMJ: () => void
  onChangeColor: (c: string) => void
}

const MenuHeader: FC<Props> = ({ user, onLogout, onToggleMJ, onChangeColor }) => (
  <header className="flex items-center justify-between mb-8 select-none">
    <h1 className="text-4xl font-extrabold tracking-wide flex items-center gap-3">
      CAKE JDR <span role="img" aria-label="gateau">🎂</span>
    </h1>
    {user && (
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded font-semibold text-sm"
          title="Revenir à la partie"
        >
          Table de jeux
        </Link>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-semibold text-sm"
          title="Se déconnecter"
        >
          Déconnexion
        </button>
        <button
          className={`px-3 py-1 rounded font-semibold text-sm text-white ${
            user.isMJ ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-600 hover:bg-gray-700'
          }`}
          onClick={onToggleMJ}
          title={user.isMJ ? 'Désactiver le mode MJ' : 'Activer le mode MJ'}
        >
          {user.isMJ ? 'Mode MJ activé' : 'Activer le mode MJ'}
        </button>
        <ProfileColorPicker color={user.color} onChange={onChangeColor} />
      </div>
    )}
  </header>
)

export default MenuHeader

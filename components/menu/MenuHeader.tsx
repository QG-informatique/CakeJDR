"use client"
import { FC } from 'react'
import Link from 'next/link'
import CakeLogo from '../ui/CakeLogo'

export type User = { pseudo: string; isMJ: boolean; color: string }

interface Props {
  user: User | null
  onLogout: () => void
}

const MenuHeader: FC<Props> = ({ user, onLogout }) => (
  <header className="flex items-center mb-8 select-none text-white">
    <div className="w-32">
      {user && (
        <Link
          href="/"
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold text-lg block text-center"
        >
          Table de jeux
        </Link>
      )}
    </div>
    <div className="flex-1 flex justify-center">
      <CakeLogo />
    </div>
    <div className="w-32 text-right">
      {user && (
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold text-lg w-full"
        >
          Déconnexion
        </button>
      )}
    </div>
  </header>
)

export default MenuHeader

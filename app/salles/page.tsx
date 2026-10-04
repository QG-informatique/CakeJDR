'use client'
import MenuAccueil from '@/components/menu/MenuAccueil'

// Page des salles et des fiches de personnage, pour un joueur connecté.
export default function SallesPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MenuAccueil page="salles" />
    </div>
  )
}

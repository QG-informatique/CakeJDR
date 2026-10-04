'use client'
import MenuAccueil from '@/components/menu/MenuAccueil'

// Page d'arrivée : la connexion. Un joueur déjà connecté passe aux salles.
export default function HomePage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MenuAccueil page="landing" />
    </div>
  )
}

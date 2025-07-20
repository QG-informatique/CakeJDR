'use client'
import MenuAccueil from '@/components/menu/MenuAccueil'
import RpgBackground from '@/components/ui/RpgBackground'

export default function MenuAccueilPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <RpgBackground />
      <MenuAccueil />
    </div>
  )
}
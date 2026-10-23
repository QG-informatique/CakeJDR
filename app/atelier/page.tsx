import type { Metadata } from 'next'
import Atelier from '@/components/atelier/Atelier'

export const metadata: Metadata = { title: 'Atelier du MJ – CakeJDR' }

// Systèmes de jeu et campagnes du MJ connecté.
export default function AtelierPage() {
  return <Atelier />
}

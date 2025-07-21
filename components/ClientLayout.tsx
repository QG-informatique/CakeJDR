'use client'
import BackgroundWrapper from '@/components/ui/BackgroundWrapper'
import { BackgroundProvider } from '@/components/context/BackgroundContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Provider global pour le fond de l'application
  return (
    <BackgroundProvider>
      <BackgroundWrapper />
      <main className="relative z-10">{children}</main>
    </BackgroundProvider>
  )
}

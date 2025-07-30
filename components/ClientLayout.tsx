'use client'
import BackgroundWrapper from '@/components/ui/BackgroundWrapper'
import { BackgroundProvider } from '@/components/context/BackgroundContext'
import { LanguageProvider } from '@/components/context/LanguageContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <BackgroundProvider>
        <BackgroundWrapper />
        <main className="relative z-10">{children}</main>
      </BackgroundProvider>
    </LanguageProvider>
  )
}

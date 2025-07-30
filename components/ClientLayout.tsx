'use client'
import BackgroundWrapper from '@/components/ui/BackgroundWrapper'
import { BackgroundProvider } from '@/components/context/BackgroundContext'
import { LanguageProvider } from '@/components/context/LanguageContext'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <BackgroundProvider>
        <BackgroundWrapper />
        <LanguageSwitcher />
        <main className="relative z-10">{children}</main>
      </BackgroundProvider>
    </LanguageProvider>
  )
}

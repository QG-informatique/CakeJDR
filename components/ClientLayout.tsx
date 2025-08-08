'use client'
import BackgroundWrapper from '@/components/ui/BackgroundWrapper'
import { BackgroundProvider } from '@/components/context/BackgroundContext'
import { LanguageProvider } from '@/components/context/LanguageContext'
import { DialogProvider } from '@/components/context/DialogContext'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DialogProvider>
        <BackgroundProvider>
          <BackgroundWrapper />
          <main className="relative z-10">{children}</main>
        </BackgroundProvider>
      </DialogProvider>
    </LanguageProvider>
  )
}

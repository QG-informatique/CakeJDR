'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/components/context/LanguageContext'
import { ThemeProvider } from '@/components/context/ThemeContext'
import HtmlLangSync from '@/components/ui/HtmlLangSync'
import CreditQG from '@/components/ui/CreditQG'

// Charge le fond uniquement côté client pour éviter les plantages SSR/hydration
const BackgroundWrapper = dynamic(() => import('@/components/ui/BackgroundWrapper'), {
  ssr: false,
})

// Petit garde-fou : si le background crashe, on n’abat pas tout le layout

interface BackgroundBoundaryProps { // FIX: explicit props interface
  children: React.ReactNode // FIX: typed children
}
interface BackgroundBoundaryState { hasError: boolean } // FIX: explicit state interface
class BackgroundErrorBoundary extends React.Component<BackgroundBoundaryProps, BackgroundBoundaryState, never> { // FIX: typed generics
  constructor(props: BackgroundBoundaryProps) { // FIX: typed constructor

    super(props)
    this.state = { hasError: false } // FIX: initialize state
  }
  static getDerivedStateFromError(error: unknown): BackgroundBoundaryState { // FIX: typed error parameter
    void error // FIX: mark unused
    return { hasError: true }
  }

  componentDidCatch(error: unknown): void { // FIX: typed error parameter
    console.error('Background crashed:', error)

  }
  render(): React.ReactNode { // FIX: typed render return
    if (this.state.hasError) return null
    return this.props.children
  }
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    // La session de connexion, lue par useSession() dans toute l'application.
    <SessionProvider>
    <LanguageProvider>
    <ThemeProvider>
      {/* Synchronise document.documentElement.lang avec la langue active */}
      <HtmlLangSync />
      <BackgroundErrorBoundary>
        <Suspense fallback={null}>
          <BackgroundWrapper />
        </Suspense>
      </BackgroundErrorBoundary>
      <main className="relative z-10">{children}</main>
      <CreditQG />
    </ThemeProvider>
    </LanguageProvider>
    </SessionProvider>
  )
}

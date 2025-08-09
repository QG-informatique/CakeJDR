'use client'
// MOD: 1 2025-08-09 - add global language switcher

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { BackgroundProvider } from '@/components/context/BackgroundContext'
import { LanguageProvider } from '@/components/context/LanguageContext'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher' // MOD: 1 2025-08-09 - global language flag

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
    <LanguageProvider>
      <BackgroundProvider>
        <BackgroundErrorBoundary>
          <Suspense fallback={null}>
            <BackgroundWrapper />
          </Suspense>
        </BackgroundErrorBoundary>
        <LanguageSwitcher />
        <main className="relative z-10">{children}</main>
      </BackgroundProvider>
    </LanguageProvider>
  )
}

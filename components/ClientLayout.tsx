'use client'

import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { BackgroundProvider } from '@/components/context/BackgroundContext'
import { LanguageProvider } from '@/components/context/LanguageContext'

// Charge le fond uniquement côté client pour éviter les plantages SSR/hydration
const BackgroundWrapper = dynamic(() => import('@/components/ui/BackgroundWrapper'), {
  ssr: false,
})

// Petit garde-fou : si le background crashe, on n’abat pas tout le layout
interface BackgroundBoundaryProps { // FIX: declare explicit props interface
  children: React.ReactNode // FIX: type children explicitly
}
interface BackgroundBoundaryState { hasError: boolean } // FIX: declare explicit state interface
class BackgroundErrorBoundary extends React.Component< // FIX: type component with interfaces
  BackgroundBoundaryProps, // FIX: props type
  BackgroundBoundaryState, // FIX: state type
  never // FIX: explicit snapshot type to avoid implicit any
> {
  constructor(props: BackgroundBoundaryProps) { // FIX: typed constructor props
    super(props)
    this.state = { hasError: false }
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
        <main className="relative z-10">{children}</main>
      </BackgroundProvider>
    </LanguageProvider>
  )
}

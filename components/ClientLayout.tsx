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
class BackgroundErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean },
  never
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: Error) {
    void error
    return { hasError: true }
  }
  componentDidCatch(err: Error) {
    console.error('Background crashed:', err)
  }
  render() {
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

'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'en' | 'fr'

interface LangCtx {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LangCtx | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Language | null
    if (stored === 'en' || stored === 'fr') setLangState(stored)
  }, [])

  const setLang = (l: Language) => {
    setLangState(l)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('lang', l)
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}

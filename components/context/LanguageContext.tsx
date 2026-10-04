'use client'
import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react'

export type Language = 'en' | 'fr'

interface LangCtx {
  lang: Language
  setLang: (l: Language) => void
}

const LanguageContext = createContext<LangCtx | undefined>(undefined)

// Francais par defaut : le public est francophone. Un choix explicite,
// memorise dans le navigateur, reste prioritaire.
const LANG_EVENT = 'cakejdr-lang-change'
// Choix de la session en cours, au cas ou le navigateur refuse le stockage.
let chosenLang: Language | null = null

function readStoredLang(): Language {
  if (chosenLang) return chosenLang
  try {
    const stored = localStorage.getItem('lang')
    return stored === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

function subscribeLang(onChange: () => void) {
  window.addEventListener(LANG_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(LANG_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readStoredLang, (): Language => 'fr')

  const setLang = (l: Language) => {
    chosenLang = l
    try {
      localStorage.setItem('lang', l)
    } catch {}
    window.dispatchEvent(new Event(LANG_EVENT))
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

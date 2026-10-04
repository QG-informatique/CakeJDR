'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, THEMES, getTheme, type Theme } from '@/lib/themes'

type ThemeContextValue = {
  theme: Theme
  themes: Theme[]
  setTheme: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// Le thème est un choix de chaque joueur, gardé dans son navigateur.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique au montage
      if (saved) setThemeId(getTheme(saved).id)
    } catch {}
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = themeId
  }, [themeId])

  const setTheme = useCallback((id: string) => {
    const next = getTheme(id).id
    setThemeId(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {}
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: getTheme(themeId), themes: THEMES, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être utilisé dans <ThemeProvider>')
  return ctx
}

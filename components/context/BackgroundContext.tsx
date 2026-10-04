'use client'
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { useTheme } from './ThemeContext'

/* ------------------------------------------------------------------
 * 1️⃣  Types des backgrounds
 * ------------------------------------------------------------------ */
export type BackgroundType =
  | 'plain' // fond uni du thème (--c-backdrop dans app/themes.css)
  | 'rpg'
  | 'cake'
  | 'banana'
  | 'unicorn'
  | 'special'
  | 'bg6' // Floating Runes
  | 'bg7' // Paper Lanterns
  | 'bg8' // Pixel Hearts
  | 'bg9' // Stardust Trails
  | 'bg10' // Origami Cranes

/* ------------------------------------------------------------------
 * 2️⃣  Ordre de rotation (clic sur le gâteau du menu)
 * ------------------------------------------------------------------ */
const cycleOrder: BackgroundType[] = [
  'plain',
  'rpg',
  'cake',
  'banana',
  'unicorn',
  'special',
  'bg6',
  'bg7',
  'bg8',
  'bg9',
  'bg10',
]

/* ------------------------------------------------------------------
 * 3️⃣  Contexte + Provider
 * ------------------------------------------------------------------ */
type BackgroundContextValue = {
  background: BackgroundType
  setBackground: (bg: BackgroundType) => void
  cycleBackground: () => void
}

const BackgroundContext = createContext<BackgroundContextValue | undefined>(
  undefined,
)

// Le fond choisi est gardé par thème : passer en Ardoise remet son fond uni,
// revenir en Classique retrouve le fond animé qu'on y avait.
const storageKey = (themeId: string) => `background:${themeId}`
const LEGACY_KEY = 'background' // avant les thèmes, un seul fond pour tout

function readStored(themeId: string): BackgroundType | null {
  try {
    let stored = localStorage.getItem(storageKey(themeId))
    if (!stored && themeId === 'classique') stored = localStorage.getItem(LEGACY_KEY)
    return stored && cycleOrder.includes(stored as BackgroundType)
      ? (stored as BackgroundType)
      : null
  } catch {
    return null
  }
}

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [choice, setChoice] = useState<{ themeId: string; bg: BackgroundType | null }>({
    themeId: theme.id,
    bg: null,
  })

  // 🔁 Restaure le fond choisi pour ce thème
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du stockage à chaque changement de thème
    setChoice({ themeId: theme.id, bg: readStored(theme.id) })
  }, [theme.id])

  const background: BackgroundType =
    (choice.themeId === theme.id && choice.bg) || theme.defaultBackground

  const setBackground = useCallback(
    (bg: BackgroundType) => {
      setChoice({ themeId: theme.id, bg })
      try {
        localStorage.setItem(storageKey(theme.id), bg)
      } catch {
        // ignore write errors
      }
    },
    [theme.id],
  )

  // ⏩ Passe au fond suivant dans cycleOrder
  const cycleBackground = () => {
    const idx = cycleOrder.indexOf(background)
    setBackground(cycleOrder[(idx + 1) % cycleOrder.length] ?? background)
  }

  return (
    <BackgroundContext.Provider
      value={{ background, setBackground, cycleBackground }}
    >
      {children}
    </BackgroundContext.Provider>
  )
}

/* ------------------------------------------------------------------
 * 4️⃣  Hook pratique
 * ------------------------------------------------------------------ */
export function useBackground() {
  const ctx = useContext(BackgroundContext)
  if (!ctx)
    throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}

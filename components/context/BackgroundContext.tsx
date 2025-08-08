'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react'

/* ------------------------------------------------------------------
 * 1️⃣  Types des backgrounds
 * ------------------------------------------------------------------ */
// 🆕 Ajout des clés 'bg6' → 'bg10'
export type BackgroundType =
  | 'rpg'
  | 'cake'
  | 'banana'
  | 'unicorn'
  | 'special'
  | 'bg6'      // Floating Runes
  | 'bg7'      // Paper Lanterns
  | 'bg8'      // Pixel Hearts
  | 'bg9'      // Stardust Trails
  | 'bg10'     // Origami Cranes

/* ------------------------------------------------------------------
 * 2️⃣  Ordre de rotation (bouton “next”)
 * ------------------------------------------------------------------ */
// 🆕 Ajout des mêmes clés dans le tableau d’ordre
const cycleOrder: BackgroundType[] = [
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
  setBackground: Dispatch<SetStateAction<BackgroundType>>
  cycleBackground: () => void
}

const BackgroundContext = createContext<BackgroundContextValue | undefined>(
  undefined,
)

export function BackgroundProvider({ children }: { children: ReactNode }) {
  // état initial : 'rpg'
  const [background, setBackground] = useState<BackgroundType>('rpg')

  // 🔁 Restaure le background sauvegardé au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('background') as BackgroundType | null
      if (stored && cycleOrder.includes(stored)) setBackground(stored)
    } catch {
      // ignore read errors
    }
  }, [])

  // 💾 Sauvegarde le background à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem('background', background)
    } catch {
      // ignore write errors
    }
  }, [background])

  // ⏩ Passe au background suivant dans cycleOrder
  const cycleBackground = () => {
    setBackground((prev) => {
      const idx = cycleOrder.indexOf(prev)
      return cycleOrder[(idx + 1) % cycleOrder.length]
    })
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

/* ==================================================================
 * ✅  MODIFICATIONS (résumé)
 * ------------------------------------------------------------------
 * • Ajout des clés 'bg6' … 'bg10' dans :
 *     1. type BackgroundType (lignes 13-22)
 *     2. tableau cycleOrder (lignes 29-38)
 *   => le bouton de cycle atteindra désormais Background6, 7, 8, 9, 10.
 * ================================================================== */

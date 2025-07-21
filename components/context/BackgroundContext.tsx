'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

export type BackgroundType = 'rpg' | 'cake' | 'banana'

const cycleOrder: BackgroundType[] = ['rpg', 'cake', 'banana']

type BackgroundContextValue = {
  background: BackgroundType
  cycleBackground: () => void

  setBackground: (bg: BackgroundType) => void


  setBackground: (bg: BackgroundType) => void



}

const BackgroundContext = createContext<BackgroundContextValue | undefined>(undefined)

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackground] = useState<BackgroundType>('rpg')

  const cycleBackground = () => {
    setBackground(prev => {
      const idx = cycleOrder.indexOf(prev)
      return cycleOrder[(idx + 1) % cycleOrder.length]
    })
  }

  return (

    <BackgroundContext.Provider value={{ background, cycleBackground, setBackground }}>


    <BackgroundContext.Provider value={{ background, cycleBackground, setBackground }}>

    <BackgroundContext.Provider value={{ background, cycleBackground }}>


      {children}
    </BackgroundContext.Provider>
  )
}

export function useBackground() {
  const ctx = useContext(BackgroundContext)
  if (!ctx) throw new Error('useBackground must be used within BackgroundProvider')
  return ctx
}

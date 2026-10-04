'use client'

import { Palette } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

// Passe au thème suivant. Le choix est propre à chaque joueur : il est gardé
// dans son navigateur et ne change rien pour les autres joueurs de la table.
export default function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme()
  const { lang } = useLanguage()
  const next = themes[(themes.findIndex((t) => t.id === theme.id) + 1) % themes.length] ?? theme
  const isEn = lang === 'en'

  return (
    <button
      type="button"
      onClick={() => setTheme(next.id)}
      title={isEn ? `Theme: ${theme.name}. Switch to ${next.name}` : `Thème : ${theme.name}. Passer en ${next.name}`}
      aria-label={isEn ? `Theme: ${theme.name}. Switch to ${next.name}` : `Thème : ${theme.name}. Passer en ${next.name}`}
      className="inline-flex h-8 select-none items-center gap-1.5 rounded-lg border border-ink/15 bg-shade/40 px-2 text-xs font-semibold tracking-wide text-ink/85 backdrop-blur transition hover:bg-ink/10"
    >
      <Palette size={14} className="text-accent" aria-hidden="true" />
      {theme.name}
    </button>
  )
}

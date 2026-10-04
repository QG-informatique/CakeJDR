'use client'

import { Palette } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

// Passe au thème suivant. Le choix est propre à chaque joueur : il est gardé
// dans son navigateur et ne change rien pour les autres joueurs de la table.
// `compact` : l'icône seule, pour les barres d'outils de la table.
export default function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, themes, setTheme } = useTheme()
  const { lang } = useLanguage()
  const next = themes[(themes.findIndex((t) => t.id === theme.id) + 1) % themes.length] ?? theme
  const isEn = lang === 'en'
  const label = isEn ? `Theme: ${theme.name}. Switch to ${next.name}` : `Thème : ${theme.name}. Passer en ${next.name}`

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(next.id)}
        title={label}
        aria-label={label}
        className="ui-btn ui-btn-ghost ui-btn-icon"
      >
        <Palette size={16} className="text-accent" aria-hidden="true" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(next.id)}
      title={label}
      aria-label={label}
      className="ui-btn select-none !gap-1.5 !px-2 !text-xs tracking-wide"
    >
      <Palette size={14} className="text-accent" aria-hidden="true" />
      {theme.name}
    </button>
  )
}

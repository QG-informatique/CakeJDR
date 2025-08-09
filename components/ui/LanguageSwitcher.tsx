'use client'
// MOD: 1 2025-08-09 - global flag with high z-index and white text
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const toggle = () => setLang(lang === 'en' ? 'fr' : 'en')
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      className="fixed top-3 right-3 z-50 select-none bg-black/60 text-white rounded-full p-1 shadow text-xl sm:text-2xl md:text-3xl pointer-events-auto"
    >
      {lang === 'en' ? '🇬🇧' : '🇫🇷'}
    </button>
  )
}

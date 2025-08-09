'use client'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const toggle = () => setLang(lang === 'en' ? 'fr' : 'en')
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      className="fixed top-4 right-4 z-[1000] select-none bg-black/50 text-white rounded-full p-2 shadow text-lg sm:text-xl md:text-2xl"
    >
      {lang === 'en' ? '🇬🇧' : '🇫🇷'}
    </button>
  )
}

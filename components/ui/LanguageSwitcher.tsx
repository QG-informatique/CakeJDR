'use client'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const toggle = () => setLang(lang === 'en' ? 'fr' : 'en')
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      className="fixed top-2 right-2 z-[1000] select-none bg-white text-black rounded-full p-1 shadow text-xl sm:text-2xl md:text-3xl"
    >
      {lang === 'en' ? '🇬🇧' : '🇫🇷'}
    </button>
  )
}

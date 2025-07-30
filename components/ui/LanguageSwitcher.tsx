'use client'
import { useLanguage } from '../context/LanguageContext'

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const toggle = () => setLang(lang === 'en' ? 'fr' : 'en')
  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to French' : 'Passer en anglais'}
      className="absolute top-2 right-2 text-2xl select-none"
      style={{ zIndex: 50 }}
    >
      {lang === 'en' ? '🇬🇧' : '🇫🇷'}
    </button>
  )
}

'use client'
import { translations, TranslationKey } from './translations'
import { useLanguage } from '@/components/context/LanguageContext'

export function useT() {
  const { lang } = useLanguage()
  return (key: TranslationKey): string => translations[lang][key] ?? key
}

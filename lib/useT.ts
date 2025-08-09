'use client'
import { translations, TranslationKey } from './translations'
import { useLanguage } from '@/components/context/LanguageContext'

const enMap = new Map<TranslationKey, string>(
  Object.entries(translations.en) as [TranslationKey, string][],
)
const frMap = new Map<TranslationKey, string>(
  Object.entries(translations.fr) as [TranslationKey, string][],
)

export function useT() {
  const { lang } = useLanguage()
  const map = lang === 'fr' ? frMap : enMap
  return (key: TranslationKey): string => map.get(key) ?? key
}

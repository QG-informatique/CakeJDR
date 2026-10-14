'use client'
import { useCallback } from 'react'
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
  // Même fonction tant que la langue ne change pas : les effets qui en
  // dépendent ne repartent pas à chaque rendu (minuteurs du MJ automatique).
  return useCallback((key: TranslationKey): string => map.get(key) ?? key, [map])
}

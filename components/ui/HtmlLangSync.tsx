'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/components/context/LanguageContext'

/**
 * Synchronise l'attribut `lang` de la balise <html> avec la langue active.
 * Monté dans ClientLayout, il s'exécute côté client uniquement.
 */
export default function HtmlLangSync() {
  const { lang } = useLanguage()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return null
}

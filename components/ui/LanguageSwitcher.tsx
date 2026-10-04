'use client'

import { useLanguage } from '../context/LanguageContext'

/**
 * Bascule de langue : affiche la langue active, un clic passe à l'autre.
 *
 * Les drapeaux sont dessinés en SVG plutôt qu'en emoji : Windows ne sait pas
 * afficher les emoji de drapeaux et montrait « GB » ou « FR » à la place. Le
 * code de langue est écrit à côté, pour rester lisible sans le drapeau.
 *
 * Pas de position fixe ici : c'est la barre d'outils qui le place, à côté
 * des contrôles de compte, pour que les deux ne se chevauchent pas.
 */
function FlagFR() {
  return (
    <svg viewBox="0 0 3 2" width="18" height="12" aria-hidden="true" className="rounded-[2px]">
      <rect width="1" height="2" x="0" fill="#0055A4" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  )
}

function FlagGB() {
  return (
    <svg
      viewBox="0 0 60 30"
      width="18"
      height="12"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="rounded-[2px]"
    >
      <clipPath id="lang-gb-frame">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="lang-gb-diag">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#lang-gb-frame)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#lang-gb-diag)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  )
}

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const isEn = lang === 'en'

  return (
    <button
      type="button"
      onClick={() => setLang(isEn ? 'fr' : 'en')}
      title={isEn ? 'Switch to French' : 'Passer en anglais'}
      aria-label={isEn ? 'Language: English. Switch to French' : 'Langue : français. Passer en anglais'}
      className="inline-flex h-8 select-none items-center gap-1.5 rounded-lg border border-ink/15 bg-shade/40 px-2 text-xs font-semibold tracking-wide text-ink/85 backdrop-blur transition hover:bg-ink/10"
    >
      {isEn ? <FlagGB /> : <FlagFR />}
      {isEn ? 'EN' : 'FR'}
    </button>
  )
}

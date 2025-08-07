'use client'
import React from 'react'

/* ---------- BACKGROUNDS EXISTANTS ---------- */
import RpgBackground from './RpgBackground'
import CakeBackground from './CakeBackground'
import BananaBackground from './BananaBackground'
import UnicornBackground from './UnicornBackground'
import SpecialBackground from './SpecialBackground' // (ex-D20)

/* ---------- 🆕 BACKGROUNDS 6 → 10 ---------- */
import Background6 from './Background6'   // ✅ Floating Runes
import Background7 from './Background7'   // ✅ Paper Lanterns
import Background8 from './Background8'   // ✅ Pixel Hearts
import Background9 from './Background9'   // ✅ Stardust Trails
import Background10 from './Background10' // ✅ Origami Cranes

import { useBackground } from '../context/BackgroundContext'

export default function BackgroundWrapper () {
  const { background } = useBackground()

  /* ---------- ROUTING DES BACKGROUNDS EXISTANTS ---------- */
  if (background === 'cake')     return <CakeBackground />
  if (background === 'banana')   return <BananaBackground />
  if (background === 'unicorn')  return <UnicornBackground />
  if (background === 'special')  return <SpecialBackground />

  /* ---------- ROUTING DES 🆕 BACKGROUNDS 6 → 10 ---------- */
  if (background === 'bg6')  return <Background6 />   // Floating Runes
  if (background === 'bg7')  return <Background7 />   // Paper Lanterns
  if (background === 'bg8')  return <Background8 />   // Pixel Hearts
  if (background === 'bg9')  return <Background9 />   // Stardust Trails
  if (background === 'bg10') return <Background10 />  // Origami Cranes

  /* ---------- BACKGROUND PAR DÉFAUT ---------- */
  return <RpgBackground />
}

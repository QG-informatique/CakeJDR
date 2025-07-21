'use client'
import React from 'react'
import RpgBackground from './RpgBackground'
import CakeBackground from './CakeBackground'

export default function BackgroundWrapper({ isCakeBackground = false }: { isCakeBackground?: boolean }) {
  return isCakeBackground ? <CakeBackground /> : <RpgBackground />;
}

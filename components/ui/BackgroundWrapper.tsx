'use client'
import React from 'react'
import RpgBackground from './RpgBackground'
import CakeBackground from './CakeBackground'
import BananaBackground from './BananaBackground'
import { useBackground } from '../context/BackgroundContext'

export default function BackgroundWrapper() {
  const { background } = useBackground()
  if (background === 'cake') return <CakeBackground />
  if (background === 'banana') return <BananaBackground />
  return <RpgBackground />
}

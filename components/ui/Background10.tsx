'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/* ╔══════════════════════════════════════════════════════════════╗
   ║  Background 10 – Lucky Clovers  (v14)                        ║
   ║  • 30 trèfles (3 feuilles)                                   ║
   ║  • 1 trèfle lucky : 4 feuilles, contours or, aucun flou      ║
   ╚══════════════════════════════════════════════════════════════╝ */

/* ---------- Clover 3 feuilles (SVG AAA3F) --------------------- */
function Clover3({ size = 72, color = '#4ade80' }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 28.627 28.627" width={size} height={size}>
      {/* paths intégraux – inchangés */}
      <path fill={color} d="M13.673,12.018c0.355,0.35,0.925,0.35,1.28,0c1.146-1.132,3.485-3.482,4.068-4.384c0.839-1.3,1.676-2.373,1.676-4.245S19.181,0,17.31,0C16,0,14.877,0.75,14.312,1.837C13.749,0.75,12.625,0,11.316,0C9.444,0,7.928,1.517,7.928,3.389s0.838,2.945,1.677,4.245C10.188,8.535,12.526,10.886,13.673,12.018z"/>
      <path fill={color} d="M13.056,12.969c-1.423-0.756-4.364-2.288-5.399-2.575c-1.491-0.413-2.765-0.891-4.552-0.332c-1.786,0.559-2.781,2.459-2.223,4.246c0.391,1.25,1.443,2.097,2.649,2.311c-0.869,0.863-1.25,2.158-0.86,3.408c0.559,1.787,2.459,2.78,4.247,2.223c1.786-0.559,2.56-1.678,3.55-2.868c0.687-0.825,2.232-3.759,2.97-5.192C13.667,13.747,13.498,13.203,13.056,12.969z"/>
      <path fill={color} d="M25.522,10.062c-1.787-0.559-3.061-0.081-4.552,0.332c-1.035,0.287-3.978,1.818-5.399,2.575c-0.438,0.234-0.609,0.778-0.382,1.222c0.738,1.433,2.283,4.368,2.97,5.192c0.99,1.189,1.766,2.31,3.552,2.868c1.787,0.56,3.688-0.437,4.247-2.224c0.391-1.25,0.009-2.545-0.86-3.407c1.206-0.214,2.258-1.062,2.648-2.311C28.303,12.521,27.309,10.621,25.522,10.062z"/>
      <path fill={color} d="M17.59,28.312c0.375-0.588,0.754-1.176,1.131-1.77c0.188-0.296,0.167-0.689-0.071-0.948c-2.698-2.928-3.561-10.005-3.561-10.005c-0.031-0.367-0.321-0.673-0.701-0.71c-0.428-0.041-0.808,0.272-0.849,0.7c0,0-0.087,0.887-0.101,2.188c-0.008,0.578-0.237,7.185,3.082,10.647C16.826,28.734,17.352,28.686,17.59,28.312z"/>
    </svg>
  )
}

/* ---------- Clover 4 feuilles – aucun flou --------------------- */
function Clover4({ size = 96 }: { size?: number }) {
  const fill   = '#bbf7d0'
  const stroke = '#facc15'
  return (
    <motion.svg
      viewBox="0 0 29.894 29.895"
      width={size}
      height={size}
      overflow="visible"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* 4 paths SVG AAA4F – contours dorés, pas de halo */}
      <path fill={fill} stroke={stroke} strokeWidth="1.6" d="M14.308,13.048c0.355,0.35,0.924,0.35,1.28,0c1.22-1.203,3.813-3.803,4.451-4.792c0.908-1.406,1.812-2.566,1.812-4.591C21.851,1.64,20.211,0,18.186,0c-1.416,0-2.63,0.812-3.24,1.987C14.336,0.812,13.123,0,11.707,0C9.682,0,8.042,1.64,8.042,3.665s0.905,3.185,1.812,4.591C10.495,9.244,13.088,11.845,14.308,13.048z"/>
      <path fill={fill} stroke={stroke} strokeWidth="1.6" d="M15.587,16.848c-0.355-0.351-0.925-0.351-1.28,0c-1.22,1.202-3.813,3.804-4.452,4.791c-0.907,1.406-1.813,2.566-1.813,4.593c0,2.023,1.64,3.663,3.665,3.663c1.416,0,2.63-0.812,3.24-1.985c0.611,1.175,1.824,1.985,3.24,1.985c2.024,0,3.665-1.64,3.665-3.663c0-2.025-0.904-3.187-1.812-4.593C19.402,20.65,16.807,18.049,15.587,16.848z"/>
      <path fill={fill} stroke={stroke} strokeWidth="1.6" d="M27.908,14.947c1.174-0.61,1.985-1.824,1.985-3.24c0-2.025-1.64-3.665-3.664-3.666c-2.024,0-3.186,0.906-4.592,1.813c-0.987,0.639-3.59,3.232-4.792,4.452c-0.351,0.355-0.351,0.924,0,1.279c1.202,1.22,3.805,3.813,4.792,4.453c1.406,0.907,2.566,1.812,4.592,1.812c2.023,0,3.664-1.642,3.664-3.666C29.896,16.771,29.083,15.557,27.908,14.947z"/>
      <path fill={fill} stroke={stroke} strokeWidth="1.6" d="M13.048,15.587c0.35-0.354,0.35-0.925,0-1.28c-1.203-1.22-3.804-3.813-4.792-4.452C6.851,8.948,5.69,8.042,3.667,8.042c-2.025,0-3.665,1.641-3.665,3.666c0,1.416,0.813,2.63,1.987,3.24c-1.175,0.61-1.987,1.823-1.987,3.239c0,2.023,1.64,3.663,3.665,3.665c2.024,0,3.185-0.905,4.59-1.812C9.245,19.4,11.845,16.807,13.048,15.587z"/>
    </motion.svg>
  )
}

/* ---------- Background component ------------------------------- */
export default function Background10 () {
  const [clovers, setClovers] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    const TOTAL = 30
    const luckyIdx = Math.floor(Math.random() * TOTAL) // 1 lucky

    for (let i = 0; i < TOTAL; i++) {
      const lucky = i === luckyIdx
      const base  = 48 + Math.random() * 44
      const size  = lucky ? base + 22 : base
      const left  = Math.random() * 100
      const drift = (Math.random() * 2 - 1) * 18
      const rot   = Math.random() * 28 - 14
      const dur   = 30 + Math.random() * 22
      const delay = -Math.random() * dur

      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh' }}
          animate={{ y: '-120vh', x: [0, drift, -drift, 0], rotate: rot }}
          transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear', times: [0,.4,.8,1] }}
          style={{ position: 'absolute', left: `${left}vw`, pointerEvents: 'none' }}
        >
          {lucky ? <Clover4 size={size} /> : <Clover3 size={size} />}
        </motion.div>
      )
    }
    setClovers(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {clovers}
      <div className="absolute inset-0 bg-emerald-900/50" />
    </div>
  )
}

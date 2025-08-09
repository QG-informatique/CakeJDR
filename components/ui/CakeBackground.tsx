'use client'

/**
 * CakeBackground – TopoFlow (cyan sombre) v2
 * ==========================================
 * ✅ Même concept que le TopoFlow précédent (lignes topo qui ondulent),
 *    mais palette assombrie pour ne pas fatiguer les yeux en faible luminosité.
 * ✅ Toujours zéro étoiles, zéro rubans, zéro icônes.
 * ✅ Lignes topo visibles mais moins contrastées → meilleur confort visuel.
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

/* =========================
   CONFIG (couleurs & topo)
   ========================= */
const THEME = {
  // Dégradé bleu-cyan sombre
  background:
    'linear-gradient(180deg, #0A1B21 0%, #0C232A 50%, #0E2B33 100%)',
  // Halos très subtils
  tintA: 'rgba(0, 157, 255, 0.08)',  // cyan plus saturé
  tintB: 'rgba(0, 200, 167, 0.06)',  // menthe
  // Lignes topo légèrement éclaircies par rapport au fond
  line: 'rgba(180, 230, 255, 0.15)',
}

const TOPO = {
  rows: 14,
  width: 1200,
  height: 800,
  ampBase: 10,
  ampJitter: 6,
  freq: 2.2,
  duration: 24,
  strokeWidth: 1.6,
  opacityStart: 0.25,
}

/* =========================
   HELPERS
   ========================= */
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeTopoPath({
  W, H, baseY, amp, phase, freq,
}: { W: number; H: number; baseY: number; amp: number; phase: number; freq: number; }) {
  const N = 12
  const k = (Math.PI * 2 * freq) / (N - 1)
  const c = W / (N - 1) * 0.42
  const pts = Array.from({ length: N }, (_, i) => {
    const x = (W / (N - 1)) * i
    const y = baseY + Math.sin(phase + i * k) * amp
    return { x, y }
  })
  const d = [
    `M ${pts[0].x} ${pts[0].y}`,
    ...pts.slice(0, -1).map((p, i) => {
      const p2 = pts[i + 1]
      return `C ${p.x + c} ${p.y}, ${p2.x - c} ${p2.y}, ${p2.x} ${p2.y}`
    }),
  ].join(' ')
  return d
}

/* =========================
   LIGNE TOPO : 1 <path> morphé
   ========================= */
function TopoLine({
  index,
  total,
  seed,
}: { index: number; total: number; seed: number }) {
  const rnd = useMemo(() => mulberry32(seed + index * 97), [seed, index])
  const { W, H } = { W: TOPO.width, H: TOPO.height }
  const baseY = Math.round((H * (index + 1)) / (total + 1) + (rnd() - 0.5) * 18)
  const amp = TOPO.ampBase + (rnd() - 0.5) * TOPO.ampJitter * 2
  const freq = clamp(TOPO.freq + (rnd() - 0.5) * 0.5, 1.6, 3.0)

  const phases = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
  const paths = useMemo(
    () => phases.map(ph => makeTopoPath({ W, H, baseY, amp, phase: ph, freq })),
    [W, H, baseY, amp, freq]
  )

  const centerBias = 1 - Math.abs((index - (total - 1) / 2) / ((total - 1) / 2))
  const opacity = clamp(0.1 + centerBias * (TOPO.opacityStart - 0.1), 0.08, TOPO.opacityStart)
  const delay = -(rnd() * TOPO.duration)

  return (
    <motion.path
      d={paths[0]}
      animate={{ d: paths }}
      transition={{ duration: TOPO.duration, repeat: Infinity, ease: 'easeInOut', delay }}
      stroke={THEME.line}
      strokeWidth={TOPO.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      fill="none"
    />
  )
}

/* =========================
   Composant principal
   ========================= */
export default function CakeBackground() {
  const lines = useMemo(() => {
    const arr: React.ReactElement[] = []
    const seed = 20250809
    for (let i = 0; i < TOPO.rows; i++) {
      arr.push(<TopoLine key={`topo-${i}`} index={i} total={TOPO.rows} seed={seed} />)
    }
    return arr
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden isolate z-0" aria-hidden>
      {/* Fond sombre */}
      <div className="absolute inset-0" style={{ background: THEME.background }} />

      {/* Halos très discrets */}
      <div
        className="absolute -top-[30vh] -left-[20vw] w-[90vw] h-[90vh] blur-3xl opacity-70"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${THEME.tintA} 0%, transparent 70%)`, mixBlendMode: 'screen' as any }}
      />
      <div
        className="absolute -bottom-[35vh] -right-[25vw] w-[100vw] h-[100vh] blur-3xl opacity-70"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${THEME.tintB} 0%, transparent 70%)`, mixBlendMode: 'screen' as any }}
      />

      {/* Lignes topo */}
      <svg
        className="absolute inset-0"
        viewBox={`0 0 ${TOPO.width} ${TOPO.height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        {lines}
      </svg>
    </div>
  )
}

'use client'
// MOD: 1 2025-08-09 - typed CSS variable styles to remove any casts

/**
 * CakeBackground — Fibres tressées (v1)
 * =====================================
 * ✅ Fond original & simple : trame de fibres diagonales (effet lin/ramie).
 * ✅ 100% CSS (gradients), zéro asset, ultra-perf.
 * ✅ Reflet (sheen) qui balaie en douceur + vignettage discret.
 * ✅ Accessibilité : animation désactivée si prefers-reduced-motion.
 *
 * ---------------------------
 * LISTE DES MODIFICATIONS
 * ---------------------------
 * [1] Double trame en diagonale via repeating-linear-gradient à +45° / -45°.
 * [2] Micro-ombrage et micro-brillance par bandes étroites (simulateur de fibre).
 * [3] Couche de “sheen” (reflet) animée en diagonale, faible intensité.
 * [4] Vignettage doux pour la profondeur, variables CSS centralisées pour le thème.
 */

import React from 'react'

export default function CakeBackground() {
  const styleVars: React.CSSProperties = {
    // ====== VARIABLES TWEAK ======
    // Couleurs principales (tissu)
    '--bg': '#13161c', // fond global sous la trame
    '--fiber-dark': 'rgba(220,225,230,0.14)',
    '--fiber-light': 'rgba(255,255,255,0.06)',
    // Pas de fibre (contrôle densité)
    '--fiber-w': '2px', // largeur d'une fibre
    '--fiber-gap': '6px', // écart entre fibres
    // Reflet (sheen)
    '--sheen': 'rgba(255,255,230,0.10)',
    '--sheen-size': '60vmin',
    '--sheen-blur': '22px',
    // Vitesse de balayage
    '--speed': '18s',
  } // MOD: 1

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 isolate z-0"
      style={styleVars} // MOD: 1
    >
      {/* Couche 0 — Fond de base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0f141a 0%, var(--bg) 100%)',
        }}
      />

      {/* Couche 1 — Trame diagonale +45° (warp) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              45deg,
              var(--fiber-dark) 0 var(--fiber-w),
              transparent var(--fiber-w) calc(var(--fiber-w) + var(--fiber-gap))
            ),
            repeating-linear-gradient(
              45deg,
              transparent 0 calc(var(--fiber-w) + var(--fiber-gap)),
              var(--fiber-light) calc(var(--fiber-w) + var(--fiber-gap)) calc(var(--fiber-w) + var(--fiber-gap) + 1px)
            )
          `,
          mixBlendMode: 'screen',
          opacity: 0.9,
        }}
      />

      {/* Couche 2 — Trame diagonale -45° (weft) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(
              -45deg,
              var(--fiber-dark) 0 var(--fiber-w),
              transparent var(--fiber-w) calc(var(--fiber-w) + var(--fiber-gap))
            ),
            repeating-linear-gradient(
              -45deg,
              transparent 0 calc(var(--fiber-w) + var(--fiber-gap)),
              var(--fiber-light) calc(var(--fiber-w) + var(--fiber-gap)) calc(var(--fiber-w) + var(--fiber-gap) + 1px)
            )
          `,
          mixBlendMode: 'screen',
          opacity: 0.85,
        }}
      />

      {/* Couche 3 — Reflet (sheen) qui balaye en diagonale */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(
            var(--sheen-size) var(--sheen-size) at -10% 110%,
            var(--sheen) 0%,
            rgba(255,255,255,0) 65%
          )`,
          filter: `blur(var(--sheen-blur))`,
          mixBlendMode: 'screen',
          animation: 'weaveSweep var(--speed) linear infinite',
        }}
      />

      {/* Couche 4 — Vignettage doux */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.22) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Styles embarqués : animation + reduced motion */}
      <style jsx>{`
        @keyframes weaveSweep {
          0%   { background-position: -20% 120%; }
          50%  { background-position: 120% -20%; }
          100% { background-position: -20% 120%; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(div[aria-hidden] .absolute.inset-0:nth-child(3)) { animation: none !important; }
        }
      `}</style>
    </div>
  )
}

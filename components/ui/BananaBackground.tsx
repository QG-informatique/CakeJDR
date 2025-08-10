'use client'

/**
 * PastelBlobsBackground — Dégradé pastel + formes fluides
 * =======================================================
 * ✅ Changement total de style par rapport aux fonds sombres ou étoilés.
 * ✅ Ambiance claire, colorée, chaleureuse.
 * ✅ Animations très douces et très légères → pas de lag.
 * ✅ 100% CSS + HTML, zéro image.
 * ✅ Accessibilité : animations coupées si prefers-reduced-motion.
 *
 * ---------------------------
 * LISTE DES MODIFICATIONS
 * ---------------------------
 * [1] Fond principal en dégradé pastel diagonal (plusieurs couleurs).
 * [2] Formes “blob” semi-transparentes animées en translation lente.
 * [3] MixBlendMode pour un mélange harmonieux des couleurs.
 * [4] Désactivation de l’anim si prefers-reduced-motion.
 */

import React from 'react'

export default function PastelBlobsBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-0"
    >
      {/* Couche 0 — Dégradé pastel fixe */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #FFDDE1 0%, #E0C3FC 40%, #C2E9FB 100%)',
        }}
      />

      {/* Couche 1 — Blobs flottants */}
      <div
        className="absolute w-[60vmax] h-[60vmax] rounded-full opacity-40 mix-blend-multiply blob-anim"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FF9A9E 0%, transparent 70%)',
          top: '-20vmax',
          left: '-20vmax',
        }}
      />
      <div
        className="absolute w-[50vmax] h-[50vmax] rounded-full opacity-40 mix-blend-multiply blob-anim-delay"
        style={{
          background: 'radial-gradient(circle at 70% 70%, #FBC2EB 0%, transparent 70%)',
          bottom: '-15vmax',
          right: '-15vmax',
        }}
      />
      <div
        className="absolute w-[55vmax] h-[55vmax] rounded-full opacity-40 mix-blend-multiply blob-anim-slow"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #A1C4FD 0%, transparent 70%)',
          top: '20%',
          left: '30%',
        }}
      />

      {/* Styles embarqués */}
      <style jsx>{`
        @keyframes blobMove {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(10%, -10%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .blob-anim {
          animation: blobMove 60s ease-in-out infinite;
        }
        .blob-anim-delay {
          animation: blobMove 75s ease-in-out infinite;
          animation-delay: -15s;
        }
        .blob-anim-slow {
          animation: blobMove 90s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob-anim,
          .blob-anim-delay,
          .blob-anim-slow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

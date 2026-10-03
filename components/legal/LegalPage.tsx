import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Mise en page commune des pages légales (confidentialité, conditions).
 *
 * Textes en français seulement : ce sont eux qui font foi. Ils sont liés
 * depuis le pied de page et déclarés à Google et Discord pour la connexion.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh w-full justify-center px-4 py-10">
      <article className="legal w-full max-w-2xl rounded-2xl border border-white/10 bg-black/60 px-6 py-8 text-sm leading-relaxed text-white/85 backdrop-blur-md sm:px-10">
        <Link href="/menu-accueil" className="text-white/60 no-underline hover:text-white">
          ← CakeJDR
        </Link>
        <h1 className="mt-4 mb-1 text-2xl font-bold text-white">{title}</h1>
        <p className="mt-0 mb-6 text-white/50">Dernière mise à jour : {updated}</p>
        {children}
      </article>
      <style>{`
        .legal h2 { margin: 1.75rem 0 .5rem; font-size: 1.05rem; font-weight: 700; color: #fff; }
        .legal p, .legal ul { margin: 0 0 .75rem; }
        .legal ul { padding-left: 1.25rem; list-style: disc; }
        .legal li { margin-bottom: .25rem; }
        .legal a { color: #f9a8d4; }
      `}</style>
    </div>
  )
}

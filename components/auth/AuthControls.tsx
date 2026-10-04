'use client'

/**
 * Pastille du compte connecté, dans la barre d'outils du menu.
 *
 * Pas de position fixe ici : la barre d'outils du menu la place, à côté du
 * bouton de langue, pour que les deux ne se chevauchent pas. La déconnexion
 * est dans le menu lui-même.
 */
export default function AuthControls({ pseudo, color }: { pseudo: string; color: string }) {
  return (
    <span
      title={pseudo}
      aria-label={pseudo}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-sm font-bold text-ink shadow"
      style={{ background: color }}
    >
      {pseudo.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

import SignInPanel from '@/components/auth/SignInPanel'

/**
 * Page de connexion.
 *
 * Auth.js y renvoie aussi en cas d'échec (`?error=...`). La page de retour
 * n'est acceptée que si c'est un chemin interne : sinon, un lien piégé
 * pourrait renvoyer vers un autre site après la connexion.
 */
function safePath(value: unknown): string {
  if (typeof value !== 'string') return '/salles'
  try {
    // Auth.js transmet une adresse complète : on n'en garde que le chemin.
    const url = new URL(value, 'http://interne')
    if (url.origin !== 'http://interne' && !value.startsWith('http')) return '/salles'
    const path = url.pathname + url.search
    return path.startsWith('/') && !path.startsWith('//') ? path : '/salles'
  } catch {
    return '/salles'
  }
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const { error, callbackUrl } = await searchParams
  return <SignInPanel error={error} redirectTo={safePath(callbackUrl)} />
}

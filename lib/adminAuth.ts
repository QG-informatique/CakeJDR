import 'server-only'

/**
 * Droits d'administration, portés par le compte (`users.is_admin`).
 *
 * L'ancien mot de passe admin unique a disparu une fois les comptes en
 * place : un secret partagé de moins à protéger, et un formulaire de moins
 * à attaquer. Seule source de vérité : ne jamais se fier à un état client.
 */
export async function isAdminRequest(): Promise<boolean> {
  try {
    const { syncCurrentUser } = await import('@/lib/db/users')
    const account = await syncCurrentUser()
    return account?.isAdmin === true
  } catch {
    return false
  }
}

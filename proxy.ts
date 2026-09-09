import { clerkMiddleware } from '@clerk/nextjs/server'

/**
 * Intergiciel Clerk.
 *
 * Sur Next.js 16 ce fichier s'appelle `proxy.ts` (`middleware.ts` sur les
 * versions antérieures).
 *
 * `clerkMiddleware()` sans argument ne protège aucune route : il rend
 * simplement la session disponible côté serveur. Les protections seront
 * ajoutées route par route, au fur et à mesure de la phase 1.
 */
export default clerkMiddleware()

export const config = {
  matcher: [
    // Toutes les pages, en sautant les fichiers statiques et les internes Next.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Les routes d'API.
    '/(api|trpc)(.*)',
    // Le chemin interne de Clerk, requis par leur proxy automatique.
    '/__clerk/:path*',
  ],
}

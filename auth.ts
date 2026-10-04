import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

/**
 * Connexion locale, pour essayer le site sur son PC sans passer par Discord
 * ou Google : un clic connecte au compte administrateur. Elle n'existe
 * qu'avec `npm run dev` (jamais dans un site construit pour être mis en
 * ligne) et seulement depuis l'adresse localhost.
 */
const DEV_LOGIN = process.env.NODE_ENV === 'development'

const devLogin = Credentials({
  id: 'dev',
  name: 'Connexion locale',
  credentials: {},
  async authorize(_credentials, request) {
    const host = new URL(request.url).hostname
    if (!DEV_LOGIN || !['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) return null
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')
    const { asc, eq } = await import('drizzle-orm')
    const [admin] = await db.select().from(users).where(eq(users.isAdmin, true)).orderBy(asc(users.createdAt)).limit(1)
    return admin ? { id: admin.id, name: admin.pseudo } : null
  },
})

/**
 * Connexion par Auth.js, avec Google et Discord.
 *
 * Auth.js remplace Clerk, qui exigeait en production un nom de domaine à soi :
 * celui-ci fonctionne sur l'adresse `.vercel.app`. Pas de connexion par email :
 * envoyer les liens de connexion demanderait, lui aussi, un domaine vérifié.
 *
 * Les identifiants des deux services sont lus dans `AUTH_GOOGLE_ID`,
 * `AUTH_GOOGLE_SECRET`, `AUTH_DISCORD_ID` et `AUTH_DISCORD_SECRET` ; les
 * sessions sont signées avec `AUTH_SECRET`.
 *
 * Sessions en jeton signé (JWT) plutôt qu'en base : aucune table de plus à
 * maintenir, et le compte applicatif vit déjà dans `users`.
 */
export const { handlers, auth } = NextAuth({
  // Un service sans identifiants n'est pas proposé : sans ce filtre, le clic
  // partait chez Discord ou Google avec un identifiant vide et s'y perdait.
  // Là, il revient sur /connexion avec un message clair.
  providers: [
    ...(process.env.AUTH_GOOGLE_ID ? [Google] : []),
    ...(process.env.AUTH_DISCORD_ID ? [Discord] : []),
    ...(DEV_LOGIN ? [devLogin] : []),
  ],
  // 30 jours, prolongés à chaque visite (au plus une fois par jour) : un
  // joueur qui revient chaque semaine ne revoit jamais l'écran de connexion.
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: '/connexion', error: '/connexion' },
  // Vercel garantit l'en-tête Host ; en local, il faut l'accepter aussi.
  trustHost: true,
  callbacks: {
    jwt({ token, account, user }) {
      // Identifiant stable : fournisseur + identifiant chez lui, par exemple
      // `discord:1234`. L'email ne sert pas de clé : il peut changer, et
      // Discord ne le fournit pas toujours.
      // La connexion locale reprend tel quel l'identifiant du compte admin.
      if (account?.provider === 'dev' && user?.id) token.uid = user.id
      else if (account) token.uid = `${account.provider}:${account.providerAccountId}`
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === 'string' && session.user) session.user.id = token.uid
      return session
    },
  },
})

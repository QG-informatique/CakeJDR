import NextAuth from 'next-auth'
import Discord from 'next-auth/providers/discord'
import Google from 'next-auth/providers/google'

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
  ],
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: '/connexion', error: '/connexion' },
  // Vercel garantit l'en-tête Host ; en local, il faut l'accepter aussi.
  trustHost: true,
  callbacks: {
    jwt({ token, account }) {
      // Identifiant stable : fournisseur + identifiant chez lui, par exemple
      // `discord:1234`. L'email ne sert pas de clé : il peut changer, et
      // Discord ne le fournit pas toujours.
      if (account) token.uid = `${account.provider}:${account.providerAccountId}`
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === 'string' && session.user) session.user.id = token.uid
      return session
    },
  },
})

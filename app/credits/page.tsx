import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'
import { MUSIC_AUTHOR, MUSIC_LICENSE, MUSIC_LICENSE_URL, TRACKS } from '@/lib/autoGm/music'

export const metadata: Metadata = { title: 'Crédits – CakeJDR' }

/**
 * Logiciels libres sur lesquels repose CakeJDR, avec la licence déclarée
 * dans leur `package.json` (vérifiée dans `node_modules`).
 */
const SOFTWARE: { name: string; url: string; license: string; what: string }[] = [
  { name: 'Next.js', url: 'https://nextjs.org', license: 'MIT', what: 'le site et son serveur' },
  { name: 'React', url: 'https://react.dev', license: 'MIT', what: "l'interface" },
  { name: 'Liveblocks', url: 'https://liveblocks.io', license: 'Apache 2.0', what: 'la table partagée en temps réel' },
  { name: 'Yjs', url: 'https://docs.yjs.dev', license: 'MIT', what: "l'édition à plusieurs des notes" },
  { name: 'Lexical', url: 'https://lexical.dev', license: 'MIT', what: "l'éditeur de texte" },
  { name: 'dice-box-threejs', url: 'https://github.com/3d-dice/dice-box-threejs', license: 'MIT', what: 'les dés 3D' },
  { name: 'three.js', url: 'https://threejs.org', license: 'MIT', what: 'le rendu 3D des dés' },
  { name: 'cannon-es', url: 'https://github.com/pmndrs/cannon-es', license: 'MIT', what: 'la physique des dés' },
  { name: 'Auth.js', url: 'https://authjs.dev', license: 'ISC', what: 'la connexion Google et Discord' },
  { name: 'Drizzle ORM', url: 'https://orm.drizzle.team', license: 'Apache 2.0', what: 'la base de données' },
  { name: 'Neon serverless', url: 'https://neon.com', license: 'MIT', what: 'la liaison avec la base' },
  { name: 'Framer Motion', url: 'https://motion.dev', license: 'MIT', what: 'les animations' },
  { name: 'Lucide', url: 'https://lucide.dev', license: 'ISC', what: 'les icônes' },
  { name: 'react-youtube', url: 'https://github.com/tjallingt/react-youtube', license: 'MIT', what: 'le lecteur de musique' },
  { name: 'Geist', url: 'https://vercel.com/font', license: 'SIL Open Font License 1.1', what: 'la police de caractères' },
]

export default function CreditsPage() {
  return (
    <LegalPage title="Crédits" updated="22 octobre 2026">
      <p>
        CakeJDR est gratuit et s&apos;appuie sur le travail d&apos;autres créateurs, qui ont choisi de
        le partager librement. Merci à eux.
      </p>

      <h2>Musique</h2>
      <p>
        La musique d&apos;ambiance du MJ automatique est de {MUSIC_AUTHOR}, sous licence{' '}
        <a href={MUSIC_LICENSE_URL} target="_blank" rel="noopener">
          {MUSIC_LICENSE}
        </a>
        . Les morceaux sont lus depuis sa chaîne YouTube.
      </p>
      <ul>
        {TRACKS.map((track) => (
          <li key={track.id}>
            « {track.title} » {MUSIC_AUTHOR}
            <br />
            Licensed under {MUSIC_LICENSE}{' '}
            <a href={MUSIC_LICENSE_URL} target="_blank" rel="noopener">
              {MUSIC_LICENSE_URL}
            </a>
          </li>
        ))}
      </ul>
      <p>Les petits sons des boutons sont fabriqués par le navigateur : aucun fichier sous licence.</p>

      <h2>Systèmes de jeu</h2>
      <p>
        Les mentions demandées par les licences des règles reprises sont dans les{' '}
        <Link href="/conditions#systemes">conditions d&apos;utilisation</Link>.
      </p>

      <h2>Logiciels libres</h2>
      <ul>
        {SOFTWARE.map((s) => (
          <li key={s.name}>
            <a href={s.url} target="_blank" rel="noopener">
              {s.name}
            </a>{' '}
            ({s.license}) : {s.what}
          </li>
        ))}
      </ul>

      <h2>Images</h2>
      <p>
        Les cartes, pions et illustrations de la bibliothèque de départ appartiennent à QG
        Informatique.
      </p>

      <h2>Code source</h2>
      <p>
        Le code de CakeJDR est public sur{' '}
        <a href="https://github.com/QG-informatique/CakeJDR" target="_blank" rel="noopener">
          GitHub
        </a>
        .
      </p>
    </LegalPage>
  )
}

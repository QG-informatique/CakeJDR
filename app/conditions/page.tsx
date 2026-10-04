import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: "Conditions d'utilisation – CakeJDR" }

const CONTACT = 'qg.informatique.pro@gmail.com'

export default function ConditionsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="4 octobre 2026">
      <p>
        En utilisant CakeJDR, tu acceptes ces conditions. Elles sont courtes : merci de les lire.
      </p>

      <h2>Le service</h2>
      <p>
        CakeJDR est une table de jeu de rôle en ligne, gratuite. Il est fourni tel quel, sans
        garantie de disponibilité : il peut être interrompu, modifié ou arrêté, et une perte de
        données reste possible. Garde une copie de tes fiches importantes (export JSON).
      </p>

      <h2>Ton compte</h2>
      <p>
        La connexion passe par Google ou Discord. Tu es responsable de ce qui est fait depuis ton
        compte. Un compte par personne ; il est réservé aux personnes ayant l&apos;âge requis par
        Google ou Discord pour utiliser leur service.
      </p>

      <h2>Ce qui est interdit</h2>
      <ul>
        <li>Publier des contenus illégaux, haineux, harcelants, ou à caractère sexuel impliquant des mineurs.</li>
        <li>Publier des contenus dont tu n&apos;as pas les droits.</li>
        <li>Tenter de contourner les accès aux tables, de perturber le service ou d&apos;accéder aux données d&apos;autrui.</li>
      </ul>
      <p>
        Un compte qui ne respecte pas ces règles peut être suspendu ou supprimé, et ses contenus
        retirés. Pour signaler un contenu : <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>Tes contenus</h2>
      <p>
        Ce que tu crées (fiches, dessins, notes) reste à toi. Tu autorises seulement CakeJDR à le
        stocker et à l&apos;afficher aux membres de tes tables. Le créateur d&apos;une table en est le
        maître du jeu : il gère qui y entre et ce qui s&apos;y passe.
      </p>
      <p>
        Les images de la bibliothèque de départ appartiennent à QG Informatique : tu peux les
        utiliser librement dans tes tables CakeJDR, mais pas les reprendre ailleurs.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Changements</h2>
      <p>
        Ces conditions peuvent évoluer ; la date en haut de page indique la dernière version.
        Elles sont soumises au droit français.
      </p>

      <h2>Mentions légales</h2>
      <p>
        Éditeur : QG Informatique (Quentin Gaillard), <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
        <br />
        Hébergeur : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).
      </p>
    </LegalPage>
  )
}

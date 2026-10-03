import type { Metadata } from 'next'
import LegalPage from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Confidentialité – CakeJDR' }

const CONTACT = 'qg.informatique.pro@gmail.com'

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="3 octobre 2026">
      <p>
        CakeJDR est une table de jeu de rôle en ligne, gratuite, éditée par QG Informatique
        (Quentin Gaillard). Cette page explique quelles données le site garde, pourquoi, et
        comment les faire supprimer.
      </p>

      <h2>Ce que nous gardons</h2>
      <ul>
        <li>
          L&apos;identifiant de ton compte Google ou Discord, et le nom affiché au moment de ta
          première connexion (il devient ton pseudo, modifiable). Ton adresse email n&apos;est pas
          conservée, et aucun mot de passe ne passe par CakeJDR.
        </li>
        <li>La couleur de ton profil, les tables que tu crées ou rejoins et ton rôle dans chacune.</li>
        <li>Les fiches de personnage enregistrées sur ton compte.</li>
        <li>
          Ce qui est partagé dans une table : messages, lancers de dés, dessins, images et notes.
          Les autres membres de la table le voient.
        </li>
      </ul>
      <p>
        Ces données servent uniquement à faire fonctionner ton compte et tes tables. Pas de
        publicité, pas de revente, pas de mesure d&apos;audience.
      </p>

      <h2>Cookies et stockage local</h2>
      <p>
        Un seul cookie, celui qui te garde connecté (7 jours). Le navigateur garde aussi tes
        préférences : langue, fond d&apos;écran, fiches non synchronisées. La musique d&apos;une table
        passe par le lecteur YouTube, soumis aux règles de Google.
      </p>

      <h2>Prestataires</h2>
      <ul>
        <li>Vercel : hébergement du site.</li>
        <li>Neon : base de données, hébergée à Francfort (Allemagne).</li>
        <li>Liveblocks : synchronisation en temps réel des tables.</li>
        <li>Cloudinary : stockage des images ajoutées aux tables.</li>
        <li>Google et Discord : connexion à ton compte.</li>
      </ul>
      <p>
        Certains sont établis aux États-Unis ; ces transferts sont encadrés par les clauses
        contractuelles types de la Commission européenne prévues par chacun d&apos;eux.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Tant que ton compte existe. Une table supprimée l&apos;est avec son contenu. Une table où
        personne n&apos;est entré depuis six mois est supprimée automatiquement ; son MJ en est
        prévenu dans le menu un mois avant, et il suffit d&apos;y entrer pour la garder. La salle de
        démonstration est remise à zéro chaque jour.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux supprimer ton compte toi-même, depuis le lien « Supprimer mon compte » en bas du
        menu : tes fiches et les tables dont tu es le MJ partent avec lui. Tu peux aussi demander à
        consulter, corriger ou supprimer tes données en écrivant à <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. Réponse sous un mois. Tu peux
        aussi adresser une réclamation à la CNIL (cnil.fr).
      </p>
    </LegalPage>
  )
}

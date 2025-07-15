'use client'
import { FC } from 'react'

type Props = {
  perso: any
  onLevelUp: () => void
}

const CharacterSheet: FC<Props> = ({ perso, onLevelUp }) => (
  <aside className="w-1/5 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
    <h2 className="text-xl font-bold mb-4">Personnage</h2>
    <p><strong>Nom :</strong> {perso.nom}</p>
    <p><strong>Race :</strong> {perso.race}</p>
    <p><strong>Classe :</strong> {perso.classe}</p>
    <p><strong>Niveau :</strong> {perso.niveau}</p>
    <p><strong>PV :</strong> {perso.pv}</p>
    <h3 className="mt-4 font-semibold">Statistiques</h3>
    <ul className="list-disc ml-5">
      <li><strong>Force :</strong> {perso.force}</li>
      <li><strong>Dextérité :</strong> {perso.dexterite}</li>
      <li><strong>Constitution :</strong> {perso.constitution}</li>
      <li><strong>Intelligence :</strong> {perso.intelligence}</li>
      <li><strong>Sagesse :</strong> {perso.sagesse}</li>
      <li><strong>Charisme :</strong> {perso.charisme}</li>
    </ul>
    <h3 className="mt-4 font-semibold">Équipement</h3>
    <p><strong>Arme :</strong> {perso.arme}</p>
    <p><strong>Armure :</strong> {perso.armure}</p>
    <h3 className="mt-4 font-semibold">Compétences</h3>
    <ul className="list-disc ml-5">
      {perso.competence.map((c: string, i: number) => <li key={i}>{c}</li>)}
    </ul>
    <button onClick={onLevelUp} className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
      Level Up
    </button>
  </aside>
)

export default CharacterSheet

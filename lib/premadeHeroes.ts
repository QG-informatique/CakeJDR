/**
 * Héros tout prêts, proposés au joueur qui arrive sans fiche quand une
 * aventure du MJ automatique démarre : un clic et il joue.
 *
 * Portrait et pion viennent de la bibliothèque (`public/bibliotheque`). Les
 * caractéristiques sont sur l'échelle 3–18 commune aux trois systèmes de jeu
 * (`lib/gameSystems.ts`) ; Corpulence et Pouvoir ne servent qu'en d100.
 */
import { libraryUrl } from './library'
import { defaultCharacter, type Character } from '@/types/character'

type Stats = {
  force: number
  dexterite: number
  constitution: number
  intelligence: number
  sagesse: number
  charisme: number
  corpulence: number
  pouvoir: number
}

export type PremadeHero = {
  /** Image du portrait et du pion dans la bibliothèque. */
  image: string
  nom: string
  race: string
  classe: string
  sexe: string
  age: number
  /** Une ligne pour choisir, sur la carte du héros. */
  hook: string
  stats: Stats
  pv: number
  armes: string
  armure: string
  degats_armes: string
  competences: { nom: string; type: string; effets: string; degats?: string }[]
  objets: { nom: string; quantite: number }[]
  traits: string
  background: string
}

export const PREMADE_HEROES: readonly PremadeHero[] = [
  {
    image: 'guerriere-femme',
    nom: 'Brenna Cœur-de-Fer',
    race: 'Humaine',
    classe: 'Guerrière',
    sexe: 'Femme',
    age: 28,
    hook: 'Solide, franche, toujours en première ligne.',
    stats: { force: 16, dexterite: 12, constitution: 15, intelligence: 9, sagesse: 11, charisme: 10, corpulence: 14, pouvoir: 9 },
    pv: 14,
    armes: 'Épée longue, bouclier',
    armure: 'Cotte de mailles',
    degats_armes: '1d8',
    competences: [
      { nom: 'Second souffle', type: 'Capacité', effets: 'Une fois par combat, regagne 1d6 PV.' },
      { nom: 'Coup puissant', type: 'Attaque', effets: 'Frappe de toutes ses forces : +2 aux dégâts.', degats: '1d8+2' },
    ],
    objets: [
      { nom: 'Rations', quantite: 3 },
      { nom: 'Corde (15 m)', quantite: 1 },
    ],
    traits: 'Loyale, têtue, rit fort.',
    background: 'Ancienne sergente de la garde royale, elle a quitté l\'armée pour protéger ceux que le roi oublie.',
  },
  {
    image: 'mage-homme',
    nom: 'Aldric le Studieux',
    race: 'Humain',
    classe: 'Mage',
    sexe: 'Homme',
    age: 34,
    hook: 'Sait presque tout, et le fait savoir.',
    stats: { force: 8, dexterite: 12, constitution: 11, intelligence: 17, sagesse: 13, charisme: 10, corpulence: 10, pouvoir: 16 },
    pv: 8,
    armes: 'Bâton',
    armure: 'Robe',
    degats_armes: '1d6',
    competences: [
      { nom: 'Trait de feu', type: 'Sort', effets: 'Projette une flamme sur une cible à distance.', degats: '1d10' },
      { nom: 'Bouclier arcanique', type: 'Sort', effets: 'Une fois par combat, annule une attaque qui vient de le toucher.' },
    ],
    objets: [
      { nom: 'Grimoire', quantite: 1 },
      { nom: 'Plume et encre', quantite: 1 },
    ],
    traits: 'Curieux, distrait, un brin vaniteux.',
    background: 'Renvoyé de l\'académie pour avoir lu les livres interdits, il cherche à prouver qu\'il avait raison.',
  },
  {
    image: 'rodeur-homme',
    nom: 'Kael des Brumes',
    race: 'Demi-elfe',
    classe: 'Rôdeur',
    sexe: 'Homme',
    age: 41,
    hook: 'Lit les traces comme d\'autres lisent les livres.',
    stats: { force: 12, dexterite: 16, constitution: 13, intelligence: 11, sagesse: 15, charisme: 9, corpulence: 11, pouvoir: 11 },
    pv: 12,
    armes: 'Arc long, dague',
    armure: 'Cuir',
    degats_armes: '1d8',
    competences: [
      { nom: 'Pistage', type: 'Capacité', effets: 'Suit une piste même vieille de plusieurs jours.' },
      { nom: 'Tir précis', type: 'Attaque', effets: 'Vise un point faible à distance.', degats: '1d8+1' },
    ],
    objets: [
      { nom: 'Flèches', quantite: 20 },
      { nom: 'Herbes médicinales', quantite: 2 },
    ],
    traits: 'Silencieux, patient, méfiant envers les villes.',
    background: 'Guide des forêts du nord, il a vu des ombres ailées passer au-dessus des cimes et veut savoir pourquoi.',
  },
  {
    image: 'roublarde-femme',
    nom: 'Sila Main-Leste',
    race: 'Halfeline',
    classe: 'Roublarde',
    sexe: 'Femme',
    age: 24,
    hook: 'Aucune serrure ne lui résiste, aucune bourse non plus.',
    stats: { force: 9, dexterite: 17, constitution: 12, intelligence: 13, sagesse: 10, charisme: 14, corpulence: 7, pouvoir: 10 },
    pv: 10,
    armes: 'Deux dagues',
    armure: 'Cuir',
    degats_armes: '1d4',
    competences: [
      { nom: 'Attaque sournoise', type: 'Attaque', effets: 'Frappe une cible qui ne la voit pas venir.', degats: '1d4+1d6' },
      { nom: 'Crochetage', type: 'Capacité', effets: 'Ouvre serrures et cadenas avec ses outils.' },
    ],
    objets: [
      { nom: 'Outils de crocheteuse', quantite: 1 },
      { nom: 'Cape sombre', quantite: 1 },
    ],
    traits: 'Rieuse, gourmande, ne tient pas en place.',
    background: 'Enfant des ruelles de la ville royale, elle vole aux riches et doit une faveur à la guilde.',
  },
  {
    image: 'nain-guerrier',
    nom: 'Thorgrim Barbe-de-Roc',
    race: 'Nain',
    classe: 'Guerrier',
    sexe: 'Homme',
    age: 112,
    hook: 'Une hache, une barbe, et pas peur du feu.',
    stats: { force: 15, dexterite: 9, constitution: 17, intelligence: 10, sagesse: 12, charisme: 9, corpulence: 13, pouvoir: 10 },
    pv: 16,
    armes: 'Hache de guerre',
    armure: 'Armure d\'écailles',
    degats_armes: '1d10',
    competences: [
      { nom: 'Robustesse naine', type: 'Capacité', effets: 'Résiste au poison et au feu : dégâts de ce type réduits de moitié.' },
      { nom: 'Coup de hache', type: 'Attaque', effets: 'Fend bouclier et armure.', degats: '1d10+1' },
    ],
    objets: [
      { nom: 'Gourde de bière', quantite: 1 },
      { nom: 'Pioche', quantite: 1 },
    ],
    traits: 'Grognon, fidèle, rancunier.',
    background: 'Sa forge familiale a fondu sous le souffle d\'un dragon il y a cent ans. Il n\'a pas oublié.',
  },
  {
    image: 'paladine-femme',
    nom: 'Isaure de Lumière',
    race: 'Humaine',
    classe: 'Paladine',
    sexe: 'Femme',
    age: 30,
    hook: 'Protège les faibles, quoi qu\'il en coûte.',
    stats: { force: 15, dexterite: 10, constitution: 14, intelligence: 10, sagesse: 12, charisme: 15, corpulence: 12, pouvoir: 13 },
    pv: 13,
    armes: 'Masse d\'armes, bouclier',
    armure: 'Harnois',
    degats_armes: '1d8',
    competences: [
      { nom: 'Imposition des mains', type: 'Sort', effets: 'Soigne un allié en le touchant : 1d8 PV, deux fois par aventure.' },
      { nom: 'Châtiment', type: 'Attaque', effets: 'Frappe sacrée, redoutable contre les morts-vivants.', degats: '1d8+1d6' },
    ],
    objets: [
      { nom: 'Symbole sacré', quantite: 1 },
      { nom: 'Eau bénite', quantite: 1 },
    ],
    traits: 'Droite, généreuse, parfois rigide.',
    background: 'Chevalière d\'un ordre presque disparu, elle a juré de rallumer la flamme de son temple.',
  },
  {
    image: 'barde-homme',
    nom: 'Lucien Mille-Chansons',
    race: 'Elfe',
    classe: 'Barde',
    sexe: 'Homme',
    age: 87,
    hook: 'Charme, ment, chante. Souvent les trois à la fois.',
    stats: { force: 9, dexterite: 14, constitution: 11, intelligence: 12, sagesse: 10, charisme: 17, corpulence: 9, pouvoir: 14 },
    pv: 10,
    armes: 'Rapière, luth',
    armure: 'Cuir fin',
    degats_armes: '1d6',
    competences: [
      { nom: 'Chant inspirant', type: 'Sort', effets: 'Un allié qui l\'entend ajoute 1d4 à son prochain jet.' },
      { nom: 'Belle parole', type: 'Capacité', effets: 'Avantage pour convaincre, marchander ou mentir.' },
    ],
    objets: [
      { nom: 'Luth', quantite: 1 },
      { nom: 'Habits de fête', quantite: 1 },
    ],
    traits: 'Charmeur, vantard, sincère quand ça compte.',
    background: 'Il cherche l\'histoire qui fera de lui une légende. Un dragon ferait parfaitement l\'affaire.',
  },
  {
    image: 'druidesse-femme',
    nom: 'Maëlle des Chênes',
    race: 'Elfe des bois',
    classe: 'Druidesse',
    sexe: 'Femme',
    age: 120,
    hook: 'Parle aux bêtes, et les bêtes lui répondent.',
    stats: { force: 10, dexterite: 13, constitution: 13, intelligence: 12, sagesse: 17, charisme: 11, corpulence: 10, pouvoir: 15 },
    pv: 11,
    armes: 'Bâton noueux, fronde',
    armure: 'Peaux',
    degats_armes: '1d6',
    competences: [
      { nom: 'Parler aux animaux', type: 'Sort', effets: 'Comprend les animaux et se fait comprendre d\'eux.' },
      { nom: 'Ronces', type: 'Sort', effets: 'Des ronces jaillissent et entravent un ennemi.', degats: '1d6' },
    ],
    objets: [
      { nom: 'Baies nourrissantes', quantite: 4 },
      { nom: 'Bourse de graines', quantite: 1 },
    ],
    traits: 'Calme, observatrice, peu patiente avec les citadins.',
    background: 'Gardienne d\'une forêt que la brume ronge, elle sent que le mal vient de la montagne.',
  },
]

/** Fiche complète, neuve, du héros choisi, au nom de ce joueur. */
export function heroCharacter(hero: PremadeHero, owner: { pseudo: string; id?: string }): Character {
  const id = () => crypto.randomUUID()
  return {
    ...defaultCharacter,
    id: id(),
    owner: owner.pseudo,
    ownerId: owner.id,
    nom: hero.nom,
    race: hero.race,
    classe: hero.classe,
    sexe: hero.sexe,
    age: hero.age,
    ...hero.stats,
    pv: hero.pv,
    pv_max: hero.pv,
    armes: hero.armes,
    armure: hero.armure,
    degats_armes: hero.degats_armes,
    competences: hero.competences.map((c) => ({ ...c, id: id() })),
    objets: hero.objets.map((o) => ({ ...o, id: id() })),
    traits: hero.traits,
    background: hero.background,
    bourse: 10,
    portrait: libraryUrl('portraits', hero.image),
    pion: libraryUrl('pions', hero.image),
  }
}

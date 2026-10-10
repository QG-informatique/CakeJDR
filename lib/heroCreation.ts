/**
 * Création d'un personnage guidée par le MJ automatique : un nom, un peuple,
 * une classe, puis les dés de chaque caractéristique, lancés sur la table.
 *
 * Les dés suivent le système de la table (`lib/gameSystems.ts`) :
 * - narratif et Fantasy 5E : 4 D6, on garde les 3 meilleurs (SRD 5.2.1) ;
 * - Enquête d100 : 3 D6, ou 2 D6 + 6 pour la Corpulence et l'Intelligence
 *   (Basic Roleplaying). Les PV y valent (Constitution + Corpulence) / 2.
 * Ailleurs, les PV de départ sont le dé de vie de la classe plus le
 * modificateur de Constitution.
 */
import type { GameSystemId } from './gameSystems'
import type { PremadeHero } from './premadeHeroes'
import { CLASSES_EN, PEOPLES_EN } from './en/heroes'

export type People = { id: string; nom: string; capacite: string }

export const PEOPLES: readonly People[] = [
  { id: 'humain', nom: 'Humain', capacite: 'Débrouillard : apprend vite, s\'adapte à tout.' },
  { id: 'elfe', nom: 'Elfe', capacite: 'Sens aiguisés : voit dans la pénombre et repère ce qui est caché.' },
  { id: 'nain', nom: 'Nain', capacite: 'Robuste : résiste au poison, ne craint pas la roche ni le feu.' },
  { id: 'halfelin', nom: 'Halfelin', capacite: 'Chanceux : passe partout, se faufile là où les grands restent coincés.' },
  { id: 'demi-elfe', nom: 'Demi-elfe', capacite: 'Entre deux mondes : charme les uns et les autres.' },
  { id: 'gnome', nom: 'Gnome', capacite: 'Inventif : bricole un objet utile avec trois fois rien.' },
]

export type HeroClass = {
  id: string
  nom: string
  /** Ce que la classe fait, en une ligne. */
  hook: string
  /** Dé de vie : les PV de départ. */
  hitDie: number
  armes: string
  armure: string
  degats_armes: string
  competences: PremadeHero['competences']
  objets: PremadeHero['objets']
  /** Portraits du pack proposés en premier pour cette classe. */
  portraits: readonly string[]
}

export const HERO_CLASSES: readonly HeroClass[] = [
  {
    id: 'guerrier',
    nom: 'Guerrier',
    hook: 'En première ligne, l\'arme à la main.',
    hitDie: 10,
    armes: 'Épée longue, bouclier',
    armure: 'Cotte de mailles',
    degats_armes: '1d8',
    competences: [
      { nom: 'Second souffle', type: 'Capacité', effets: 'Une fois par combat, regagne 1d6 PV.' },
      { nom: 'Coup puissant', type: 'Attaque', effets: 'Frappe de toutes ses forces : +2 aux dégâts.', degats: '1d8+2' },
    ],
    objets: [{ nom: 'Rations', quantite: 3 }, { nom: 'Corde (15 m)', quantite: 1 }],
    portraits: ['guerrier-homme', 'guerriere-femme', 'nain-guerrier'],
  },
  {
    id: 'mage',
    nom: 'Mage',
    hook: 'Des sorts puissants, mais peu de résistance.',
    hitDie: 6,
    armes: 'Bâton',
    armure: 'Robe',
    degats_armes: '1d6',
    competences: [
      { nom: 'Trait de feu', type: 'Sort', effets: 'Projette une flamme sur une cible à distance.', degats: '1d10' },
      { nom: 'Bouclier arcanique', type: 'Sort', effets: 'Une fois par combat, annule une attaque qui vient de toucher.' },
    ],
    objets: [{ nom: 'Grimoire', quantite: 1 }, { nom: 'Plume et encre', quantite: 1 }],
    portraits: ['mage-homme', 'mage-femme', 'cake-patissier'],
  },
  {
    id: 'rodeur',
    nom: 'Rôdeur',
    hook: 'Pisteur et archer, chez lui dans la nature.',
    hitDie: 10,
    armes: 'Arc long, dague',
    armure: 'Cuir',
    degats_armes: '1d8',
    competences: [
      { nom: 'Pistage', type: 'Capacité', effets: 'Suit une piste même vieille de plusieurs jours.' },
      { nom: 'Tir précis', type: 'Attaque', effets: 'Vise un point faible à distance.', degats: '1d8+1' },
    ],
    objets: [{ nom: 'Flèches', quantite: 20 }, { nom: 'Herbes médicinales', quantite: 2 }],
    portraits: ['rodeur-homme', 'rodeuse-femme'],
  },
  {
    id: 'roublard',
    nom: 'Roublard',
    hook: 'Discret, agile, aucune serrure ne lui résiste.',
    hitDie: 8,
    armes: 'Deux dagues',
    armure: 'Cuir',
    degats_armes: '1d4',
    competences: [
      { nom: 'Attaque sournoise', type: 'Attaque', effets: 'Frappe une cible qui ne le voit pas venir.', degats: '1d4+1d6' },
      { nom: 'Crochetage', type: 'Capacité', effets: 'Ouvre serrures et cadenas avec ses outils.' },
    ],
    objets: [{ nom: 'Outils de crocheteur', quantite: 1 }, { nom: 'Cape sombre', quantite: 1 }],
    portraits: ['roublard-homme', 'roublarde-femme'],
  },
  {
    id: 'paladin',
    nom: 'Paladin',
    hook: 'Chevalier sacré, protège et soigne.',
    hitDie: 10,
    armes: 'Masse d\'armes, bouclier',
    armure: 'Harnois',
    degats_armes: '1d8',
    competences: [
      { nom: 'Imposition des mains', type: 'Sort', effets: 'Soigne un allié en le touchant : 1d8 PV, deux fois par aventure.' },
      { nom: 'Châtiment', type: 'Attaque', effets: 'Frappe sacrée, redoutable contre les morts-vivants.', degats: '1d8+1d6' },
    ],
    objets: [{ nom: 'Symbole sacré', quantite: 1 }, { nom: 'Eau bénite', quantite: 1 }],
    portraits: ['paladine-femme', 'guerrier-homme'],
  },
  {
    id: 'barde',
    nom: 'Barde',
    hook: 'Charme, inspire, et se sort de tout par la parole.',
    hitDie: 8,
    armes: 'Rapière, luth',
    armure: 'Cuir fin',
    degats_armes: '1d6',
    competences: [
      { nom: 'Chant inspirant', type: 'Sort', effets: 'Un allié qui l\'entend ajoute 1d4 à son prochain jet.' },
      { nom: 'Belle parole', type: 'Capacité', effets: 'Avantage pour convaincre, marchander ou mentir.' },
    ],
    objets: [{ nom: 'Luth', quantite: 1 }, { nom: 'Habits de fête', quantite: 1 }],
    portraits: ['barde-homme'],
  },
  {
    id: 'druide',
    nom: 'Druide',
    hook: 'Parle aux bêtes et commande aux plantes.',
    hitDie: 8,
    armes: 'Bâton noueux, fronde',
    armure: 'Peaux',
    degats_armes: '1d6',
    competences: [
      { nom: 'Parler aux animaux', type: 'Sort', effets: 'Comprend les animaux et se fait comprendre d\'eux.' },
      { nom: 'Ronces', type: 'Sort', effets: 'Des ronces jaillissent et entravent un ennemi.', degats: '1d6' },
    ],
    objets: [{ nom: 'Baies nourrissantes', quantite: 4 }, { nom: 'Bourse de graines', quantite: 1 }],
    portraits: ['druidesse-femme'],
  },
  {
    id: 'clerc',
    nom: 'Clerc',
    hook: 'Prêtre de terrain : soigne ses amis, repousse les ténèbres.',
    hitDie: 8,
    armes: 'Masse, bouclier',
    armure: 'Cotte de mailles',
    degats_armes: '1d6',
    competences: [
      { nom: 'Soins', type: 'Sort', effets: 'Soigne un allié à portée de voix : 1d8 PV, trois fois par aventure.' },
      { nom: 'Lumière sacrée', type: 'Sort', effets: 'Une lumière brûlante frappe une cible à distance.', degats: '1d8' },
    ],
    objets: [{ nom: 'Symbole sacré', quantite: 1 }, { nom: 'Bandages', quantite: 3 }],
    portraits: ['clerc-femme'],
  },
  {
    id: 'moine',
    nom: 'Moine',
    hook: 'Mains nues, rapide comme le vent.',
    hitDie: 8,
    armes: 'Mains nues, bâton',
    armure: 'Aucune',
    degats_armes: '1d6',
    competences: [
      { nom: 'Déluge de coups', type: 'Attaque', effets: 'Deux coups rapides d\'un seul geste.', degats: '1d6+1d6' },
      { nom: 'Pas du vent', type: 'Capacité', effets: 'Bondit, court sur un mur, esquive un piège.' },
    ],
    objets: [{ nom: 'Rations', quantite: 3 }, { nom: 'Chapelet', quantite: 1 }],
    portraits: ['moine-homme'],
  },
]

const ENGLISH_PEOPLES: readonly People[] = PEOPLES.map((p) => ({ ...p, ...PEOPLES_EN[p.id] }))

const ENGLISH_CLASSES: readonly HeroClass[] = HERO_CLASSES.map((c) => {
  const en = CLASSES_EN[c.id]
  if (!en) return c
  return {
    ...c,
    ...en,
    competences: c.competences.map((s, i) => ({ ...s, ...en.competences[i] })),
    objets: c.objets.map((o, i) => ({ ...o, nom: en.objets[i] ?? o.nom })),
  }
})

/** Peuples et classes dans la langue de l'interface. */
export function peoples(lang: 'en' | 'fr'): readonly People[] {
  return lang === 'en' ? ENGLISH_PEOPLES : PEOPLES
}

export function heroClasses(lang: 'en' | 'fr'): readonly HeroClass[] {
  return lang === 'en' ? ENGLISH_CLASSES : HERO_CLASSES
}

/** Portraits du pack qui ont aussi leur pion. */
export const HERO_PORTRAITS = [
  'guerrier-homme', 'guerriere-femme', 'mage-homme', 'mage-femme', 'rodeur-homme', 'rodeuse-femme',
  'roublard-homme', 'roublarde-femme', 'cake-patissier', 'nain-guerrier', 'paladine-femme', 'barde-homme',
  'druidesse-femme', 'moine-homme', 'clerc-femme',
] as const

/** Dés d'une caractéristique : `count` D6, on garde les `keep` meilleurs, plus `bonus`. */
export type StatDice = { count: number; keep: number; bonus: number }

export function statDice(system: GameSystemId, stat: string): StatDice {
  if (system === 'd100') {
    return stat === 'corpulence' || stat === 'intelligence' ? { count: 2, keep: 2, bonus: 6 } : { count: 3, keep: 3, bonus: 0 }
  }
  return { count: 4, keep: 3, bonus: 0 }
}

export function statValue(dice: StatDice, faces: readonly number[]): number {
  const kept = [...faces].sort((a, b) => b - a).slice(0, dice.keep)
  return kept.reduce((a, b) => a + b, 0) + dice.bonus
}

/** PV de départ, selon le système. */
export function startingHp(system: GameSystemId, heroClass: HeroClass, stats: Record<string, number>): number {
  const con = stats.constitution ?? 10
  if (system === 'd100') return Math.ceil((con + (stats.corpulence ?? 10)) / 2)
  return Math.max(1, heroClass.hitDie + Math.floor((con - 10) / 2))
}

/** Le héros créé, au format des héros tout prêts. */
export function createdHero(
  system: GameSystemId,
  draft: { nom: string; people: People; heroClass: HeroClass; image: string; stats: Record<string, number> },
): PremadeHero {
  const { nom, people, heroClass, image, stats } = draft
  const get = (k: string) => stats[k] ?? 10
  return {
    image,
    nom,
    race: people.nom,
    classe: heroClass.nom,
    sexe: '',
    age: '',
    hook: '',
    stats: {
      force: get('force'),
      dexterite: get('dexterite'),
      constitution: get('constitution'),
      intelligence: get('intelligence'),
      sagesse: get('sagesse'),
      charisme: get('charisme'),
      corpulence: get('corpulence'),
      pouvoir: get('pouvoir'),
    },
    pv: startingHp(system, heroClass, stats),
    armes: heroClass.armes,
    armure: heroClass.armure,
    degats_armes: heroClass.degats_armes,
    competences: heroClass.competences,
    objets: heroClass.objets,
    traits: '',
    background: '',
    capacite_raciale: people.capacite,
  }
}

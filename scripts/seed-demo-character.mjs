/**
 * Installe la fiche de personnage de démonstration dans la salle d'exemple.
 *
 * Elle remplace les fiches existantes : un visiteur ne doit en trouver qu'une,
 * complète, qui montre tout ce qu'une fiche peut contenir — caractéristiques,
 * compétences, inventaire, description, et champs personnalisés.
 *
 *   node scripts/seed-demo-character.mjs
 */
import { Liveblocks } from '@liveblocks/node'
import { LiveMap } from '@liveblocks/client'

const ROOM = process.env.DEMO_ROOM_ID
const OWNER = 'Démo'
const ID = 'demo-cake'

const character = {
  id: ID,
  owner: OWNER,
  nom: 'Cake',
  race: 'Halfelin pâtissier',
  classe: 'Mage de la Fournaise',
  sexe: 'Non précisé',
  age: 34,
  taille: '1,12 m',
  poids: '41 kg',
  capacite_raciale: "Pied léger : ignore le premier jet de discrétion raté de la journée.",
  niveau: 5,
  defense: 14,
  chance: 3,
  initiative: 4,
  pv: 27,
  pv_max: 34,

  force: 8,
  dexterite: 15,
  constitution: 13,
  intelligence: 17,
  sagesse: 12,
  charisme: 14,
  force_mod: -1,
  dexterite_mod: 2,
  constitution_mod: 1,
  intelligence_mod: 3,
  sagesse_mod: 1,
  charisme_mod: 2,

  mod_contact: 1,
  mod_distance: 4,
  mod_magique: 6,

  bourse: 215,
  armes: 'Rouleau à pâtisserie renforcé, fronde à noisettes',
  armure: 'Tablier matelassé',
  degats_armes: '1d6+1 (contondant)',
  modif_armure: 2,

  competences: [
    {
      id: 'comp-1',
      nom: 'Fournée ardente',
      type: 'Sort',
      effets: "Projette une brioche brûlante. Le sol reste chaud un tour et gêne les déplacements.",
      degats: '2d6 feu',
    },
    {
      id: 'comp-2',
      nom: 'Glaçage protecteur',
      type: 'Sort',
      effets: "Recouvre un allié d'un glaçage dur. Absorbe les dégâts jusqu'à épuisement.",
      degats: '—',
    },
    {
      id: 'comp-3',
      nom: 'Odeur alléchante',
      type: 'Capacité',
      effets: "Attire les créatures affamées vers un point choisi. Sans effet sur les morts-vivants.",
      degats: '—',
    },
    {
      id: 'comp-4',
      nom: 'Coup de rouleau',
      type: 'Attaque',
      effets: "Attaque au contact. Étourdit une cible surprise pendant un tour.",
      degats: '1d6+1',
    },
  ],

  objets: [
    { id: 'obj-1', nom: 'Rouleau à pâtisserie renforcé', quantite: 1 },
    { id: 'obj-2', nom: 'Sachet de levure runique', quantite: 3 },
    { id: 'obj-3', nom: 'Potion de soin mineure', quantite: 2 },
    { id: 'obj-4', nom: 'Corde de chanvre (15 m)', quantite: 1 },
    { id: 'obj-5', nom: 'Carnet de recettes annoté', quantite: 1 },
    { id: 'obj-6', nom: 'Ration de voyage', quantite: 7 },
    { id: 'obj-7', nom: 'Lanterne sourde', quantite: 1 },
  ],

  traits: "Parle à sa pâte quand il réfléchit. Ne supporte pas qu'on mange debout.",
  ideal: "Un bon repas partagé désamorce plus de conflits qu'une épée tirée.",
  obligations: "A promis à sa grand-mère de retrouver le four ancestral de la famille.",
  failles: "Incapable de refuser un défi culinaire, même tendu par un ennemi manifeste.",
  avantages: "Accueilli sans méfiance dans presque toutes les auberges du royaume.",
  background:
    "Cake a grandi dans une échoppe de Bourg-les-Moulins, entre la farine et les livres de sorts que son grand-père cachait sous le comptoir. Il a découvert à douze ans que la magie et la pâtisserie obéissent aux mêmes lois : la bonne mesure, la bonne chaleur, le bon moment. Depuis que le four ancestral a disparu dans l'incendie de la halle, il parcourt les routes pour en retrouver la trace, en nourrissant tous ceux qu'il croise.",

  champs_perso: [
    { id: 'cp-1', label: 'Spécialité', value: 'Tarte aux myrtilles de brume' },
    { id: 'cp-2', label: 'Four portatif', value: 'Chargé — 3 utilisations restantes' },
    { id: 'cp-3', label: 'Réputation à Bourg-les-Moulins', value: 'Excellente' },
    { id: 'cp-4', label: 'Dette envers la guilde', value: '40 pièces d\'or' },
    { id: 'cp-5', label: 'Familier', value: 'Miette, souris des champs' },
  ],

  notes:
    "Fiche de démonstration. Modifie-la librement pour essayer : tout est réinitialisé régulièrement, rien n'est perdu.",

  updatedAt: Date.now(),
}

const lb = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY })

await lb.mutateStorage(ROOM, ({ root }) => {
  let map = root.get('characters')
  if (!map) {
    root.set('characters', new LiveMap())
    map = root.get('characters')
  }
  // Une seule fiche visible : on retire les anciennes.
  for (const key of Array.from(map.keys())) map.delete(key)
  map.set(`${OWNER}:${ID}`, character)
})

console.log('Fiche installee :', character.nom, '| competences :', character.competences.length, '| objets :', character.objets.length, '| champs perso :', character.champs_perso.length)

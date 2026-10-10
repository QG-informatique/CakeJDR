/**
 * Héros tout prêts, peuples et classes en anglais (`lib/premadeHeroes.ts`,
 * `lib/heroCreation.ts`). Compétences et objets suivent l'ordre du français.
 */
type SkillText = { nom: string; type: string; effets: string }

export type HeroText = {
  nom: string
  race: string
  classe: string
  sexe: string
  hook: string
  armes: string
  armure: string
  competences: SkillText[]
  objets: string[]
  traits: string
  background: string
}

export type ClassText = { nom: string; hook: string; armes: string; armure: string; competences: SkillText[]; objets: string[] }

export type PeopleText = { nom: string; capacite: string }

const SECOND_WIND: SkillText = { nom: 'Second Wind', type: 'Ability', effets: 'Once per fight, regain 1d6 HP.' }
const POWER_STRIKE: SkillText = { nom: 'Power Strike', type: 'Attack', effets: 'Strike with all your might: +2 damage.' }
const FIRE_BOLT: SkillText = { nom: 'Fire Bolt', type: 'Spell', effets: 'Hurl a flame at a distant target.' }
const TRACKING: SkillText = { nom: 'Tracking', type: 'Ability', effets: 'Follow a trail, even one several days old.' }
const AIMED_SHOT: SkillText = { nom: 'Aimed Shot', type: 'Attack', effets: 'Aim for a weak spot from a distance.' }
const LOCKPICKING: SkillText = { nom: 'Lockpicking', type: 'Ability', effets: 'Open locks and padlocks with your tools.' }
const LAY_ON_HANDS: SkillText = { nom: 'Lay on Hands', type: 'Spell', effets: 'Heal an ally with a touch: 1d8 HP, twice per adventure.' }
const SMITE: SkillText = { nom: 'Smite', type: 'Attack', effets: 'A holy strike, deadly against the undead.' }
const INSPIRING_SONG: SkillText = { nom: 'Inspiring Song', type: 'Spell', effets: 'An ally who hears it adds 1d4 to their next roll.' }
const SILVER_TONGUE: SkillText = { nom: 'Silver Tongue', type: 'Ability', effets: 'Advantage to persuade, bargain or lie.' }
const SPEAK_WITH_ANIMALS: SkillText = { nom: 'Speak with Animals', type: 'Spell', effets: 'Understand animals and make yourself understood by them.' }
const BRAMBLES: SkillText = { nom: 'Brambles', type: 'Spell', effets: 'Brambles burst from the ground and entangle an enemy.' }

/** Par image du héros. */
export const HEROES_EN: Record<string, HeroText> = {
  'guerriere-femme': {
    nom: 'Brenna Ironheart',
    race: 'Human',
    classe: 'Fighter',
    sexe: 'Female',
    hook: 'Solid, honest, always on the front line.',
    armes: 'Longsword, shield',
    armure: 'Chain mail',
    competences: [SECOND_WIND, POWER_STRIKE],
    objets: ['Rations', 'Rope (50 ft)'],
    traits: 'Loyal, stubborn, laughs loudly.',
    background: "A former sergeant of the royal guard, she left the army to protect those the king forgets.",
  },
  'mage-homme': {
    nom: 'Aldric the Studious',
    race: 'Human',
    classe: 'Wizard',
    sexe: 'Male',
    hook: 'Knows almost everything, and makes sure you know it.',
    armes: 'Staff',
    armure: 'Robe',
    competences: [FIRE_BOLT, { nom: 'Arcane Shield', type: 'Spell', effets: 'Once per fight, cancel an attack that has just hit him.' }],
    objets: ['Spellbook', 'Quill and ink'],
    traits: 'Curious, absent-minded, a little vain.',
    background: 'Expelled from the academy for reading the forbidden books, he wants to prove he was right.',
  },
  'rodeur-homme': {
    nom: 'Kael of the Mists',
    race: 'Half-elf',
    classe: 'Ranger',
    sexe: 'Male',
    hook: 'Reads tracks the way others read books.',
    armes: 'Longbow, dagger',
    armure: 'Leather',
    competences: [TRACKING, AIMED_SHOT],
    objets: ['Arrows', 'Healing herbs'],
    traits: 'Quiet, patient, wary of cities.',
    background: 'A guide in the northern forests, he has seen winged shadows pass above the treetops and wants to know why.',
  },
  'roublarde-femme': {
    nom: 'Sila Quickhand',
    race: 'Halfling',
    classe: 'Rogue',
    sexe: 'Female',
    hook: 'No lock can resist her, and no purse either.',
    armes: 'Two daggers',
    armure: 'Leather',
    competences: [{ nom: 'Sneak Attack', type: 'Attack', effets: "Strike a target that doesn't see her coming." }, LOCKPICKING],
    objets: ["Thieves' tools", 'Dark cloak'],
    traits: "Cheerful, greedy for sweets, can't sit still.",
    background: 'A child of the royal city\'s back alleys, she steals from the rich and owes the guild a favour.',
  },
  'nain-guerrier': {
    nom: 'Thorgrim Rockbeard',
    race: 'Dwarf',
    classe: 'Fighter',
    sexe: 'Male',
    hook: 'An axe, a beard, and no fear of fire.',
    armes: 'War axe',
    armure: 'Scale armour',
    competences: [
      { nom: 'Dwarven Toughness', type: 'Ability', effets: 'Resists poison and fire: damage of those kinds is halved.' },
      { nom: 'Axe Blow', type: 'Attack', effets: 'Splits shields and armour.' },
    ],
    objets: ['Flask of ale', 'Pickaxe'],
    traits: 'Grumpy, faithful, holds a grudge.',
    background: "His family forge melted under a dragon's breath a hundred years ago. He hasn't forgotten.",
  },
  'paladine-femme': {
    nom: 'Isaure of the Light',
    race: 'Human',
    classe: 'Paladin',
    sexe: 'Female',
    hook: 'Protects the weak, whatever the cost.',
    armes: 'Mace, shield',
    armure: 'Plate armour',
    competences: [LAY_ON_HANDS, SMITE],
    objets: ['Holy symbol', 'Holy water'],
    traits: 'Upright, generous, sometimes rigid.',
    background: 'A knight of an order that has all but vanished, she swore to rekindle the flame of her temple.',
  },
  'barde-homme': {
    nom: 'Lucien Thousand-Songs',
    race: 'Elf',
    classe: 'Bard',
    sexe: 'Male',
    hook: 'Charms, lies, sings. Often all three at once.',
    armes: 'Rapier, lute',
    armure: 'Fine leather',
    competences: [INSPIRING_SONG, SILVER_TONGUE],
    objets: ['Lute', 'Festive clothes'],
    traits: 'Charming, boastful, sincere when it matters.',
    background: 'He is looking for the story that will make him a legend. A dragon would do perfectly.',
  },
  'druidesse-femme': {
    nom: 'Maëlle of the Oaks',
    race: 'Wood elf',
    classe: 'Druid',
    sexe: 'Female',
    hook: 'Talks to beasts, and the beasts answer.',
    armes: 'Gnarled staff, sling',
    armure: 'Hides',
    competences: [SPEAK_WITH_ANIMALS, BRAMBLES],
    objets: ['Goodberries', 'Pouch of seeds'],
    traits: 'Calm, observant, little patience for city folk.',
    background: 'Guardian of a forest eaten away by the mist, she senses that the evil comes from the mountain.',
  },
}

/** Par identifiant du peuple. */
export const PEOPLES_EN: Record<string, PeopleText> = {
  humain: { nom: 'Human', capacite: 'Resourceful: learns fast, adapts to anything.' },
  elfe: { nom: 'Elf', capacite: 'Keen senses: sees in dim light and spots what is hidden.' },
  nain: { nom: 'Dwarf', capacite: 'Sturdy: resists poison, fears neither rock nor fire.' },
  halfelin: { nom: 'Halfling', capacite: 'Lucky: gets through anywhere, slips in where the tall folk get stuck.' },
  'demi-elfe': { nom: 'Half-elf', capacite: 'Between two worlds: charms both sides.' },
  gnome: { nom: 'Gnome', capacite: 'Inventive: tinkers a useful gadget out of next to nothing.' },
}

/** Par identifiant de la classe. */
export const CLASSES_EN: Record<string, ClassText> = {
  guerrier: {
    nom: 'Fighter',
    hook: 'On the front line, weapon in hand.',
    armes: 'Longsword, shield',
    armure: 'Chain mail',
    competences: [SECOND_WIND, POWER_STRIKE],
    objets: ['Rations', 'Rope (50 ft)'],
  },
  mage: {
    nom: 'Wizard',
    hook: 'Powerful spells, but not much staying power.',
    armes: 'Staff',
    armure: 'Robe',
    competences: [FIRE_BOLT, { nom: 'Arcane Shield', type: 'Spell', effets: 'Once per fight, cancel an attack that has just hit.' }],
    objets: ['Spellbook', 'Quill and ink'],
  },
  rodeur: {
    nom: 'Ranger',
    hook: 'Tracker and archer, at home in the wild.',
    armes: 'Longbow, dagger',
    armure: 'Leather',
    competences: [TRACKING, AIMED_SHOT],
    objets: ['Arrows', 'Healing herbs'],
  },
  roublard: {
    nom: 'Rogue',
    hook: 'Stealthy, nimble, no lock can resist.',
    armes: 'Two daggers',
    armure: 'Leather',
    competences: [{ nom: 'Sneak Attack', type: 'Attack', effets: "Strike a target that doesn't see you coming." }, LOCKPICKING],
    objets: ["Thieves' tools", 'Dark cloak'],
  },
  paladin: {
    nom: 'Paladin',
    hook: 'Holy knight, protects and heals.',
    armes: 'Mace, shield',
    armure: 'Plate armour',
    competences: [LAY_ON_HANDS, SMITE],
    objets: ['Holy symbol', 'Holy water'],
  },
  barde: {
    nom: 'Bard',
    hook: 'Charms, inspires, and talks their way out of anything.',
    armes: 'Rapier, lute',
    armure: 'Fine leather',
    competences: [INSPIRING_SONG, SILVER_TONGUE],
    objets: ['Lute', 'Festive clothes'],
  },
  druide: {
    nom: 'Druid',
    hook: 'Talks to beasts and commands plants.',
    armes: 'Gnarled staff, sling',
    armure: 'Hides',
    competences: [SPEAK_WITH_ANIMALS, BRAMBLES],
    objets: ['Goodberries', 'Pouch of seeds'],
  },
  clerc: {
    nom: 'Cleric',
    hook: 'A priest in the field: heals friends, drives back the darkness.',
    armes: 'Mace, shield',
    armure: 'Chain mail',
    competences: [
      { nom: 'Healing', type: 'Spell', effets: 'Heal an ally within earshot: 1d8 HP, three times per adventure.' },
      { nom: 'Sacred Light', type: 'Spell', effets: 'A searing light strikes a distant target.' },
    ],
    objets: ['Holy symbol', 'Bandages'],
  },
  moine: {
    nom: 'Monk',
    hook: 'Bare hands, swift as the wind.',
    armes: 'Bare hands, staff',
    armure: 'None',
    competences: [
      { nom: 'Flurry of Blows', type: 'Attack', effets: 'Two quick strikes in a single move.' },
      { nom: 'Step of the Wind', type: 'Ability', effets: 'Leap, run along a wall, dodge a trap.' },
    ],
    objets: ['Rations', 'Prayer beads'],
  },
}

/**
 * Format d'une aventure jouée avec le MJ automatique.
 *
 * Une aventure est une suite de scènes reliées entre elles. Le MJ automatique
 * les déroule sans IA : il raconte la scène, met en place le plateau, puis
 * attend ce que la scène demande (un vote, un jet de dé, ou un simple
 * « Continuer ») pour passer à la suivante. C'est aussi la base du format des
 * campagnes toutes prêtes (phase H de `PLAN-CAMPAGNES.md`).
 */
import type { CheckStat } from '@/lib/checks'

/** Image de la bibliothèque posée sur le plateau, en fraction du plateau. */
export type ScenePiece = {
  /** Identifiant stable sur le plateau, pour qu'un pion reste le même d'une scène à l'autre. */
  id: string
  /** Catégorie et image de `lib/library.ts`. */
  category: string
  item: string
  x: number
  y: number
  width: number
  height: number
}

export type SceneSetup = {
  /** Carte de fond (catégorie « cartes »). */
  map?: string
  /** Pions et rencontres posés par-dessus. Les pions des joueurs restent en place. */
  pieces?: ScenePiece[]
  /** Rencontre montrée en grand à toute la table à l'arrivée dans la scène. */
  show?: { category: string; item: string; label: string }
  /** Morceau YouTube lancé pour toute la table. */
  music?: string
}

/** Une réponse proposée au vote du groupe. */
export type SceneOption = {
  id: string
  label: string
  next: string
  /** Proposée seulement si l'aventure a déjà gagné cet indice. */
  needs?: string
}

/** Une suite possible d'un tirage au hasard. */
export type RandomOutcome = {
  next: string
  /** Poids dans le tirage (1 par défaut). */
  weight?: number
  /** Possible seulement si l'aventure a déjà gagné cet indice. */
  needs?: string
  /** Possible seulement si l'aventure n'a pas encore cet indice (une rencontre déjà faite ne revient pas). */
  unless?: string
}

/** Ce que la scène attend pour avancer. */
export type SceneStep =
  | { kind: 'continue'; next: string; label?: string }
  /** Comme « Continuer », mais la suite est tirée au hasard : une partie ne se joue jamais deux fois pareil. */
  | { kind: 'random'; outcomes: RandomOutcome[]; label?: string }
  | { kind: 'vote'; prompt: string; options: SceneOption[] }
  | {
      kind: 'check'
      prompt: string
      stat: CheckStat
      dc: number
      /** Phrase courte, rappelée sur la carte du jet (« Convaincre Mila »). */
      reason: string
      success: string
      failure: string
    }
  | { kind: 'end'; title: string }

export type Scene = {
  id: string
  title: string
  /** Acte ou chapitre, affiché au-dessus du titre dans les longues campagnes. */
  chapter?: string
  /** Ce que le MJ raconte, un paragraphe par entrée. */
  narration: string[]
  /** Ce que seul le MJ sait : visible avec « Voir côté MJ ». */
  gmNotes?: string
  setup?: SceneSetup
  /** Indices gagnés en arrivant dans la scène. */
  gains?: string[]
  /** PV perdus par chaque joueur présent à l'arrivée dans la scène. */
  damage?: number
  /** Remet les PV de chacun au maximum (début d'aventure). */
  heal?: boolean
  step: SceneStep
}

export type Adventure = {
  id: string
  title: string
  /** Une phrase pour donner envie, sur la carte de départ. */
  pitch: string
  start: string
  scenes: Record<string, Scene>
}

/** Les textes d'une scène dans une autre langue ; le reste (plateau, suites) ne change pas. */
export type SceneText = {
  title: string
  chapter?: string
  narration: string[]
  gmNotes?: string
  /** Légende de la rencontre montrée en grand. */
  show?: string
  /** Bouton « Continuer » ou du tirage. */
  label?: string
  /** Question du vote ou du jet. */
  prompt?: string
  reason?: string
  /** Réponses du vote, par identifiant. */
  options?: Record<string, string>
  /** Titre de la fin. */
  end?: string
}

export type AdventureText = { title: string; pitch: string; scenes: Record<string, SceneText> }

/**
 * Qui mène l'aventure : le MJ automatique seul, ou le MJ de la table, qui
 * laisse les joueurs voter et tranche lui-même les égalités.
 */
export type AutoGmMode = 'auto' | 'gm'

/** Égalité au vote : le MJ (mode « gm »), sinon le joueur au meilleur Charisme, choisit parmi ces options. */
export type AutoGmTiebreak = { userId: string; name: string; options: string[] }

/** Jet demandé par le MJ automatique pour la scène en cours (`/api/check`). */
export type AutoGmCheck = { id: string; userId: string; name: string; visit: number }

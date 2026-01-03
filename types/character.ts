import { type LiveMap } from '@liveblocks/client'

export type CustomField = { id: string; label: string; value: string }
export type Competence = {
  id: string
  nom: string
  type: string
  effets: string
  degats?: string
}
export type Objet = { id: string; nom: string; quantite: number }

export type Character = {
  id: string
  owner: string
  nom: string
  name?: string
  ownerConnectionId?: number
  updatedAt?: number
  race: string
  classe: string
  sexe: string
  age: number | string
  taille: string
  poids: string
  capacite_raciale: string
  niveau: number | string
  defense?: number | string
  chance?: number | string
  initiative?: number | string
  pv: number | string
  pv_max: number | string
  pvMax?: number | string
  force: number | string
  dexterite: number | string
  constitution: number | string
  intelligence: number | string
  sagesse: number | string
  charisme: number | string
  force_mod?: number | string
  dexterite_mod?: number | string
  constitution_mod?: number | string
  intelligence_mod?: number | string
  sagesse_mod?: number | string
  charisme_mod?: number | string
  mod_contact?: number | string
  mod_distance?: number | string
  mod_magique?: number | string
  bourse: number | string
  armes: string
  armure: string
  degats_armes: string
  modif_armure: number | string
  competences: Competence[]
  objets: Objet[]
  traits: string
  ideal: string
  obligations: string
  failles: string
  avantages: string
  background: string
  champs_perso: CustomField[]
  notes: string
}

export type CharacterLike = Partial<Character> & {
  uuid?: string | number | null
  _id?: string | number | null
  champsPerso?: CustomField[]
}

export type CharacterSelection = { owner: string | null; id: string | null }
export type CharacterChangeHandler = <K extends keyof Character>(
  field: K,
  value: Character[K],
) => void

export const defaultCharacter: Character = {
  id: '',
  owner: '',
  nom: '',
  race: '',
  classe: '',
  sexe: '',
  age: '',
  taille: '',
  poids: '',
  capacite_raciale: '',
  niveau: 1,
  defense: '',
  chance: '',
  initiative: '',
  pv: 10,
  pv_max: 10,
  force: 1,
  dexterite: 1,
  constitution: 1,
  intelligence: 1,
  sagesse: 1,
  charisme: 1,
  force_mod: 0,
  dexterite_mod: 0,
  constitution_mod: 0,
  intelligence_mod: 0,
  sagesse_mod: 0,
  charisme_mod: 0,
  mod_contact: '',
  mod_distance: '',
  mod_magique: '',
  bourse: 0,
  armes: '',
  armure: '',
  degats_armes: '',
  modif_armure: 0,
  competences: [],
  objets: [],
  traits: '',
  ideal: '',
  obligations: '',
  failles: '',
  avantages: '',
  background: '',
  champs_perso: [],
  notes: '',
}

const fallbackId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2))

const coerceNumber = (
  value: unknown,
  fallback: number | string,
): number | string => {
  if (value === '' || value === null || value === undefined) return fallback
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeArray = <T extends { id?: string }>(
  items: T[] | undefined,
): Array<T & { id: string }> =>
  Array.isArray(items)
    ? items.map((item) => ({
        ...item,
        id: item.id ? String(item.id) : fallbackId(),
      }))
    : []

export const getCharacterId = (character: {
  id?: string | number | null
  uuid?: string | number | null
  _id?: string | number | null
}): string => {
  const raw = character.id ?? character.uuid ?? character._id
  return raw ? String(raw) : fallbackId()
}

export const buildCharacterKey = (
  character: Pick<CharacterLike, 'id' | 'owner'>,
): string => {
  const id = getCharacterId(character)
  const owner = character.owner ? String(character.owner) : ''
  return owner ? `${owner}:${id}` : id
}

export const buildSelectionKey = (
  id: string | number | undefined,
  owner?: string | null,
): string => {
  if (!id) return ''
  const ownerStr = owner ? String(owner) : ''
  const idStr = String(id)
  return ownerStr ? `${ownerStr}::${idStr}` : idStr
}

export const parseSelectionKey = (raw: string | null): CharacterSelection => {
  if (!raw) return { owner: null, id: null }
  const [owner, id] = raw.includes('::') ? raw.split('::', 2) : [null, raw]
  return { owner: owner && owner.length ? owner : null, id: id ?? null }
}

export const normalizeCharacter = (
  raw: CharacterLike | null | undefined,
  fallbackOwner?: string | null,
): Character => {
  const base = defaultCharacter
  const id = getCharacterId(raw ?? {})
  const pvMax =
    raw?.pv_max ??
    (raw?.pvMax !== undefined ? raw.pvMax : undefined) ??
    base.pv_max
  const owner =
    raw?.owner ??
    (typeof fallbackOwner === 'string' ? fallbackOwner : base.owner)

  return {
    ...base,
    ...raw,
    id,
    owner: owner ?? '',
    nom: raw?.nom ?? raw?.name ?? base.nom,
    pv_max: coerceNumber(pvMax, base.pv_max),
    pv: coerceNumber(raw?.pv, base.pv),
    niveau: coerceNumber(raw?.niveau, base.niveau),
    bourse: coerceNumber(raw?.bourse, base.bourse),
    modif_armure: coerceNumber(raw?.modif_armure, base.modif_armure),
    force: coerceNumber(raw?.force, base.force),
    dexterite: coerceNumber(raw?.dexterite, base.dexterite),
    constitution: coerceNumber(raw?.constitution, base.constitution),
    intelligence: coerceNumber(raw?.intelligence, base.intelligence),
    sagesse: coerceNumber(raw?.sagesse, base.sagesse),
    charisme: coerceNumber(raw?.charisme, base.charisme),
    mod_contact: coerceNumber(raw?.mod_contact, base.mod_contact ?? ''),
    mod_distance: coerceNumber(raw?.mod_distance, base.mod_distance ?? ''),
    mod_magique: coerceNumber(raw?.mod_magique, base.mod_magique ?? ''),
    force_mod: coerceNumber(raw?.force_mod, base.force_mod ?? ''),
    dexterite_mod: coerceNumber(raw?.dexterite_mod, base.dexterite_mod ?? ''),
    constitution_mod: coerceNumber(
      raw?.constitution_mod,
      base.constitution_mod ?? '',
    ),
    intelligence_mod: coerceNumber(
      raw?.intelligence_mod,
      base.intelligence_mod ?? '',
    ),
    sagesse_mod: coerceNumber(raw?.sagesse_mod, base.sagesse_mod ?? ''),
    charisme_mod: coerceNumber(raw?.charisme_mod, base.charisme_mod ?? ''),
    defense: coerceNumber(raw?.defense, base.defense ?? ''),
    chance: coerceNumber(raw?.chance, base.chance ?? ''),
    initiative: coerceNumber(raw?.initiative, base.initiative ?? ''),
    competences: normalizeArray(raw?.competences),
    objets: normalizeArray(
      (raw?.objets as Array<Objet | (Objet & { quantite?: unknown })>)?.map(
        (o) => ({
          ...o,
          quantite:
            o && 'quantite' in o
              ? Number((o as { quantite?: unknown }).quantite ?? 0)
              : 0,
        }),
      ),
    ),
    champs_perso: normalizeArray(
      raw?.champs_perso ?? raw?.champsPerso ?? base.champs_perso,
    ),
    updatedAt:
      typeof raw?.updatedAt === 'number' ? raw.updatedAt : base.updatedAt,
  }
}

export type CharacterStorage = LiveMap<string, Character>

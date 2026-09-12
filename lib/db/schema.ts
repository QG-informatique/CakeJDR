import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

/**
 * Schéma de la base.
 *
 * L'identité vient de la connexion Google ou Discord : `users.id` est
 * l'identifiant du compte chez ce service, pas une clé générée ici. Cette
 * table porte ce que le service de connexion ne
 * connaît pas — la couleur du joueur, son rôle d'administrateur — et sert de
 * cible aux clés étrangères.
 */
export const users = pgTable('users', {
  /** Service et identifiant chez lui (`google:...`, `discord:...`). */
  id: text('id').primaryKey(),
  /** Nom affiché en jeu, modifiable indépendamment du compte Google ou Discord. */
  pseudo: text('pseudo').notNull(),
  /** Couleur du curseur et du nom dans le chat. */
  color: text('color').notNull().default('#1d4ed8'),
  /** Droits d'administration : remplace le mot de passe admin de la phase 0. */
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

/**
 * Tables de jeu.
 *
 * `id` reprend l'identifiant de la room Liveblocks : les deux systèmes
 * désignent la même partie, autant qu'ils partagent la clé.
 */
export const rooms = pgTable(
  'rooms',
  {
    /** Identifiant de la room Liveblocks. */
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** Créateur de la table, et MJ par défaut. */
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Hash scrypt du mot de passe de table, si elle en a un. */
    passwordHash: text('password_hash'),
    /** Table de démonstration : ouverte à tous, réinitialisée régulièrement. */
    isDemo: boolean('is_demo').notNull().default(false),
    /**
     * Code d'invitation, seul moyen de rejoindre une table.
     * Il n'y a pas d'annuaire public : sans ce code, une table est invisible.
     */
    joinCode: text('join_code').notNull().unique(),
    /**
     * État de référence d'une salle de démonstration.
     *
     * Un visiteur peut tout modifier — dessiner, supprimer les images, éditer
     * la fiche. La salle est ensuite restaurée à partir de cet instantané,
     * pour que le visiteur suivant retrouve la démonstration intacte.
     */
    demoSnapshot: jsonb('demo_snapshot'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('rooms_owner_idx').on(t.ownerId),
    // Sert au nettoyage des tables abandonnées.
    index('rooms_last_active_idx').on(t.lastActiveAt),
  ],
)

/**
 * Appartenance d'un joueur à une table.
 * C'est ce qui permettra de ne montrer à chacun que ses propres tables.
 */
export const roomMembers = pgTable(
  'room_members',
  {
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** `gm` ou `player`. Le créateur est `gm`. */
    role: text('role').notNull().default('player'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.userId] }),
    index('room_members_user_idx').on(t.userId),
  ],
)

/**
 * Fiches de personnage.
 *
 * Le contenu reste en JSON : sa forme dépendra du modèle de fiche défini par
 * chaque table (phase 3), donc figer des colonnes ici serait prématuré.
 */
export const characters = pgTable(
  'characters',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Une fiche peut exister hors d'une table, dans le menu du joueur. */
    roomId: text('room_id').references(() => rooms.id, { onDelete: 'set null' }),
    name: text('name').notNull().default(''),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('characters_owner_idx').on(t.ownerId),
    index('characters_room_idx').on(t.roomId),
  ],
)

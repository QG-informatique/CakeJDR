/**
 * Adopte la salle existante comme salle de démonstration.
 *
 * À usage unique : la salle avait été créée avant l'existence de la base, elle
 * n'y avait donc ni propriétaire ni code d'invitation.
 *
 *   node scripts/adopt-demo-room.mjs
 */
import { neon } from '@neondatabase/serverless'
import { randomBytes } from 'node:crypto'

const ROOM = process.env.DEMO_ROOM_ID
const OWNER_ID = process.env.DEMO_OWNER_ID

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const code = [...randomBytes(6)].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')

const sql = neon(process.env.DATABASE_URL)

await sql`
  insert into rooms (id, name, owner_id, is_demo, join_code)
  values (${ROOM}, 'Salle de démonstration', ${OWNER_ID}, true, ${code})
  on conflict (id) do update set is_demo = true, name = 'Salle de démonstration'
`
await sql`
  insert into room_members (room_id, user_id, role)
  values (${ROOM}, ${OWNER_ID}, 'gm')
  on conflict do nothing
`
const row = await sql`select join_code, is_demo, name from rooms where id = ${ROOM}`
console.log('Salle adoptee :', row[0].name, '| code :', row[0].join_code, '| demo :', row[0].is_demo)

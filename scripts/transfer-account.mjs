/**
 * Transfère un compte vers un nouvel identifiant : tables possédées,
 * appartenances, fiches, pseudo, couleur et droit d'administrateur.
 *
 * Écrit pour le passage de Clerk à Auth.js : les identifiants de compte ont
 * changé (`user_...` devient `google:...` ou `discord:...`). Se connecter une
 * première fois avec le nouveau compte, pour qu'il existe en base, puis :
 *
 *   node --env-file=.env.local scripts/transfer-account.mjs <ancien> <nouveau>
 *
 * Sans argument, liste les comptes existants.
 */
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)
const [from, to] = process.argv.slice(2)

if (!from || !to) {
  console.log('Comptes en base :')
  for (const u of await sql`select id, pseudo, is_admin from users order by created_at`) {
    console.log(`  ${u.id}  ${u.pseudo}${u.is_admin ? '  (admin)' : ''}`)
  }
  console.log('\nUsage : node --env-file=.env.local scripts/transfer-account.mjs <ancien> <nouveau>')
  process.exit(0)
}

const [old] = await sql`select pseudo, color, is_admin from users where id = ${from}`
if (!old) {
  console.error(`Ancien compte introuvable : ${from}`)
  process.exit(1)
}
const [target] = await sql`select id from users where id = ${to}`
if (!target) {
  console.error(`Nouveau compte introuvable : ${to}. Connecte-toi une fois avec, puis relance.`)
  process.exit(1)
}

// Tout ou rien : un transfert à moitié fait laisserait des tables sans MJ.
await sql.transaction([
  sql`update users set pseudo = ${old.pseudo}, color = ${old.color}, is_admin = ${old.is_admin} where id = ${to}`,
  sql`update rooms set owner_id = ${to} where owner_id = ${from}`,
  sql`insert into room_members (room_id, user_id, role)
      select room_id, ${to}, role from room_members where user_id = ${from}
      on conflict (room_id, user_id) do update set role = excluded.role`,
  sql`delete from room_members where user_id = ${from}`,
  // La clé d'une fiche est `<compte>:<fiche>` : on remplace le préfixe.
  sql`update characters set owner_id = ${to}, id = ${to} || substr(id, length(${from}) + 1)
      where owner_id = ${from}`,
  sql`delete from users where id = ${from}`,
])

const [after] = await sql`select pseudo, is_admin from users where id = ${to}`
const [{ n: rooms }] = await sql`select count(*)::int as n from room_members where user_id = ${to}`
console.log(`Transfert fait : ${after.pseudo}${after.is_admin ? ' (admin)' : ''}, ${rooms} table(s).`)

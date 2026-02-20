// src/app/api/rooms/verify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import crypto from "node:crypto";

type LiveblocksMetadata = Record<string, string | string[] | null>;

type RoomMetadata = Record<string, unknown> & {
  password?: string | null;
  passwordHash?: string | null;
  hasPassword?: boolean | string;
};

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const SAFE_METADATA_KEY = /^[a-zA-Z0-9:_-]{1,64}$/;
const BLOCKED_METADATA_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
]);

function isSafeMetadataKey(key: string) {
  return SAFE_METADATA_KEY.test(key) && !BLOCKED_METADATA_KEYS.has(key);
}

function sanitizeMetadata(meta: RoomMetadata): LiveblocksMetadata {
  const entries: Array<[string, string | string[] | null]> = [];
  for (const [key, value] of Object.entries(meta)) {
    if (key === "password" || key === "passwordHash" || key === "hasPassword") {
      continue;
    }
    if (!isSafeMetadataKey(key)) {
      continue;
    }
    if (typeof value === "string") {
      entries.push([key, value]);
    } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      entries.push([key, value]);
    }
  }
  const passwordHash =
    typeof meta.passwordHash === "string" && meta.passwordHash.length
      ? meta.passwordHash
      : null;
  const hasPassword =
    meta.hasPassword === true || meta.hasPassword === "1" || meta.hasPassword === "true"
      ? "1"
      : null;
  if (passwordHash) entries.push(["passwordHash", passwordHash]);
  if (hasPassword) entries.push(["hasPassword", hasPassword]);
  return Object.fromEntries(entries) as LiveblocksMetadata;
}

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const password = String(body?.password || "");

    if (!id) return bad("Missing id");
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) return bad("Server misconfigured", 500);

    const lb = new Liveblocks({ secret });
    const room = await lb.getRoom(id).catch(() => null);
    if (!room) return bad("Room not found", 404);

    const meta = ((room as { metadata?: RoomMetadata })?.metadata ?? {}) as RoomMetadata;
    const storedPlain = typeof meta.password === "string" && meta.password.length ? meta.password : null;
    let storedHash = typeof meta.passwordHash === "string" && meta.passwordHash.length ? meta.passwordHash : null;
    const hasPassword =
      !!storedPlain ||
      !!storedHash ||
      meta.hasPassword === true ||
      meta.hasPassword === "1" ||
      meta.hasPassword === "true";

    // Pas de mot de passe -> acces OK
    if (!hasPassword) return NextResponse.json({ ok: true, guarded: false });

    if (!password) return bad("Invalid password", 401);
    const hashedInput = sha256(password);

    // Verifie le hash et migre les anciens mots de passe en clair
    let ok = false;
    if (storedHash && hashedInput === storedHash) {
      ok = true;
    } else if (storedPlain && password === storedPlain) {
      ok = true;
      storedHash = sha256(storedPlain);
      const nextMeta = sanitizeMetadata(meta);
      nextMeta.passwordHash = storedHash;
      nextMeta.hasPassword = "1";
      try {
        await lb.updateRoom(id, { metadata: nextMeta });
      } catch {
        // best-effort; on ne bloque pas l'utilisateur
      }
    }

    if (!ok) return bad("Invalid password", 401);

    return NextResponse.json({ ok: true, guarded: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "verify failed";
    return bad(message, 500);
  }
}

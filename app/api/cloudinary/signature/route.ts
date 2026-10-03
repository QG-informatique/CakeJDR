export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { currentUserId } from "@/lib/db/users";

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const FOLDER = "cakejdr";

/**
 * Formats signés avec l'upload : Cloudinary rejette tout autre fichier, et le
 * client ne peut pas retirer ce paramètre sans invalider la signature.
 */
const ALLOWED_FORMATS = "png,jpg,jpeg,webp,gif";

/**
 * Cette route délivre de quoi téléverser directement chez Cloudinary. Elle est
 * réservée aux comptes connectés (les visiteurs ne jouent que dans la salle de
 * démo), limitée en débit par compte, et la signature fige le dossier et les
 * formats. La taille n'est pas un paramètre d'upload chez Cloudinary : elle
 * reste bornée par le plafond du compte Cloudinary et la vérification côté
 * client.
 */
const SIGN_LIMIT = 20;
const SIGN_WINDOW_MS = 10 * 60 * 1000;

function bad(msg: string, code = 500) {
  return NextResponse.json({ error: msg }, { status: code });
}

function resolveCloudinaryConfig() {
  let cloudName = CLOUD_NAME;
  let apiKey = API_KEY;
  let apiSecret = API_SECRET;

  if (CLOUDINARY_URL) {
    try {
      const parsed = new URL(CLOUDINARY_URL);
      if (!cloudName) cloudName = parsed.hostname;
      if (!apiKey) apiKey = decodeURIComponent(parsed.username);
      if (!apiSecret) apiSecret = decodeURIComponent(parsed.password);
    } catch {
      // ignore invalid CLOUDINARY_URL
    }
  }

  return { cloudName, apiKey, apiSecret };
}

function signUpload(
  params: Record<string, string | number>,
  apiSecret: string,
) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function POST(req: NextRequest) {
  const userId = await currentUserId();
  if (!userId) return bad("sign in required", 401);

  const limit = rateLimit(`cloudinary-sign:${userId}:${clientIp(req)}`, SIGN_LIMIT, SIGN_WINDOW_MS);
  if (!limit.allowed) {
    const res = NextResponse.json({ error: "too many requests" }, { status: 429 });
    res.headers.set("Retry-After", String(limit.retryAfter));
    return res;
  }

  const { cloudName, apiKey, apiSecret } = resolveCloudinaryConfig();
  if (!cloudName) return bad("Missing CLOUDINARY_CLOUD_NAME env", 500);
  if (!apiKey || !apiSecret) {
    return bad("Missing CLOUDINARY_API_KEY/SECRET env", 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signUpload(
    { allowed_formats: ALLOWED_FORMATS, folder: FOLDER, timestamp },
    apiSecret,
  );

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: FOLDER,
    allowedFormats: ALLOWED_FORMATS,
  });
}

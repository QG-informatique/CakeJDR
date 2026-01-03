// src/app/api/cloudinary/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  process.env.CLOUDINARY_UPLOAD_PRESET ||
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
  "CakeJDR-DU6-image"; // preset non signe, aligne sur le client

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

// Construit une URL Cloudinary de delivery avec transformations
function buildDeliveryUrl(publicId: string, transform: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`;
}

export async function POST(req: Request) {
  try {
    if (!CLOUD_NAME) return bad("Missing CLOUDINARY_CLOUD_NAME env", 500);
    if (!UPLOAD_PRESET) return bad("Missing CLOUDINARY_UPLOAD_PRESET env", 500);

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) return bad("No file field named 'file'");
    if (file.size <= 0) return bad("Empty file");
    if (file.size > MAX_BYTES) return bad(`File too large (max ${Math.round(MAX_BYTES / (1024 * 1024))}MB)`);
    if (file.type && !ALLOWED_TYPES.has(file.type)) return bad(`Unsupported file type: ${file.type}`);

    // Upload non signe (pas d'option 'eager' autorisee ici)
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", UPLOAD_PRESET);
    cloudForm.append("folder", "cakejdr");

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const res = await fetch(url, { method: "POST", body: cloudForm });
    const data = await res.json();

    if (!res.ok) {
      return bad(data?.error?.message || "Cloudinary upload failed", res.status);
    }

    const publicId: string = data.public_id;

    // Delivery URLs optimisees (generees a la demande par le CDN)
    const deliveryUrl = buildDeliveryUrl(
      publicId,
      "f_auto,q_auto:good,c_limit,w_1600,dpr_auto"
    );
    const thumbUrl = buildDeliveryUrl(
      publicId,
      "f_auto,q_auto:eco,c_limit,w_64,e_blur:1000"
    );

    return NextResponse.json({
      ok: true,
      url: data.secure_url || data.url,
      deliveryUrl,
      thumbUrl,
      public_id: publicId,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      format: data.format,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Upload error";
    return bad(message, 500);
  }
}

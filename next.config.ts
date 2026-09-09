import type { NextConfig } from "next";

/**
 * En-têtes de sécurité.
 *
 * La CSP autorise exactement les origines dont l'application a besoin :
 * Liveblocks (temps réel, en HTTPS et WebSocket), Cloudinary (images du
 * canvas), Vercel Blob (fiches de personnage), YouTube (lecteur musique) et
 * Google Fonts. Tout le reste est refusé.
 *
 * `'unsafe-inline'` sur les styles est nécessaire : Next injecte des styles
 * en ligne, et Tailwind en produit à l'exécution. `'unsafe-eval'` n'est
 * autorisé qu'en développement, où le rechargement à chaud en dépend.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.youtube.com https://s.ytimg.com https://*.clerk.accounts.dev https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.public.blob.vercel-storage.com https://i.ytimg.com https://img.youtube.com https://img.clerk.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://api.liveblocks.io wss://api.liveblocks.io https://api.cloudinary.com https://*.public.blob.vercel-storage.com https://res.cloudinary.com https://*.clerk.accounts.dev https://clerk-telemetry.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS n'a de sens qu'en HTTPS : l'activer en local casserait le dev.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

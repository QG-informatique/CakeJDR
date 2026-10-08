import type { NextConfig } from "next";

/**
 * En-têtes de sécurité.
 *
 * La CSP autorise exactement les origines dont l'application a besoin :
 * Liveblocks (temps réel, en HTTPS et WebSocket), Cloudinary (images du
 * canvas), YouTube (lecteur musique) et
 * Google Fonts. Tout le reste est refusé.
 *
 * `'unsafe-inline'` sur les styles est nécessaire : Next injecte des styles
 * en ligne, et Tailwind en produit à l'exécution. `'unsafe-eval'` n'est
 * autorisé qu'en développement, où le rechargement à chaud en dépend.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // En local (http), le lecteur YouTube charge son script en http lui aussi.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' http://www.youtube.com" : ""} https://www.youtube.com https://s.ytimg.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://i.ytimg.com https://img.youtube.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "connect-src 'self' https://api.liveblocks.io wss://api.liveblocks.io https://api.cloudinary.com https://res.cloudinary.com",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
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
  // Anciennes adresses de la page des salles, encore dans des favoris.
  async redirects() {
    return [
      { source: "/menu", destination: "/salles", permanent: true },
      { source: "/menu-accueil", destination: "/salles", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

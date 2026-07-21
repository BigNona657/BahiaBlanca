const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",

  workboxOptions: {
    disableDevLogs: true,

    // Estrategias de caché por tipo de recurso
    runtimeCaching: [
      // Páginas HTML — Network First: siempre intenta la red, cae al caché si offline
      {
        urlPattern: /^https:\/\/.*\/$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "bignona-pages",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }, // 1 día
          networkTimeoutSeconds: 10,
        },
      },
      // Imágenes de productos (externas, ej: URLs de Cloudinary/Unsplash)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "bignona-images",
          expiration: { maxEntries: 128, maxAgeSeconds: 7 * 24 * 60 * 60 }, // 7 días
        },
      },
      // Fuentes de Google
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "bignona-fonts",
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 año
        },
      },
      // API de NextAuth — Network Only (nunca cachear sesiones)
      {
        urlPattern: /\/api\/auth\/.*/i,
        handler: "NetworkOnly",
      },
      // Resto de APIs — Network First con fallback
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "bignona-api",
          expiration: { maxEntries: 32, maxAgeSeconds: 60 }, // 1 minuto
          networkTimeoutSeconds: 8,
        },
      },
      // Assets estáticos JS/CSS — Stale While Revalidate
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "bignona-static",
          expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

module.exports = withPWA(nextConfig);

import type { NextConfig } from "next";

/* A dónde habla el servidor de Next con la API de Go. En desarrollo es el backend local; en
   Docker, el nombre del contenedor en la red interna. */
const API_INTERNA = (process.env.API_URL_INTERNA ?? "http://localhost:8080").replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  // Empaqueta el servidor con sólo las dependencias que usa: la imagen de Docker pesa decenas de
  // megas en vez de arrastrar node_modules entero.
  output: "standalone",

  /* El navegador siempre llama a /api del mismo origen y Next lo reenvía a Go. Cero CORS y cero
     dominio de la API incrustado en el paquete. En producción, si un proxy (Caddy) ya manda /api
     al backend, esta regla ni se llega a usar. */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_INTERNA}/api/:path*` }];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Las fotos del club viven hoy en el CDN del sitio anterior. Hay que copiarlas a /public
    // antes de apagar ese sitio (ver README).
    remotePatterns: [
      { protocol: "https", hostname: "assets.zyrosite.com", pathname: "/**" },
      { protocol: "https", hostname: "cdn.zyrosite.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

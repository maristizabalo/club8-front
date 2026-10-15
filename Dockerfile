# Imagen del frontend — Billares Club 8 (Next.js 16 / React 19 / App Router, salida standalone).
#
# El contexto de build TIENE QUE SER esta carpeta: de aquí se lee el .dockerignore que impide que
# un .env local entre en la imagen.
#
# La compilación necesita internet: next/font descarga Archivo para auto-hospedarla.
#
# API_URL_INTERNA se fija al compilar porque la regla que reenvía /api a Go (next.config.ts) queda
# escrita en el manifiesto de rutas. En el compose, el nombre del contenedor del backend.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ── Dependencias: capa aparte, sólo se rehace si cambia el lockfile ──
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── Compilación ──
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG API_URL_INTERNA=http://club8-back:8080
ARG NEXT_PUBLIC_SITIO_URL=https://billaresclub8.com
ENV API_URL_INTERNA=${API_URL_INTERNA} \
    NEXT_PUBLIC_SITIO_URL=${NEXT_PUBLIC_SITIO_URL} \
    NODE_ENV=production
RUN npm run build

# ── Imagen final: el servidor standalone y sus estáticos, sin node_modules completo ──
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

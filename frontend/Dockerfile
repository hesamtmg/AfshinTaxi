# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
# Nuxt public runtimeConfig values (NUXT_PUBLIC_*) are read at server start,
# not baked in here, so no build ARGs are needed for them.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runtime image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

RUN addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001

COPY --from=builder /app/.output ./.output

USER nuxt

EXPOSE 3001

CMD ["node", ".output/server/index.mjs"]

FROM node:20-alpine AS base

# 1. Pasang dependensi
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Bangun aplikasi
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 3. Runner produksi
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3210

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3210
CMD ["npm", "start"]

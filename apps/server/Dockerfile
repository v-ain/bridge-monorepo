# === ЭТАП 1: Сборочный цех ===
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

RUN npm ci --workspace=@bridge-monorepo/shared --workspace=@bridge-monorepo/server

COPY packages/shared/ ./packages/shared/
RUN npm run build:shared

COPY apps/server/ ./apps/server/

# === ЭТАП 2: Чистый продакшен ===
FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci --omit=dev --workspace=@bridge-monorepo/shared --workspace=@bridge-monorepo/server

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server ./apps/server

EXPOSE 3000
CMD ["node", "apps/server/server.js"]

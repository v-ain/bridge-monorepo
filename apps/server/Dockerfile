# === ЭТАП 1: Сборочный цех (без изменений) ===
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

RUN npm ci --workspace=@bridge-monorepo/shared --workspace=@bridge-monorepo/server --ignore-scripts

COPY packages/shared/ ./packages/shared/
RUN npm run build:shared


# === ЭТАП 2: Безопасный и быстрый продакшен ===
FROM node:22-alpine

# Устанавливаем tini для правильной обработки системных сигналов (PID 1)
RUN apk add --no-cache tini

WORKDIR /app

# Копируем манифесты
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

# Ставим только продакшен-зависимости
RUN npm ci --omit=dev --workspace=@bridge-monorepo/server --ignore-scripts 

# Переносим скомпилированный код shared и исходники сервера
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/server/ ./apps/server/

# Смена владельца файлов на безопасного пользователя 'node'
RUN chown -R node:node /app

# Переключаемся на безопасного пользователя (все команды ниже и сам старт будут от него)
USER node

EXPOSE 3000

# Запускаем через tini для Graceful Shutdown
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/server/server.js"]

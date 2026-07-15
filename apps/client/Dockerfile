# === ЭТАП 1: Сборка Webpack-бандла ===
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/client/package*.json ./apps/client/

RUN npm ci --workspace=@bridge-monorepo/shared --workspace=@bridge-monorepo/client

COPY packages/shared/ ./packages/shared/
RUN npm run build:shared

COPY apps/client/ ./apps/client/
RUN npm run build --workspace=@bridge-monorepo/client

# === ЭТАП 2: Раздача через Nginx ===
FROM nginx:stable-alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

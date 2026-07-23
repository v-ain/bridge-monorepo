# === ЭТАП 1: Сборка Webpack-бандла ===
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/client/package*.json ./apps/client/

RUN npm ci --workspace=@bridge-monorepo/shared --workspace=@bridge-monorepo/client --ignore-scripts

COPY packages/shared/ ./packages/shared/
RUN npm run build:shared

COPY apps/client/ ./apps/client/
RUN npm run build --workspace=@bridge-monorepo/client --ignore-scripts


# === ЭТАП 2: Максимально оптимизированная раздача через Nginx ===
FROM nginx:stable-alpine

# 1. Создаем правильный конфиг для SPA-роутинга и кэширования статики
RUN echo $' \n\
server { \n\
    listen 80; \n\
    server_name localhost; \n\
\n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
\n\
    # Агрессивное кэширование для JS, CSS и картинок (хэшированные файлы Webpack) \n\
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ { \n\
        root /usr/share/nginx/html; \n\
        expires 1y; \n\
        access_log off; \n\
        add_header Cache-Control "public, no-transform"; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

# 2. Копируем собранную статику из билдера
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# 3. Настраиваем права безопасности (файлы должны принадлежать пользователю nginx)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

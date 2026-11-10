# Contexto de build: la raíz del repositorio (docker build -f frontend/Dockerfile .).
FROM python:3.12-slim AS fotos
WORKDIR /app
COPY backend/descargar_fotos_demo.py backend/fotos_demo.json ./backend/
RUN python backend/descargar_fotos_demo.py

FROM node:24-slim AS build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
COPY --from=fotos /app/frontend/public/fotos-demo/ ./public/fotos-demo/
RUN npm run build

FROM caddy:2-alpine
COPY frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/frontend/dist/frontend/browser/ /srv/
ENV PORT=8080
EXPOSE 8080

# MyTime MVP

Monorepo con Angular + NestJS + MongoDB para seguimiento de horas de estudio y Pomodoro.

## Setup

1. Copiá `.env.example` a `backend/.env` y completá secretos.
2. Levantá MongoDB con `docker compose up -d`.
3. Instalá dependencias con `pnpm install`.
4. Ejecutá `pnpm dev:backend` y `pnpm dev:frontend`.

## Scripts

- `pnpm dev`
- `pnpm dev:frontend`
- `pnpm dev:backend`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`

## Auth

- Access token en memoria desde Angular.
- Refresh token en cookie `httpOnly` rotativa.
- Logout invalida refresh almacenado.

## Docker

`docker compose up -d`

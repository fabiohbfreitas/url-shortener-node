# shrt

URL shortener with email-code auth. Built with Node.js 24, Fastify, MongoDB, React 19, and Tailwind v4.

## Tech Stack

- **Backend:** Fastify, MongoDB 8, Zod, oxlint + oxfmt
- **Frontend:** React 19, React Router v7, Zustand, TanStack React Query, Tailwind v4

## Quick Start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
docker compose -f apps/backend/docker-compose.yml up -d
pnpm --filter @url-shortener/backend dev
pnpm --filter @url-shortener/frontend dev
```

- API docs: `http://localhost:3000/docs`
- Frontend: `http://localhost:5173`
- Mongo Express: `http://localhost:8081` (admin/pass)

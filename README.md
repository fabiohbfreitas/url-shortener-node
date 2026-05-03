# URL Shortener

URL shortener with email-code auth and short links per user. Built with Node.js 24, Fastify, and MongoDB.

## Tech Stack

- Node.js 24+, Fastify, MongoDB 8 (native driver)
- Email-code auth with sessions, Scalar API docs
- Zod validation, oxlint + oxfmt

## Quick Start

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env
docker compose -f apps/backend/docker-compose.yml up -d
pnpm --filter @url-shortener/backend dev
```

Endpoints: `http://localhost:3000/docs`, Mongo Express: `http://localhost:8081` (admin/pass)

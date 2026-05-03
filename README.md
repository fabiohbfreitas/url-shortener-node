# URL Shortener API

Node.js 24 + Fastify + MongoDB 8 with JWT auth and short links per user.

## Tech Stack

- Node.js 24+, Fastify, MongoDB 8 with papr
- JWT email-code auth, Scalar API docs
- oxlint + oxfmt

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

Endpoints: `http://localhost:3000/docs`, Mongo Express: `http://localhost:8081` (admin/pass)

## Scripts

- `npm run dev` - dev mode
- `npm test` - tests (in-memory, no MongoDB)
- `npm run lint` - lint

# URL Shortener API

Node.js 24 + Fastify + MongoDB 8 with email-code auth and short links per user.

## Tech Stack

- Node.js 24+, Fastify, MongoDB 8 (native driver)
- Email-code auth (magic link style), Scalar API docs
- Zod validation, oxlint + oxfmt

## Quick Start

```bash
npm install
cp .env.example .env
docker compose up -d
npm run dev
```

Endpoints: `http://localhost:3000/docs`, Mongo Express: `http://localhost:8081` (admin/pass)

## Scripts

- `npm run dev`
- `npm test`
- `npm run lint`
- `npm run format`
- `npm run build`
- `npm start`

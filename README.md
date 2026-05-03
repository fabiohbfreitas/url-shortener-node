# URL Shortener API

Node.js 24 + Fastify + MongoDB with JWT auth, short links per user, and Scalar API docs.

## Tech Stack

- Node.js 24+ (built-in `node:sqlite`)
- Fastify with `fastify-zod-openapi`
- MongoDB with `papr` ODM
- JWT email-code authentication
- Scalar API reference with JWT auth UI

## Project Structure

```
src/
├── domain/        # Types and Zod schemas
├── services/       # Application logic
├── infrastructure/  # Database and external concerns
├── routes/         # HTTP handlers (thin)
└── plugins/        # Fastify plugins
```

## Requirements

- Node.js 24+
- npm 10+
- MongoDB 8

## Scripts

- `npm run dev` - run with watch mode
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server
- `npm test` - run tests
- `npm run lint` - lint with oxlint
- `npm run format` - format with oxfmt

## Run Locally

```bash
npm install
cp .env.example .env
docker compose up -d  # Start MongoDB
npm run dev
```

Endpoints:

- API: `http://localhost:3000`
- Health: `GET /health`
- Docs: `GET /docs`
- OpenAPI: `GET /openapi.json`

## Auth Flow

1. `POST /auth/login` with `{ "email": "user@example.com" }` - receives code (logged to console during development)
2. `POST /auth/login/verify` with `{ "email": "...", "code": "123456" }` - returns JWT
3. Use JWT in `Authorization: Bearer <token>` header for protected routes

## Testing

Tests use Vitest with in-memory MongoDB (mongodb-memory-server).

```bash
npm test
```

## Docker

Start MongoDB for development (avoids rebuilding image):

```bash
docker compose up -d
```

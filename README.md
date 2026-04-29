# URL Shortener API Bootstrap

Node.js 24 LTS + TypeScript + Fastify baseline with:

- OpenAPI generation
- Scalar API docs
- Structured request logging
- Zod schemas shared across validation and docs

## Requirements

- Node.js 24+
- npm 10+

## Scripts

- `npm run dev` - run with watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server
- `npm run typecheck` - type check without emitting
- `npm test` - run tests once with Vitest
- `npm run test:watch` - run Vitest in watch mode

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Configured endpoints (from `.env`):

- API base: `http://localhost:3000`
- Health: `GET /health`
- OpenAPI JSON: `GET /openapi.json`
- Swagger UI: `GET /swagger`
- Scalar docs: `GET /docs`

> The server now relies on `.env` values (validated with Zod) and does not use built-in defaults.

## Testing

Tests use Vitest plus Fastify's in-process `app.inject()` helpers, so no network port binding is required.

```bash
npm test
```

## Container deployment

Build and run:

```bash
docker build -t url-shortener:distroless .
docker run --rm -p 3000:3000 --env-file .env url-shortener:distroless
```

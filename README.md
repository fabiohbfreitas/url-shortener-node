# URL Shortener API Bootstrap

Node.js 24 LTS + TypeScript + Fastify baseline with:

- OpenAPI generation (`@fastify/swagger` + `fastify-zod-openapi`)
- Scalar API docs (`@scalar/fastify-api-reference`)
- Structured request logging (`evlog/fastify`)
- Zod schemas shared across validation and docs

## Requirements

- Node.js 24+
- npm 10+

## Scripts

- `npm run dev` - run with watch mode
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server
- `npm run typecheck` - type check without emitting
- `npm test` - run Node test runner

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

## Why

The project needs a modern, typed HTTP API foundation that is fast to start with and easy to evolve safely. Establishing Node.js 24 LTS + TypeScript + Fastify with OpenAPI-first documentation now enables consistent API development and schema reuse from day one.

## What Changes

- Initialize a new Node.js 24 LTS service baseline with TypeScript configured for backend development.
- Add a Fastify server scaffold with health endpoint and typed route patterns.
- Add OpenAPI generation and Scalar documentation UI integrated with Fastify.
- Add schema-driven contracts using Zod and wire them into both request/response validation and OpenAPI output consumed by Scalar.
- Add structured request-scoped logging using `evlog/fastify` with wide-event context enrichment and structured error metadata.
- Validate runtime configuration with Zod and require explicit `.env` values (no in-code defaults), using Node's native env-file loading.
- Pin initial dependencies based on current npm latest versions researched during proposal creation:
  - `typescript@6.0.3`
  - `fastify@5.8.5`
  - `@fastify/swagger@9.7.0`
  - `@fastify/swagger-ui@5.2.6` (optional local Swagger UI fallback)
  - `@scalar/fastify-api-reference@1.53.1`
  - `zod@4.3.6`
  - `fastify-type-provider-zod@6.1.0`
  - `fastify-zod-openapi@5.6.1`
  - `evlog@2.14.0`

## Capabilities

### New Capabilities
- `node-ts-service-bootstrap`: Node.js 24 LTS + TypeScript project foundation with scripts, strict typing, and build/run workflow.
- `fastify-api-server`: Fastify server bootstrap with typed route registration and baseline operational endpoint(s).
- `openapi-scalar-docs-with-zod`: OpenAPI document generation from Zod-backed route schemas and Scalar UI publication from the generated spec.
- `fastify-structured-logging`: Request-scoped structured logging with `request.log`/`useLogger()`, wide events, and structured error fields.

### Modified Capabilities
- None.

## Impact

- Affects project setup, runtime scripts, and dependency graph.
- Introduces OpenAPI documentation surface (`/openapi.json` and Scalar docs route).
- Establishes contract-first API development via shared Zod schemas for validation and docs generation.
- Adds structured observability baseline with request-context aggregation and explicit error metadata (`why`, `fix`, `link`).

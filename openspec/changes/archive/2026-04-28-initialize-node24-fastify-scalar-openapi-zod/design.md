## Context

The repository is introducing a backend API foundation rather than iterating on an existing service contract. The change needs a production-aligned baseline stack (Node.js 24 LTS, TypeScript, Fastify), a documentation surface that developers can use immediately (Scalar), and a single schema source that drives both runtime validation and OpenAPI output (Zod-based definitions). Dependency versions are selected from current npm latest values captured during this proposal workflow.

## Goals / Non-Goals

**Goals:**
- Establish a clean Node.js 24 LTS + TypeScript project baseline with strict typing and standard scripts.
- Bootstrap a Fastify server structure that supports typed routes and plugin-based composition.
- Generate OpenAPI from route schemas and publish docs via Scalar in the same service.
- Use Zod-backed schemas as the canonical contract for validation and documentation.
- Establish structured request-scoped logging with progressive context capture and structured error output.

**Non-Goals:**
- Implementing business-domain endpoints beyond baseline sample/health routes.
- Designing authentication/authorization, persistence, or multi-service architecture.
- Committing to long-term version pinning policy beyond initial initialization.
- Shipping remote log-drain infrastructure in this initialization phase.

## Decisions

1. **Runtime and language baseline: Node.js 24 LTS + TypeScript latest**
   - **Decision:** Target Node.js 24 LTS and TypeScript `6.0.3`.
   - **Rationale:** Delivers current LTS runtime stability with up-to-date typing and compiler improvements.
   - **Alternatives considered:** Older Node LTS and TypeScript 5.x were rejected to avoid immediate upgrade churn.

2. **Web framework: Fastify 5**
   - **Decision:** Use Fastify `5.8.5` as the HTTP server and plugin container.
   - **Rationale:** Fast startup and throughput with mature schema/validation ecosystem.
   - **Alternatives considered:** Express and Hono; rejected because Fastify has tighter OpenAPI and typed-schema integration for this use case.

3. **Schema-first approach: Zod integrated with Fastify and OpenAPI**
   - **Decision:** Define request/response contracts using Zod (`4.3.6`) and connect via `fastify-type-provider-zod` (`6.1.0`) and `fastify-zod-openapi` (`5.6.1`).
   - **Rationale:** One schema source powers runtime validation and generated API docs, reducing drift.
   - **Alternatives considered:** JSON Schema authored manually; rejected because dual maintenance burden is higher.

4. **Documentation UI: Scalar with generated OpenAPI**
   - **Decision:** Publish API docs using `@scalar/fastify-api-reference` (`1.53.1`) over generated OpenAPI from `@fastify/swagger` (`9.7.0`).
   - **Rationale:** Modern, fast API reference UX while preserving OpenAPI portability (`/openapi.json`).
   - **Alternatives considered:** Swagger UI-only (`@fastify/swagger-ui`); kept optional as fallback but not primary docs UI.

5. **Plugin and route organization**
   - **Decision:** Keep bootstrap minimal but structured (server factory, plugin registration, route modules).
   - **Rationale:** Enables straightforward extension without refactoring core startup flow.
   - **Alternatives considered:** Single-file server; rejected due to poor scalability as endpoints grow.

6. **Structured logging baseline: evlog Fastify integration**
   - **Decision:** Initialize `evlog` (`2.14.0`) at startup and register `evlog/fastify` so handlers can use `request.log` and service code can use `useLogger()` for request-scoped context.
   - **Rationale:** Produces one wide event per request with layered context while preserving explicit structured error metadata (`why`, `fix`, `link`) for operator troubleshooting.
   - **Alternatives considered:** Fastify default pino-only setup; rejected as primary approach because it does not provide the same request-scoped wide-event workflow and structured error conventions from the provided logging guidance.

7. **Environment configuration strategy**
   - **Decision:** Validate required runtime configuration via Zod and require explicit `.env` values for host, port, service, and docs paths (no in-code fallback defaults).
   - **Rationale:** Fails fast on missing/invalid configuration and keeps behavior deterministic across environments.
   - **Alternatives considered:** Implicit defaults in code and optional dotenv package loading; rejected to avoid hidden behavior and dependency overhead when Node's native env-file loading is available.

8. **Logging behavior defaults**
   - **Decision:** Keep `evlog/fastify` registration minimal with default behavior in the bootstrap.
   - **Rationale:** Reduces initial integration complexity and avoids premature logging policy surface.
   - **Alternatives considered:** Exposing include/exclude/tail-sampling hooks in initial bootstrap; deferred until operational requirements demand those controls.

## Risks / Trade-offs

- **[Version recency risk]** Latest package versions may introduce ecosystem incompatibilities → **Mitigation:** lock versions and verify compatibility during implementation with targeted startup/type checks.
- **[Schema adapter mismatch risk]** Zod-to-OpenAPI adapters can differ in supported constructs → **Mitigation:** constrain initial schemas to supported primitives/patterns and document unsupported patterns.
- **[Tooling complexity risk]** Combining Fastify + Zod + OpenAPI + Scalar increases initial setup surface → **Mitigation:** keep first implementation narrow (health/sample routes) and codify reusable schema/route patterns.
- **[Logger semantics risk]** Team may confuse `request.log` (evlog) with Fastify server logger (`fastify.log`) → **Mitigation:** document usage conventions and provide one reference route/service example using `log.set()`.
- **[Log volume risk]** Wide-event enrichment can increase payload size/noise → **Mitigation:** define clear context keys and keep default logging setup minimal until stricter policies are required.

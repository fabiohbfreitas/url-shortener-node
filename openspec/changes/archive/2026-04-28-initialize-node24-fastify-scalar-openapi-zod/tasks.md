## 1. Project Bootstrap

- [x] 1.1 Initialize Node.js project metadata and set engine/runtime target to Node.js 24 LTS.
- [x] 1.2 Install and pin baseline dependencies: TypeScript, Fastify, Zod, Fastify OpenAPI/Scalar integration packages.
- [x] 1.3 Add TypeScript configuration (strict mode) and scripts for dev, build, and start flows.

## 2. Fastify Server Foundation

- [x] 2.1 Create server bootstrap/factory with plugin registration and modular route loading.
- [x] 2.2 Implement baseline health endpoint with typed request/reply handling.
- [x] 2.3 Wire application entrypoint to start Fastify and expose configured host/port settings.

## 3. OpenAPI and Scalar Integration

- [x] 3.1 Register OpenAPI generation plugin(s) and expose OpenAPI JSON endpoint.
- [x] 3.2 Register Scalar Fastify API Reference route using generated OpenAPI document source.
- [x] 3.3 Ensure docs endpoints are reachable and include baseline route operations.

## 4. Structured Logging Integration

- [x] 4.1 Add and initialize `evlog` at application startup with service metadata configuration.
- [x] 4.2 Register `evlog/fastify` and document `request.log` vs `fastify.log` usage conventions.
- [x] 4.3 Add one representative route/service flow using `request.log.set(...)` and `useLogger()` to prove request-context propagation.
- [x] 4.4 Add structured error handling contract with `message`, `why`, `fix`, and `link` fields for handled API errors.
- [x] 4.5 Keep logging bootstrap minimal with default `evlog/fastify` registration.

## 5. Zod Schema Contract Wiring

- [x] 5.1 Add shared Zod schema module conventions for route request and response contracts.
- [x] 5.2 Integrate Zod type provider and OpenAPI bridge so route schemas power both validation and docs.
- [x] 5.3 Implement at least one representative route using Zod contracts to verify end-to-end schema reuse.

## 6. Validation and Developer Experience

- [x] 6.1 Confirm TypeScript build succeeds and fails on intentional contract/type violations.
- [x] 6.2 Confirm runtime validation rejects invalid request payloads for Zod-defined routes.
- [x] 6.3 Confirm request-scoped logging emits structured context and handled errors include metadata fields.
- [x] 6.4 Document local startup and documentation endpoints in project README (including Scalar route and OpenAPI JSON path).
- [x] 6.5 Document logging setup and usage (`request.log`, `useLogger()`, structured errors, and minimal defaults).

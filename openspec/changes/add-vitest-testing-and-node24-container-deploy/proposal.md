## Why

The service currently lacks a real automated test setup and a production-ready containerization strategy. Adding both now improves delivery confidence and provides a secure, reproducible deploy path for Node.js 24.

## What Changes

- Add a Vitest-based test setup for the Fastify service, including helpers for HTTP/API route testing.
- Add baseline tests for app bootstrapping and API endpoints using Fastify test patterns.
- Add a multi-stage Docker build targeting Node.js 24 with a Debian-based build stage.
- Add a distroless Google production runtime image and document container build/run usage.

## Capabilities

### New Capabilities
- `vitest-fastify-api-testing`: Standardized unit and route-level API testing with Vitest and Fastify-compatible helpers.
- `node24-distroless-container-deploy`: Multi-stage container build and production deployment image strategy for Node.js 24.

### Modified Capabilities
- `node-ts-service-bootstrap`: Extend project bootstrap requirements to include first-class test scripts/tooling and container build outputs.

## Impact

- Affected code: `package.json` scripts/devDependencies, test files, and possible test utilities.
- Affected deploy assets: `Dockerfile`, optional `.dockerignore`, and runtime command expectations.
- Documentation updates in `README.md` for test execution and container workflows.

## Context

The service is already running on Node.js 24 with TypeScript, Fastify, OpenAPI, and Scalar docs, but it does not have a formal test stack or a hardened container deployment path. Fastify provides first-class in-process HTTP testing through `app.inject`, which pairs well with Vitest for fast execution and low operational overhead. Deployment currently lacks an explicit multi-stage image strategy and should align with a secure runtime baseline.

## Goals / Non-Goals

**Goals:**
- Add a Vitest test harness and utilities for route/API testing in Fastify.
- Establish repeatable test scripts suitable for local and CI execution.
- Define a Node.js 24 multi-stage Docker build that uses a Debian-based builder stage.
- Run production workloads on a Google distroless Node.js image with only runtime artifacts.

**Non-Goals:**
- Introducing end-to-end browser testing frameworks.
- Adding performance or load test suites in this change.
- Changing application business behavior beyond what is needed for testability and packaging.

## Decisions

1. **Testing framework: Vitest**
   - Chosen for fast TypeScript-native test execution and modern DX.
   - Alternative considered: Node native test runner. Rejected because the request explicitly requires Vitest and Vitest has richer watch/report ergonomics.

2. **Fastify API testing approach: `app.inject` first, optional HTTP helpers only when needed**
   - Primary route tests will use Fastify's in-memory request injection for speed and determinism.
   - Alternative considered: Supertest against an actively listening port. Rejected as default due to slower setup/teardown and more flakiness in CI.

3. **Container strategy: multi-stage build with Debian builder + distroless runtime**
   - Builder stage uses an official Node.js 24 Debian-based image to compile TypeScript and install dependencies safely.
   - Runtime stage uses a Google distroless Node.js image to minimize attack surface.
   - Alternative considered: Alpine builder/runtime. Rejected by requirement and to avoid musl/glibc native module edge cases.

4. **Artifact boundary in image**
   - Runtime image will include only production dependencies and compiled output (no source, no devDependencies, no package managers).
   - This keeps runtime small and reduces supply-chain exposure.

## Risks / Trade-offs

- **[Risk] Distroless debugging is harder** → **Mitigation:** document local debug flow using the builder/dev image and clear container run commands.
- **[Risk] Dependency/install differences across stages** → **Mitigation:** lockfile-driven installs and explicit production-prune/install strategy in Dockerfile.
- **[Risk] Test fragility from shared app state** → **Mitigation:** create isolated app instances per test file and deterministic setup/teardown helpers.

## Migration Plan

1. Add test dependencies, scripts, and initial test files.
2. Ensure tests run green locally via package scripts.
3. Add Dockerfile multi-stage flow and optional `.dockerignore`.
4. Validate container build and runtime command paths.
5. Update README with test and deployment instructions.
6. Keep rollback simple by reverting the new testing/container files if deployment pipeline issues occur.

## Open Questions

- Whether to include coverage reporting in the initial Vitest setup or defer to a follow-up.
- Whether CI should run tests only, or tests plus image build on every pull request.

## 1. Testing Foundation

- [x] 1.1 Add Vitest (and required TypeScript integration) to dev dependencies and configure test scripts in `package.json`
- [x] 1.2 Add a shared Fastify test utility to create/teardown app instances for deterministic route testing
- [x] 1.3 Create initial Vitest test files covering service bootstrap and representative API endpoint success/error scenarios

## 2. API Test Coverage and Reliability

- [x] 2.1 Add tests that validate structured error payloads and status codes for invalid API requests
- [x] 2.2 Ensure tests run in isolation without requiring a bound network port (Fastify in-process injection)
- [x] 2.3 Document test execution commands and expected behavior in `README.md`

## 3. Container Build and Runtime Hardening

- [x] 3.1 Add a multi-stage `Dockerfile` using a Node.js 24 Debian-based build stage (non-Alpine) for dependency install and TypeScript build
- [x] 3.2 Add a Google distroless Node.js production stage that copies only runtime dependencies and compiled artifacts
- [x] 3.3 Add `.dockerignore` entries to reduce build context size and prevent unnecessary files from entering image layers

## 4. Deployment Validation and Docs

- [x] 4.1 Verify container build and runtime startup commands for the distroless image with required environment variables
- [x] 4.2 Update `README.md` with container build/run instructions and any distroless debugging notes
- [x] 4.3 Confirm npm test/build scripts and container workflow are ready for CI integration

## ADDED Requirements

### Requirement: Node.js 24 Multi-Stage Container Build
The service SHALL provide a multi-stage Docker build for Node.js 24 where the build stage uses a Debian-based Node.js image and compiles the TypeScript application artifacts.

#### Scenario: Build stage uses Debian-based Node.js image
- **WHEN** the Docker image is built
- **THEN** the build stage references a Node.js 24 Debian-family base image and does not use Alpine

#### Scenario: Build artifacts are produced for runtime stage
- **WHEN** the build stage completes
- **THEN** compiled application output and required runtime dependencies are available for transfer to the production stage

### Requirement: Distroless Production Runtime Image
The production container image SHALL use a Google distroless Node.js runtime image and include only the files required to execute the service.

#### Scenario: Runtime image excludes build toolchain
- **WHEN** the final production stage is assembled
- **THEN** compilers, package managers, and devDependencies are not present in the runtime image

#### Scenario: Production container starts service successfully
- **WHEN** the distroless image is started with required environment variables
- **THEN** the Fastify server process starts and serves requests using the compiled output

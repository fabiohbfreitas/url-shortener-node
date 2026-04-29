## ADDED Requirements

### Requirement: Node.js 24 TypeScript Project Baseline
The project SHALL initialize with Node.js 24 LTS as the runtime target and TypeScript as the primary language, including scripts for development, build, and production start.

#### Scenario: Repository bootstrap is runnable
- **WHEN** a developer installs dependencies and runs the development start script
- **THEN** the service starts successfully on Node.js 24 LTS without manual environment patching

#### Scenario: TypeScript build artifact is produced
- **WHEN** a developer runs the build script
- **THEN** TypeScript compilation emits executable JavaScript output for server startup

### Requirement: Strict Type Safety Configuration
The project SHALL enable strict TypeScript compiler settings for server code and reject type-unsafe route handler signatures at compile time.

#### Scenario: Invalid handler type usage
- **WHEN** a route handler returns a response shape that violates its declared schema contract
- **THEN** the TypeScript compiler reports an error and prevents successful build completion

### Requirement: Environment-Driven Runtime Configuration
The project SHALL validate required runtime configuration from environment variables using Zod and SHALL not rely on in-code default values for required service settings.

#### Scenario: Missing required environment variable
- **WHEN** the service starts without one of the required environment variables
- **THEN** startup fails with a configuration validation error instead of silently applying a fallback default

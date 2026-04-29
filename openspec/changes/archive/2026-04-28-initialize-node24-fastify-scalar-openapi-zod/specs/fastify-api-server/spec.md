## ADDED Requirements

### Requirement: Fastify Server Bootstrap
The system SHALL provide a Fastify server bootstrap that supports plugin registration and modular route loading.

#### Scenario: Server starts with registered routes
- **WHEN** the application starts
- **THEN** Fastify initializes successfully and exposes configured routes through a shared server instance

### Requirement: Baseline Health Endpoint
The system SHALL expose a health endpoint that confirms service availability and returns a successful status response.

#### Scenario: Health endpoint availability
- **WHEN** a client sends a GET request to the health endpoint
- **THEN** the service responds with HTTP 200 and a machine-readable health payload

### Requirement: Typed Route Definitions
The system SHALL support route definitions with compile-time request and reply typing aligned to schema contracts.

#### Scenario: Route schema typing is enforced
- **WHEN** a developer defines a route with typed schema metadata
- **THEN** the handler receives typed request properties and typed reply helpers in the Fastify context

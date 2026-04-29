## ADDED Requirements

### Requirement: Request-Scoped Structured Logger Availability
The system SHALL initialize `evlog` and register `evlog/fastify` so each request has a request-scoped structured logger available as `request.log`.

#### Scenario: Logger is available in route handlers
- **WHEN** a Fastify route handler executes for an incoming request
- **THEN** the handler can call `request.log.set(...)` to add structured context fields for that request

### Requirement: Logger Context Propagation Across Service Boundaries
The system SHALL support accessing the same request-scoped logger via `useLogger()` in downstream asynchronous service code.

#### Scenario: Service-layer logger access
- **WHEN** route handlers call service functions that execute in the same request context
- **THEN** `useLogger()` returns the active request logger and appended fields are merged into the same request event

### Requirement: Structured Error Metadata Contract
The system SHALL support structured error responses that include machine-readable metadata fields aligned with the logging guide (`why`, `fix`, `link`) for handled API errors.

#### Scenario: Structured error fields are exposed
- **WHEN** an endpoint raises a handled domain/API error
- **THEN** the response payload includes `message` and the available structured metadata fields (`why`, `fix`, `link`)

### Requirement: Minimal Logging Bootstrap
The system SHALL register `evlog/fastify` with a minimal default configuration in the initial service bootstrap.

#### Scenario: Logging works with default configuration
- **WHEN** the service starts with valid environment configuration
- **THEN** request-scoped wide events are emitted without requiring custom include/exclude or drain/sampling configuration

## ADDED Requirements

### Requirement: Vitest Test Harness for Fastify
The project SHALL provide a Vitest-based automated test harness for the Fastify service with scripts that run tests in local development and CI environments.

#### Scenario: Test command executes successfully
- **WHEN** a developer runs the test script from `package.json`
- **THEN** Vitest discovers and executes the configured test files without requiring manual server startup

### Requirement: Fastify API Route Testing Utilities
The test setup SHALL support route-level API testing through Fastify-compatible helpers, and route tests MUST be executable using in-process request handling.

#### Scenario: Route is tested with in-process request injection
- **WHEN** a test sends a request to the Fastify app through the test helper
- **THEN** the response status code and body can be asserted without binding to a network port

#### Scenario: Error responses are assertable
- **WHEN** a test triggers a validation or business-logic error path
- **THEN** the test harness can assert the structured error status and payload emitted by the API

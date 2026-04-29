## ADDED Requirements

### Requirement: OpenAPI Document Generation
The system SHALL generate an OpenAPI document from Fastify route metadata and make the document available through a JSON endpoint.

#### Scenario: OpenAPI endpoint returns generated spec
- **WHEN** a client requests the OpenAPI JSON endpoint
- **THEN** the service returns a valid OpenAPI document describing registered API routes

### Requirement: Scalar API Reference Publication
The system SHALL publish Scalar API documentation using the generated OpenAPI document as the source.

#### Scenario: Scalar UI loads API reference
- **WHEN** a client opens the configured Scalar documentation route
- **THEN** the Scalar UI renders successfully and displays operations from the generated OpenAPI specification

### Requirement: Zod Schema Reuse for Validation and Docs
The system SHALL define route contracts with Zod schemas and use the same contracts for both Fastify runtime validation and OpenAPI generation consumed by Scalar.

#### Scenario: Request schema is shared end-to-end
- **WHEN** a route declares Zod schemas for request and response
- **THEN** invalid requests are rejected at runtime and the same schema structure appears in the OpenAPI output

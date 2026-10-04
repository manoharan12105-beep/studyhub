# OpenAPI, Swagger and API Documentation — Interview Questions

## Beginner

### Q1. What is the difference between OpenAPI and Swagger?

<details>
<summary>Answer</summary>

OpenAPI is the specification format for describing REST APIs (it was called the Swagger Specification until 2016). Swagger now refers to tooling around it — Swagger UI for interactive docs, Swagger Editor, Codegen.

</details>

### Q2. How do you add API documentation to a Spring Boot app?

<details>
<summary>Answer</summary>

Add `springdoc-openapi-starter-webmvc-ui`. It generates the OpenAPI document at `/v3/api-docs` from controllers and DTOs and serves Swagger UI at `/swagger-ui.html`. Enrich it with `io.swagger.v3.oas.annotations` such as `@Operation`, `@ApiResponse`, `@Schema` and `@Tag`.

</details>

## Intermediate

### Q3. How do you document JWT authentication in Swagger UI?

<details>
<summary>Answer</summary>

Declare an HTTP bearer security scheme (`@SecurityScheme(name = "bearerAuth", type = HTTP, scheme = "bearer", bearerFormat = "JWT")` or in an `OpenAPI` bean) and reference it with `@SecurityRequirement(name = "bearerAuth")` on operations or globally. Swagger UI then shows an "Authorize" button to paste a token.

</details>

### Q4. Code-first or design-first API development?

<details>
<summary>Answer</summary>

Code-first generates the spec from implementation — quick and always in sync with code, but contract changes happen implicitly. Design-first writes and reviews the OpenAPI spec before coding and generates stubs/clients — better for public or multi-team APIs where the contract must be stable. Many teams use code-first with CI checks that fail on breaking spec changes.

</details>

## Advanced

### Q5. How can an OpenAPI spec be used beyond documentation?

<details>
<summary>Answer</summary>

Generating typed clients for front ends and other services, server stubs, mock servers for parallel development, contract tests verifying the implementation matches the spec, breaking-change detection in CI, API gateway configuration and request validation, and importing into API management portals.

</details>

### Q6. Should Swagger UI be enabled in production?

<details>
<summary>Answer</summary>

For public APIs, publish docs deliberately (often a separate developer portal). For internal APIs, either disable the UI in production (`springdoc.swagger-ui.enabled=false`, keeping the JSON spec available internally) or protect it with authentication, since it reveals all endpoints and models to attackers.

</details>

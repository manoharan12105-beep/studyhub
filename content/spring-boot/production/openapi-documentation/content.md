# OpenAPI, Swagger and API Documentation

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

- **OpenAPI** (formerly the Swagger Specification) is a standard, machine-readable format (JSON/YAML) for describing REST APIs: endpoints, parameters, request/response schemas, status codes, security schemes.
- **Swagger** today refers to the **tools** around OpenAPI, notably **Swagger UI** (interactive documentation in the browser) and Swagger Codegen/OpenAPI Generator.
- **springdoc-openapi** is the library that generates an OpenAPI document from a Spring Boot application's controllers at runtime and serves Swagger UI.

## Why It Matters

- Front-end, mobile and partner teams need an accurate contract; hand-written docs drift.
- An OpenAPI spec enables client generation, contract tests, API gateways and mock servers.
- "How did you document your APIs?" is a standard project question.

## OpenAPI

A fragment of a generated document:

```yaml
openapi: 3.1.0
info:
  title: Shop API
  version: 1.4.0
paths:
  /api/orders/{id}:
    get:
      summary: Get an order
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer, format: int64 }
      responses:
        "200":
          description: The order
          content:
            application/json:
              schema: { $ref: "#/components/schemas/OrderResponse" }
        "404":
          description: Order not found
      security:
        - bearerAuth: []
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
```

## Swagger

Swagger UI renders this document as interactive pages where developers can read endpoints and **try requests** (including adding a bearer token).

## API Documentation with springdoc

```xml
<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>${springdoc.version}</version>   <!-- 2.x for Boot 3, 3.x for Boot 4 -->
</dependency>
```

With only the dependency, springdoc scans controllers, `@RequestMapping` methods, parameters, DTOs and Bean Validation constraints:

- Spec: `/v3/api-docs` (JSON) and `/v3/api-docs.yaml`
- UI: `/swagger-ui.html` (redirects to `/swagger-ui/index.html`)

Enrich it with annotations from `io.swagger.v3.oas.annotations`:

```java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Schema(description = "An order as seen by the customer")
record OrderResponse(
        @Schema(example = "1042") long id,
        @Schema(example = "SHIPPED", allowableValues = {"PLACED", "SHIPPED", "DELIVERED"}) String status,
        @Schema(example = "149900", description = "Total in paise") @Positive long totalPaise,
        @NotBlank String customerName) {
}

@Tag(name = "Orders", description = "Customer order operations")
@RestController
@RequestMapping("/api/orders")
class DocumentedOrderController {

    @Operation(summary = "Get an order",
            description = "Returns an order owned by the authenticated customer.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Order found")
    @ApiResponse(responseCode = "404", description = "No such order for this customer",
            content = @Content(mediaType = "application/problem+json"))
    @GetMapping("/{id}")
    OrderResponse get(@Parameter(description = "Order id", example = "1042") @PathVariable long id) {
        return new OrderResponse(id, "SHIPPED", 149_900, "Asha");
    }
}
```

Useful properties: `springdoc.api-docs.path`, `springdoc.swagger-ui.path`, `springdoc.packages-to-scan`, `springdoc.swagger-ui.enabled=false` (e.g. in production), and grouping endpoints with `GroupedOpenApi` beans. Define the `bearerAuth` security scheme once in an `OpenAPI` bean or with `@SecurityScheme`.

Springfox (the older library) is unmaintained and incompatible with Spring Boot 3+; use springdoc.

### Code-first vs design-first

| | Code-first (springdoc) | Design-first (spec written first) |
|--|------------------------|-----------------------------------|
| Source of truth | Controllers and DTOs | The OpenAPI YAML |
| Speed | Fast for one team | Slower to start |
| Contract stability | Changes when code changes (risk of accidental breaks) | Reviewed before implementation |
| Tooling | Generated docs | Generate server stubs/clients (OpenAPI Generator) |

Either way, check the spec in CI (diff against the previous version to detect breaking changes).

## Common Mistakes

- Exposing Swagger UI publicly in production without authentication when the API is internal.
- Documentation that hides error responses — document 400/401/403/404/409 with the ProblemDetail schema.
- Entities in the spec (because controllers return entities) — the spec then mirrors the database.
- Using Springfox with Boot 3+.

## Common Interview Traps

- **"Swagger and OpenAPI are the same thing."** OpenAPI is the specification; Swagger is a set of tools (and the old name of the spec).
- **"Annotations are required for docs."** springdoc generates a usable spec from mappings and DTOs alone; annotations add descriptions and examples.
- **"Documentation is optional for internal APIs."** Internal consumers and future you need the contract too.

## Key Takeaways

- OpenAPI = machine-readable API contract; Swagger UI = interactive viewer; springdoc = generator for Spring.
- Add `springdoc-openapi-starter-webmvc-ui`; spec at `/v3/api-docs`, UI at `/swagger-ui.html`.
- Enrich with `@Operation`, `@ApiResponse`, `@Schema`, `@Tag`; document errors and security; protect the UI in production.

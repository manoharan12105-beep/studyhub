# API Versioning and REST API Best Practices

**Module:** REST API Development · **Interview priority:** Frequently asked

## Definition

- **API versioning** lets an API evolve with **breaking changes** while existing clients keep working on the old contract.
- **REST API best practices** are conventions that make APIs consistent, safe, evolvable and easy to consume: resource naming, correct methods and status codes, consistent errors, pagination, security, documentation and compatibility rules.

## Why It Matters

- Mobile apps cannot be force-updated; breaking a field name breaks thousands of installed clients.
- "How do you version an API?" and "What makes a good REST API?" are common senior-leaning questions even for junior roles.

## API Versioning

First, avoid versions when you can: **additive changes are not breaking**.

| Change | Breaking? |
|--------|-----------|
| Add an optional request field, a response field, a new endpoint | No (if clients ignore unknown fields) |
| Remove or rename a field; change a type or meaning | **Yes** |
| Make an optional field required | **Yes** |
| Change status codes or error format | **Yes** |
| Add a new enum value in responses | Often yes for strict clients |

When a breaking change is unavoidable:

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| **URI path** | `/api/v1/orders`, `/api/v2/orders` | Visible, easy to route, cache and test | Version is part of the resource URI |
| **Header** | `API-Version: 2` | Clean URIs | Less visible; caches must `Vary` on the header |
| **Media type** | `Accept: application/vnd.shop.v2+json` | Most "RESTful" | Harder for clients and tooling |
| **Query parameter** | `/api/orders?version=2` | Simple | Easy to forget; mixes with filters |

URI versioning is the most common in practice. Only the **major** version normally appears.

### Spring Framework 7 / Spring Boot 4: built-in API versioning

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.config.annotation.ApiVersionConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
class ApiVersionConfig implements WebMvcConfigurer {
    @Override
    public void configureApiVersioning(ApiVersionConfigurer configurer) {
        configurer.useRequestHeader("API-Version")        // or usePathSegment(1), useQueryParam("version")
                .addSupportedVersions("1", "2")
                .setDefaultVersion("1");
    }
}

record OrderV1(long id, String status) {
}

record OrderV2(long id, String status, String trackingUrl) {
}

@RestController
@RequestMapping("/api/orders")
class VersionedOrderController {

    @GetMapping(path = "/{id}", version = "1")
    OrderV1 getV1(@PathVariable long id) {
        return new OrderV1(id, "SHIPPED");
    }

    @GetMapping(path = "/{id}", version = "2")
    OrderV2 getV2(@PathVariable long id) {
        return new OrderV2(id, "SHIPPED", "https://track.example/" + id);
    }
}
```

Spring Boot 4 can configure the same with properties (`spring.mvc.apiversion.*`). On Boot 3, implement versioning with path prefixes (`@RequestMapping("/api/v1/orders")`) or `headers`/`produces` conditions on mappings.

**Lifecycle:** announce deprecation (`Deprecation` and `Sunset` headers, documentation), monitor usage of the old version, then remove it.

## REST API Best Practices

### Design

1. **Resources as plural nouns**, HTTP methods as verbs, shallow nesting (see [REST Principles](../rest-principles/content.md)).
2. **Correct methods and idempotency** — GET safe, PUT/DELETE idempotent, idempotency keys for critical POSTs (see [HTTP Methods](../rest-http-methods/content.md)).
3. **Correct status codes** — 201 + `Location`, 204, 400/401/403/404/409, never 200 for errors (see [HTTP Status Codes](../rest-http-status-codes/content.md)).
4. **DTOs, not entities** (see [DTOs](../dto-pattern/content.md)).
5. **Consistent naming** — one JSON case style (camelCase is the Java default), ISO-8601 timestamps in UTC (`2026-10-04T10:15:30Z`), money as minor units or decimal strings with currency.

### Input and output

6. **Validate all input** at the boundary with Bean Validation; return field-level errors.
7. **One error format** for every error — RFC 9457 `ProblemDetail` (`type`, `title`, `status`, `detail`, `instance`, plus custom fields such as `errors`) produced by global exception handling.
8. **Paginate collections** with maximum page sizes; filter and sort with query parameters.

### Security

9. **HTTPS only**; authenticate with tokens in headers, not URLs.
10. **Authorise every request** at the resource level (can *this* user see *this* order?), not only by role — broken object-level authorisation is the top API vulnerability in the OWASP API Security Top 10.
11. **Rate-limit** and set request size limits; return 429 with `Retry-After`.
12. **Never leak internals** — no stack traces, SQL or class names in responses.

### Operations

13. **Document** with OpenAPI (see [OpenAPI and Swagger](../../production/openapi-documentation/content.md)).
14. **Caching** where useful: `ETag`/`If-None-Match`, `Cache-Control`.
15. **Observability** — correlation ids in headers and logs, metrics per endpoint.
16. **Backward compatibility** — additive changes, tolerant readers, versioning for breaking changes.

### Example error response (ProblemDetail)

```json
{
  "type": "https://api.shop.example/problems/validation-error",
  "title": "Validation failed",
  "status": 400,
  "detail": "Request has 2 invalid fields",
  "instance": "/api/orders",
  "errors": [
    { "field": "quantity", "message": "must be greater than 0" },
    { "field": "address.pincode", "message": "must match \"\\d{6}\"" }
  ]
}
```

## Common Mistakes

- Versioning every small change, or never versioning and breaking clients.
- Different error formats per controller.
- Verbs in URIs, `GET` with side effects.
- Unbounded collections, no rate limits.
- Authorisation by role only, letting user A read user B's order by changing the id.

## Common Interview Traps

- **"Adding a field to a response requires a new version."** Not if clients ignore unknown fields (Jackson in Boot does by default).
- **"URI versioning is not RESTful, so it is wrong."** It is the most widely used, pragmatic choice; know the trade-offs of each strategy.
- **"Security is handled by Spring Security, so the API design is secure."** Object-level authorisation, validation, rate limiting and data exposure are design responsibilities.

## Key Takeaways

- Prefer additive, backward-compatible changes; version only for breaking changes (URI, header or media type).
- Spring Framework 7 supports versioning natively (`version` attribute on mappings + `ApiVersionConfigurer`).
- Best practices: nouns + methods, correct status codes, DTOs, validation, one error format (ProblemDetail), pagination, HTTPS + object-level authorisation, rate limits, OpenAPI docs.

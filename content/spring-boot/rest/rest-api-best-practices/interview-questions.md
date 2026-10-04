# API Versioning and REST API Best Practices — Interview Questions

## Beginner

### Q1. Why do APIs need versioning?

<details>
<summary>Answer</summary>

To introduce breaking changes — removing or renaming fields, changing types or semantics — without breaking existing clients that cannot upgrade immediately (mobile apps, partners). Old and new contracts run side by side until old clients migrate.

</details>

### Q2. What are the common API versioning strategies?

<details>
<summary>Answer</summary>

URI path (`/api/v1/orders`), custom request header (`API-Version: 2`), media type in `Accept` (`application/vnd.company.v2+json`) and query parameter (`?version=2`). URI versioning is the most common because it is visible and easy to route; header and media-type versioning keep URIs stable.

</details>

### Q3. List some REST API best practices.

<details>
<summary>Answer</summary>

Plural noun resources and HTTP methods as verbs; correct status codes; DTOs instead of entities; input validation; a single error format (ProblemDetail); pagination with limits; HTTPS and token authentication with object-level authorisation; rate limiting; OpenAPI documentation; backward-compatible evolution with versioning for breaking changes; correlation ids and metrics.

</details>

## Intermediate

### Q4. Which changes are breaking and which are not?

<details>
<summary>Answer</summary>

Non-breaking: adding endpoints, adding optional request fields, adding response fields (for tolerant clients). Breaking: removing or renaming fields, changing types or meaning, making optional fields required, changing status codes or error formats, and often adding enum values that strict clients cannot parse.

</details>

### Q5. How does Spring Framework 7 support API versioning?

<details>
<summary>Answer</summary>

Mapping annotations have a `version` attribute (`@GetMapping(path = "/{id}", version = "2")`, with `"1.1+"` for baselines), and a `WebMvcConfigurer.configureApiVersioning(ApiVersionConfigurer)` method decides how the version is read — header, path segment, query parameter or media-type parameter — plus supported and default versions and deprecation handling. Spring Boot 4 exposes this as `spring.mvc.apiversion.*` properties.

</details>

### Q6. What is broken object-level authorisation?

<details>
<summary>Answer</summary>

An endpoint checks that the caller is authenticated (or has a role) but not that the caller may access the specific object, so changing `/api/orders/1001` to `/api/orders/1002` exposes another user's order. Prevent it by scoping queries to the current user (`findByIdAndCustomerId`) or checking ownership in the service or with method security, and returning 404/403.

</details>

## Advanced

### Q7. How would you deprecate and retire an API version?

<details>
<summary>Answer</summary>

Announce it in documentation and changelogs, add `Deprecation` and `Sunset` response headers (and a `Link` to the migration guide) to v1 responses, track v1 usage per client via metrics and logs, contact remaining consumers, and remove v1 after the sunset date. Keep both versions sharing the same service layer so only the web mapping differs.

</details>

### Q8. Design the error contract for a public API.

<details>
<summary>Answer</summary>

Use RFC 9457 `application/problem+json` for every error: `type` (a stable URI identifying the error kind), `title`, `status`, `detail`, `instance` (request path), plus extensions such as `errors` (field-level validation list), `code` (machine-readable) and a correlation id. Produce it centrally in a `@RestControllerAdvice` (Spring's `ProblemDetail`), map each exception category to one status, never include stack traces, and document the error types in OpenAPI.

</details>

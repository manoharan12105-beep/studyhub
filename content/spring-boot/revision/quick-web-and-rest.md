# Web and REST Essentials

One line per topic for Spring MVC, REST, validation and error handling.

## Spring MVC

- **Architecture** — front controller `DispatcherServlet` → `HandlerMapping` → `HandlerAdapter` → controller → message converter / view.
- **Request lifecycle** — filters → `DispatcherServlet` → interceptor `preHandle` → argument binding + `@Valid` → controller → converter → `postHandle` → `afterCompletion` → filters.
- **Filter vs interceptor** — filter: servlet level, all requests, security/CORS/logging; interceptor: MVC level, knows the handler.
- **Responses** — return DTO (200), `ResponseEntity` (status/headers), `ResponseEntity.created(uri)` (201), `noContent()` (204), `ProblemDetail`.

## REST

- **Principles** — resources + URIs + representations; stateless, cacheable, uniform interface, layered.
- **Methods** — GET safe/idempotent, POST neither, PUT idempotent replace, PATCH partial, DELETE idempotent.
- **Status codes** — 200/201/204; 400 bad input, 401 unauthenticated, 403 forbidden, 404, 409 conflict, 422, 429; 500.
- **Binding** — `@PathVariable` identity, `@RequestParam` filters, `@RequestBody` JSON, `@RequestHeader`, `@ModelAttribute`.
- **DTOs** — separate API contract from entities: no mass assignment, no leaks, no lazy-loading surprises.
- **Paging** — `Pageable` (`page` zero-based, `size`, `sort`), `Page` (with count) vs `Slice`; cap size, whitelist sorts, keyset for deep pages.
- **Best practices** — plural nouns, correct codes, versioning, ProblemDetail errors, idempotency keys, OpenAPI.

## Validation and Errors

- **Bean Validation** — annotate DTOs, `@Valid` on the parameter, starter required; `@NotNull` < `@NotEmpty` < `@NotBlank`.
- **Advanced validation** — custom constraint (annotation + public `ConstraintValidator`), class-level cross-field rules, groups with `@Validated`, method validation.
- **Exception basics** — local `@ExceptionHandler`, `@ResponseStatus`, `ResponseStatusException`, Boot `/error` fallback.
- **Global handling** — `@RestControllerAdvice` (+ `ResponseEntityExceptionHandler`) → ProblemDetail; specific handlers + one safe 500; filters need entry point / access-denied handler.

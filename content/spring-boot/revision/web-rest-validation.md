# Web, REST, Validation and Errors

Revision points for Spring MVC, REST API design, Bean Validation and exception handling.

## Spring MVC Architecture

- Front-controller pattern: one `DispatcherServlet` receives every request and delegates.
- Collaborators: `HandlerMapping` (find handler), `HandlerAdapter` (invoke it), argument resolvers, `HttpMessageConverter`s, `HandlerExceptionResolver`s, `ViewResolver`.
- `@Controller` returns view names; `@RestController` = `@Controller` + `@ResponseBody` → body written by a message converter (JSON via Jackson 3).
- Embedded Tomcat runs the servlet; Boot auto-configures MVC (`WebMvcAutoConfiguration`).
- Customise with a `WebMvcConfigurer` bean; `@EnableWebMvc` switches Boot's MVC auto-config **off**.

## Request Lifecycle

- Client → Tomcat → servlet **filters** (incl. Spring Security chain) → `DispatcherServlet` → `HandlerMapping` → interceptor `preHandle` → argument resolution + validation → controller → return value handler / message converter → `postHandle` → `afterCompletion` → filters → response.
- Content negotiation picks the converter from `Accept` and produces types.
- Exceptions from the controller go to `HandlerExceptionResolver`s (`@ExceptionHandler` first).
- Unmatched URL → `NoResourceFoundException` → 404; wrong method → 405; unsupported media type → 415.
- Exceptions in filters never reach `@ControllerAdvice`.

## Filters and Interceptors

- **Filter** (servlet level): every request incl. static and error dispatches; sees raw request/response; can stop the chain. Use for security, CORS, logging, request ids, compression.
- **Interceptor** (Spring MVC level): knows the handler method; `preHandle` / `postHandle` / `afterCompletion`. Use for handler-aware checks, timing, locale.
- `OncePerRequestFilter` avoids running twice per request (error dispatch).
- Order filters with `@Order` or `FilterRegistrationBean`; register interceptors via `WebMvcConfigurer.addInterceptors` with path patterns.
- AOP is for method-level concerns on any bean, not HTTP.

## Response Handling

- Return a DTO (200), `ResponseEntity<T>` (status + headers + body), `void` + `@ResponseStatus`, or `ProblemDetail`.
- `ResponseEntity.created(uri).body(dto)` for 201 + `Location`; `noContent().build()` for 204.
- Jackson 3 (Boot 4) writes dates as ISO-8601 and ignores unknown properties by default.
- `@JsonIgnore`, `@JsonProperty`, `@JsonInclude(NON_NULL)` shape JSON — but DTOs are cleaner.
- Never return entities with lazy relations (serialisation triggers lazy loading or recursion).

## REST Principles

- Resources identified by URIs, manipulated through representations with uniform HTTP methods.
- Constraints: client–server, **stateless**, cacheable, uniform interface, layered system, (code on demand optional).
- Nouns in URIs (`/orders/42/items`), plural collections, verbs only via HTTP methods.
- HATEOAS = links in responses; rarely fully implemented.
- REST is an architectural style, not a protocol; JSON over HTTP is not automatically RESTful.

## HTTP Methods

- GET (read; safe, idempotent, cacheable), POST (create/action; neither), PUT (full replace; idempotent), PATCH (partial update; not guaranteed idempotent), DELETE (idempotent).
- Idempotent = repeating has the same server-side effect, not the same response (second DELETE → 404 is fine).
- Safe = no state change intended.
- HEAD = GET headers only; OPTIONS = allowed methods / CORS preflight.
- POST for non-idempotent operations needs idempotency keys for safe retries.

## HTTP Status Codes

- 200 OK, 201 Created (+ `Location`), 202 Accepted (async), 204 No Content.
- 400 Bad Request (malformed / validation), 401 Unauthorized (= not authenticated), 403 Forbidden (authenticated, not allowed), 404, 405, 409 Conflict (state/duplicate/optimistic lock), 415, 422 (semantic validation; `UNPROCESSABLE_CONTENT` in Spring 7), 429 Too Many Requests.
- 500 unexpected server error; 502/503/504 gateway/unavailable/timeout.
- Never return 200 with an error body.
- Consistent error body: RFC 9457 ProblemDetail.

## Request Data Binding

- `@PathVariable` (resource identity), `@RequestParam` (filters, paging, optional with default), `@RequestBody` (JSON → object via converter), `@RequestHeader`, `@CookieValue`, `@ModelAttribute` (form/query → object).
- Missing required param → `MissingServletRequestParameterException` (400); bad type → `MethodArgumentTypeMismatchException` (400); malformed JSON → `HttpMessageNotReadableException` (400).
- Records bind well as request DTOs.
- Compile with `-parameters` (Boot plugin does) so names need not be repeated.
- `@RequestBody` reads the stream once; only one per method.

## DTO Pattern

- Separate request/response classes from entities.
- Prevents mass assignment, hides internal/secret fields, decouples API from schema, avoids lazy/recursion problems, allows per-operation validation.
- Map in the service (manual mapping or MapStruct); records are ideal DTOs.
- Different DTOs for create/update/response.
- Projections can load DTO-shaped data directly from the database.

## Pagination, Sorting and Filtering

- `Pageable` binds `?page=0&size=20&sort=price,desc`; `Page<T>` includes total count (extra `count` query), `Slice<T>` only `hasNext`.
- Boot caps page size at 2000 by default (`spring.data.web.pageable.max-page-size`); set lower.
- Whitelist sort properties; add a unique tie-breaker (`id`).
- Return a stable page DTO (or `PagedModel` via `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`), not `PageImpl` internals.
- Deep offsets are slow → keyset (seek) pagination.
- Filters via query params + Specifications / Querydsl / derived queries.

## REST API Best Practices

- Consistent naming, plural nouns, correct methods and status codes.
- Versioning: URI (`/v1`), header or media type; Framework 7 supports `version=` on mappings with `ApiVersionConfigurer`.
- Validation on input, ProblemDetail for errors, pagination for collections.
- Idempotency keys for POST, ETags for caching/concurrency (`If-Match`).
- Security: HTTPS, authn/z, rate limiting, no sensitive data in URLs.
- Document with OpenAPI; never break clients without a new version.

## Bean Validation

- Jakarta Validation annotations on DTO fields; `@Valid` (or `@Validated`) on the parameter triggers it.
- `@NotNull` (not null), `@NotEmpty` (not null, size > 0), `@NotBlank` (strings: non-whitespace).
- `@Size`, `@Min`/`@Max`, `@Positive`, `@Email`, `@Pattern`, `@Past`/`@Future`.
- Body failure → `MethodArgumentNotValidException` (400); parameter constraints → `HandlerMethodValidationException`.
- Nested objects/collections need `@Valid` on the field to cascade.
- Needs `spring-boot-starter-validation`.

## Advanced Validation

- Custom constraint = annotation (`@Constraint(validatedBy=…)`, message, groups, payload) + `ConstraintValidator` (public class).
- Class-level constraints for cross-field rules (start < end, passwords match).
- Groups (`OnCreate`, `OnUpdate`) with `@Validated(OnCreate.class)`.
- `@Validated` on a bean class enables method validation on service methods (throws `ConstraintViolationException`).
- Messages in `ValidationMessages.properties`; i18n via `MessageSource`.
- Business validation (stock, uniqueness) belongs in services, with DB constraints as the final guard.

## Exception Handling Basics

- `@ExceptionHandler` in a controller handles that controller's exceptions.
- `@ResponseStatus` on a custom exception sets status without a handler.
- `ResponseStatusException` for ad-hoc status + reason.
- Boot's `/error` (`BasicErrorController`) renders unhandled errors; hide details in production (`server.error.include-stacktrace=never`).
- Never swallow exceptions; never expose stack traces to clients.

## Global Exception Handling

- `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`; applies to all controllers.
- Extend `ResponseEntityExceptionHandler` to get ProblemDetail for Spring MVC exceptions; or `spring.mvc.problemdetails.enabled=true`.
- Most specific handler wins; one catch-all `Exception` handler logs at ERROR and returns a safe 500.
- Map domain exceptions (`NotFound` → 404, `Conflict` → 409), validation (400 with field errors), `OptimisticLockingFailureException` (409), `DataIntegrityViolationException` (409).
- Security exceptions in filters use `AuthenticationEntryPoint` (401) and `AccessDeniedHandler` (403); a catch-all advice can swallow `AccessDeniedException` from `@PreAuthorize`.

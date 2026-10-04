# REST API Interview Questions — Interview Questions

## Beginner

### Q1. Design the endpoints for managing products (CRUD).

**Style:** Scenario

<details>
<summary>Answer</summary>

`GET /api/products` (paged list with filters), `GET /api/products/{id}`, `POST /api/products` (201 + `Location`), `PUT /api/products/{id}` (full replace) or `PATCH /api/products/{id}` (partial), `DELETE /api/products/{id}` (204). Request/response DTOs with Bean Validation, 404 for missing ids, 409 for duplicate SKUs, admin-only writes.

</details>

### Q2. What is the role of `@RestController`, `@RequestMapping` and `@GetMapping`?

**Style:** Direct

<details>
<summary>Answer</summary>

`@RestController` marks a bean whose handler return values are written to the response body; `@RequestMapping` maps a URL prefix (and optionally methods, media types) at class or method level; `@GetMapping` is a shortcut for `@RequestMapping(method = GET)`.

</details>

### Q3. What status code would you return when a resource is created, updated, and deleted?

**Style:** Direct

<details>
<summary>Answer</summary>

Created: 201 with a `Location` header (and usually the resource). Updated: 200 with the updated resource, or 204 without body. Deleted: 204 (or 404 if it did not exist, depending on convention).

</details>

### Q4. How do you read a query parameter with a default value?

**Style:** How

<details>
<summary>Answer</summary>

`@RequestParam(defaultValue = "0") int page` — `defaultValue` also makes it optional. For optional parameters without defaults: `@RequestParam(required = false) String category` or `Optional<String>`.

</details>

## Intermediate

### Q5. A teammate returns `User` entities straight from a controller "to save time". What problems will this cause?

**Style:** Scenario

<details>
<summary>Answer</summary>

Entities couple the API to the schema, leak internal fields, allow mass assignment when used as input, trigger lazy loading and N+1 queries during serialisation, cause infinite recursion with bidirectional relations, and give no way to shape responses per use case. DTOs define a stable, explicit contract.

</details>

### Q6. How do you return a consistent error format across the API?

**Style:** How

<details>
<summary>Answer</summary>

A single `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`, mapping domain exceptions, validation failures and security exceptions to RFC 9457 `ProblemDetail` responses with appropriate status codes, field-level error lists and a trace id, plus a safe 500 fallback.

</details>

### Q7. What happens when the JSON body contains a field the DTO does not have?

**Style:** Behavior

<details>
<summary>Answer</summary>

With Spring Boot's Jackson configuration, unknown properties are ignored (`FAIL_ON_UNKNOWN_PROPERTIES` disabled), so the request is accepted. This tolerant-reader behaviour helps backward compatibility; enable failure if you need strict contracts.

</details>

### Q8. How do you implement partial updates safely?

**Style:** How

<details>
<summary>Answer</summary>

`PATCH` with a DTO of nullable fields (or JSON Merge Patch), loading the entity in a transactional service and applying only provided fields that the client may change, then validating the resulting state. Use optimistic locking (`@Version`/ETag) to avoid overwriting concurrent changes.

</details>

### Q9. How would you design search with many optional filters and sorting?

**Style:** Scenario

<details>
<summary>Answer</summary>

`GET /api/products?category=…&minPrice=…&maxPrice=…&q=…&page=0&size=20&sort=price,asc`, binding filters to a record and paging to `Pageable` with a maximum page size and whitelisted sort fields; build the query with Spring Data Specifications; return a page DTO; index the filtered columns.

</details>

### Q10. Which HTTP status do you get for a wrong `Content-Type`, an unsupported method and an unsatisfiable `Accept` header?

**Style:** Behavior

<details>
<summary>Answer</summary>

415 Unsupported Media Type, 405 Method Not Allowed and 406 Not Acceptable respectively — all produced by Spring MVC before or after the controller runs.

</details>

### Q11. How do you make `POST /orders` safe to retry?

**Style:** Scenario

<details>
<summary>Answer</summary>

Accept an `Idempotency-Key` header, store it with a unique constraint and the response; a repeated key returns the stored response instead of creating a second order; in-progress duplicates get 409. Clients and gateways can then retry timeouts safely.

</details>

## Advanced

### Q12. Trace a `POST /api/orders` request from Tomcat to the database and back.

**Style:** How

<details>
<summary>Answer</summary>

Tomcat assigns a thread and runs filters (Spring Security authenticates the JWT and authorises the URL), the `DispatcherServlet` finds the handler via `RequestMappingHandlerMapping`, interceptors run, argument resolvers convert the JSON body with Jackson and validate it (`@Valid`), the controller calls the `@Transactional` service proxy which opens a transaction, repositories run SQL through Hibernate and Hikari, the transaction commits, the controller returns `ResponseEntity.created(...)`, Jackson writes the DTO, interceptors complete, filters unwind and the response is sent.

</details>

### Q13. How would you version an API used by mobile apps that cannot be force-updated?

**Style:** Scenario

<details>
<summary>Answer</summary>

Avoid breaking changes (additive fields, tolerant clients); when unavoidable introduce `/api/v2/...` (or a version header with Spring Framework 7's native versioning), run both versions from the same service layer, add `Deprecation`/`Sunset` headers to v1, monitor v1 traffic per app version, and retire it after the sunset date.

</details>

### Q14. A list endpoint becomes slow as data grows. What do you change at the API level?

**Style:** Scenario

<details>
<summary>Answer</summary>

Enforce pagination with a maximum page size, return only summary DTOs (projections), add sort tie-breakers and indexes, use `Slice` or keyset pagination for deep scrolling, avoid counts when not needed, add caching (`ETag`/`Cache-Control` or server-side) for rarely changing lists, and check for N+1 in mapping.

</details>

### Q15. Why might `@PathVariable long id` without a name fail in some builds?

**Style:** Debugging

<details>
<summary>Answer</summary>

Spring infers the variable name from the parameter name, which is only available when compiling with `-parameters`. Boot's build plugins enable it; a custom build without it (or without the Boot parent) causes "Name for argument of type [long] not specified" since Spring 6.1. Fix the compiler flag or name the variable explicitly.

</details>

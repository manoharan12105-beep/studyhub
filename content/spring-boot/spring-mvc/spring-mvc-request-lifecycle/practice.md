# Request Lifecycle: DispatcherServlet to Response — Practice

### P1. Which status?

**Difficulty:** Easy · **Type:** MCQ

A client sends `POST /api/orders` with `Content-Type: text/plain` to a method annotated `@PostMapping(consumes = "application/json")`. What is the response?

- A) 400 Bad Request
- B) 404 Not Found
- C) 415 Unsupported Media Type
- D) 406 Not Acceptable

<details>
<summary>Answer</summary>

**Answer:** C) 415 Unsupported Media Type

**Explanation:** The path and method match, but the declared `consumes` does not match the request's `Content-Type`.

</details>

### P2. Order the steps

**Difficulty:** Medium · **Type:** Conceptual

Put in order: interceptor `preHandle`, `HttpMessageConverter` writes JSON, filter, `HandlerMapping`, `@Valid` validation, controller method, interceptor `afterCompletion`.

<details>
<summary>Answer</summary>

Filter → `HandlerMapping` → interceptor `preHandle` → `@Valid` validation (argument resolution) → controller method → `HttpMessageConverter` writes JSON → interceptor `afterCompletion`.

</details>

### P3. Wrong layer for the fix

**Difficulty:** Medium · **Type:** Debugging

Malformed JSON requests return a generic Spring error body, and a teammate adds a try/catch inside the controller method to return a nice message. It has no effect. Why, and where should the handling go?

<details>
<summary>Answer</summary>

Parsing happens during argument resolution, before the controller method runs, so its try/catch never sees the error (`HttpMessageNotReadableException`). Handle it in a `@RestControllerAdvice` (`@ExceptionHandler(HttpMessageNotReadableException.class)`) or by extending `ResponseEntityExceptionHandler`.

</details>

### P4. Custom resolver

**Difficulty:** Hard · **Type:** Design

Every endpoint needs the tenant id from the `X-Tenant-Id` header, validated against a list of known tenants. Design a clean solution.

<details>
<summary>Answer</summary>

Create a `Tenant` value type and a `TenantArgumentResolver implements HandlerMethodArgumentResolver` that supports `Tenant` parameters, reads the header, validates it (throwing a custom `UnknownTenantException` mapped to 400 by global exception handling) and returns the `Tenant`. Register it in a `WebMvcConfigurer.addArgumentResolvers`. Controllers just declare `Tenant tenant` as a parameter. (If the tenant must also be known by services without passing it along, a filter that stores it in a request-scoped bean is an alternative.)

</details>

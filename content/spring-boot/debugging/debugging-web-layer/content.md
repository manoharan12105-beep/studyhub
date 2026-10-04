# Debugging Validation and Exception Handling

**Module:** Debugging and Internal Behavior · **Interview priority:** Frequently asked

## How to Use This Topic

Each scenario: **Problem → Possible Causes → How to Diagnose → Fix → Prevention → Interview Explanation**. Background: [Bean Validation](../../validation/bean-validation/content.md), [Advanced Validation](../../validation/advanced-validation/content.md), [Global Exception Handling](../../exception-handling/global-exception-handling/content.md), [Request Lifecycle](../../spring-mvc/spring-mvc-request-lifecycle/content.md).

## Why Does Validation Not Trigger?

### Problem

A request with invalid data (blank name, negative quantity) reaches the service and is saved; no 400 is returned.

### Possible Causes

1. **`spring-boot-starter-validation` missing** — annotations exist but no validator runs (the web starter does not include it).
2. **`@Valid` missing** on the `@RequestBody` parameter.
3. Nested objects or list elements without `@Valid` (`@Valid AddressRequest address`, `List<@Valid ItemRequest>`).
4. Constraints treat **`null` as valid** (`@Size`, `@Email`, `@Min` without `@NotNull`/`@NotBlank`).
5. **`javax.validation` imports** in a Boot 3/4 project.
6. Method validation on services needs **`@Validated` on the class**, and the call must go through the proxy (no self-invocation).
7. Validation groups: `@Validated(OnCreate.class)` skips constraints in the `Default` group.
8. A `BindingResult` parameter after the argument suppresses the exception and nobody checks it.

### How to Diagnose

- `mvn dependency:tree | grep hibernate-validator`.
- Check imports and annotations on the controller parameter and nested fields.
- Unit-test the DTO with `Validation.buildDefaultValidatorFactory().getValidator().validate(dto)`.

### Fix

Add the validation starter; `@Valid @RequestBody`; `@Valid` on nested objects/elements; combine format constraints with `@NotNull`/`@NotBlank`; use `jakarta.validation`; `@Validated` on service classes for method validation.

### Prevention

Web-layer tests (`@WebMvcTest`/MockMvc) asserting 400 for invalid payloads; DTO unit tests.

### Interview Explanation

"Validation runs during argument resolution only when there's a validator on the classpath and `@Valid` on the argument — and it cascades only where `@Valid` is placed. Most constraints accept null, so required fields need `@NotNull`/`@NotBlank`."

## Why Does @ControllerAdvice Not Catch an Exception?

### Problem

A custom exception handler is never invoked; clients receive Spring's default error body, a 401/403 from security, or a 500.

### Possible Causes

1. The exception is thrown **outside the `DispatcherServlet`**: in a servlet **filter** (JWT filter, logging filter) or Spring Security's filter chain.
2. It happens in **another thread** (`@Async`, scheduled job, `CompletableFuture`) — not part of request handling.
3. The advice is **not a bean** (outside scanning) or **scoped** (`basePackages`, `assignableTypes`, `annotations`) to exclude the controller.
4. Another `@ExceptionHandler` matches first: a **controller-local** handler, a more specific handler, or an advice with higher `@Order`.
5. The exception is **caught and swallowed** (or wrapped into another type) before reaching the controller boundary.
6. `@ControllerAdvice` with methods returning objects but no `@ResponseBody` (should be `@RestControllerAdvice`) → view resolution errors.
7. The response is **already committed** (streaming), so the handler cannot change it.
8. The handler itself throws.

### How to Diagnose

- Find where the exception is thrown in the stack trace: filter class names (`OncePerRequestFilter`, `FilterChainProxy`) vs controller frames.
- `logging.level.org.springframework.web=DEBUG` shows "Resolved [exception]" lines naming the resolver used.
- Check the advice's package and attributes; search for other `@ExceptionHandler`s for the same type.

### Fix

Handle filter exceptions in the filter, with Spring Security's `AuthenticationEntryPoint`/`AccessDeniedHandler`, or by delegating to `HandlerExceptionResolver`; handle async exceptions in the async code (`AsyncUncaughtExceptionHandler`, future callbacks); fix scanning/scope; use `@RestControllerAdvice`; stop swallowing exceptions.

### Prevention

One global `@RestControllerAdvice` extending `ResponseEntityExceptionHandler`, explicit handlers for security exceptions, MockMvc tests for every error type including filter-level ones.

### Interview Explanation

"`@ControllerAdvice` is applied by the `DispatcherServlet`'s exception resolvers, so it only sees exceptions thrown while handling a request in Spring MVC — not in servlet filters like a JWT filter, not in async threads. For filter errors I use the security entry point or delegate to the `HandlerExceptionResolver`."

## Key Takeaways

- Validation needs the validator on the classpath, `@Valid` at each level, and `@NotNull`/`@NotBlank` for required fields.
- `@ControllerAdvice` covers only exceptions during `DispatcherServlet` handling; filters, async threads and swallowed exceptions bypass it.

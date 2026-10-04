# Global Exception Handling with @RestControllerAdvice — Interview Questions

## Beginner

### Q1. How do you handle exceptions globally in Spring Boot?

<details>
<summary>Answer</summary>

Create a class annotated with `@RestControllerAdvice` containing `@ExceptionHandler` methods for each exception category; each returns a consistent error response (typically a `ProblemDetail`) with the right status. Extending `ResponseEntityExceptionHandler` adds standard handling for Spring MVC's own exceptions. Add a fallback handler for `Exception` that returns a safe 500.

</details>

### Q2. What is the difference between `@ControllerAdvice` and `@RestControllerAdvice`?

<details>
<summary>Answer</summary>

`@RestControllerAdvice` is `@ControllerAdvice` plus `@ResponseBody`, so handler return values are serialised into the response body (JSON). With plain `@ControllerAdvice`, return values are treated as view names unless methods are annotated with `@ResponseBody` or return `ResponseEntity`.

</details>

### Q3. What is `ProblemDetail`?

<details>
<summary>Answer</summary>

Spring's representation of an RFC 9457 "Problem Details for HTTP APIs" error body (`application/problem+json`) with `type`, `title`, `status`, `detail` and `instance`, plus custom properties. Returning it from an `@ExceptionHandler` produces a standard, consistent error format; Spring MVC's built-in exceptions can also render it.

</details>

## Intermediate

### Q4. If a controller has its own `@ExceptionHandler` and a `@RestControllerAdvice` handles the same exception, which wins?

<details>
<summary>Answer</summary>

The controller's local handler. `ExceptionHandlerExceptionResolver` checks the controller class first and only then `@ControllerAdvice` beans (in `@Order` order). Within one class, the handler for the closest superclass of the thrown exception is chosen.

</details>

### Q5. Why might `@ControllerAdvice` not catch an exception?

<details>
<summary>Answer</summary>

The exception was thrown outside `DispatcherServlet` handler processing — in a servlet filter (JWT filter, Spring Security), in an `@Async` or scheduled thread, or after the response was committed; the advice is scoped (`basePackages`, `assignableTypes`) to exclude that controller; it is not a bean (outside component scanning); a more specific handler elsewhere took it; or the code catches the exception itself and returns normally.

</details>

### Q6. What does `ResponseEntityExceptionHandler` give you?

<details>
<summary>Answer</summary>

Ready-made `@ExceptionHandler` methods for Spring MVC's standard exceptions — unsupported method, media type, missing parameters, type mismatch, unreadable body, validation (`MethodArgumentNotValidException`, `HandlerMethodValidationException`), no handler/resource found — returning `ProblemDetail` bodies with correct statuses. Override its protected methods (e.g. `handleMethodArgumentNotValid`) to customise, and add your own domain handlers.

</details>

## Advanced

### Q7. Your catch-all `@ExceptionHandler(Exception.class)` makes `@PreAuthorize` failures return 500. Why and how do you fix it?

<details>
<summary>Answer</summary>

Method security throws `AccessDeniedException` from the controller method call, inside handler processing, so the advice's catch-all handles it before Spring Security's `ExceptionTranslationFilter` can turn it into 403. Add an explicit `@ExceptionHandler(AccessDeniedException.class)` returning 403 (and similarly for `AuthenticationException` → 401), or rethrow these from the catch-all.

</details>

### Q8. How do you handle exceptions thrown in a JWT authentication filter?

<details>
<summary>Answer</summary>

Filters run before the `DispatcherServlet`, so advice does not apply. Options: let authentication failures flow to Spring Security's `AuthenticationEntryPoint` (configure a custom one that writes a 401 `ProblemDetail`); catch exceptions in the filter and write the response directly; or inject the `HandlerExceptionResolver` bean (`handlerExceptionResolver`) into the filter and delegate to it, which routes the exception to your `@RestControllerAdvice`.

</details>

### Q9. How should logging differ between a 404 and a 500 in the global handler?

<details>
<summary>Answer</summary>

Expected client errors (404, 400, 409) are normal traffic: log at `INFO`/`WARN` with a short message and no stack trace, or not at all. Unexpected exceptions (500) are bugs or outages: log at `ERROR` with the full stack trace and a trace/correlation id that is also returned in the response, so support can find the log entry. Otherwise logs flood with noise and real errors are missed.

</details>

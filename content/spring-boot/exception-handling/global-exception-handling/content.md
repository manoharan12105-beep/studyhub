# Global Exception Handling with @RestControllerAdvice

**Module:** Exception Handling · **Interview priority:** Core

## Definition

- **`@ExceptionHandler`** marks a method that handles exceptions of given types thrown while processing a request.
- **`@ControllerAdvice`** marks a class whose `@ExceptionHandler` (and `@InitBinder`, `@ModelAttribute`) methods apply **to all controllers** (or a selected subset).
- **`@RestControllerAdvice`** = `@ControllerAdvice` + `@ResponseBody`: handler return values are written as the response body (JSON).
- **Global exception handling** is the pattern of mapping every exception category to a consistent HTTP status and error body in one place, typically an RFC 9457 **`ProblemDetail`**.

## Why It Matters

- Without it, each controller builds its own error responses, or exceptions leak as 500s with inconsistent bodies.
- "How do you handle exceptions globally in Spring Boot?" is asked in almost every Spring Boot interview, often with "What does your error response look like?".

## @ExceptionHandler

```java
@ExceptionHandler(ResourceNotFoundException.class)
ProblemDetail handleNotFound(ResourceNotFoundException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
}
```

- Declared inside a controller, it handles exceptions from **that controller only** and takes precedence over global handlers.
- Can handle several types: `@ExceptionHandler({A.class, B.class})`.
- Method parameters can include the exception, `HttpServletRequest`, `WebRequest`, `Locale`.
- Return `ProblemDetail`, `ResponseEntity<…>`, an object (with `@ResponseStatus`) or `ErrorResponse`.
- **Most specific match wins**: for an `InsufficientStockException extends BusinessRuleException extends ApplicationException`, a handler for `BusinessRuleException` is chosen over one for `ApplicationException` (closest superclass in the hierarchy).

## @ControllerAdvice

```java
@ControllerAdvice(basePackages = "com.example.shop.api")       // optional scoping
class WebExceptionHandler { /* @ExceptionHandler methods */ }
```

Scoping attributes: `basePackages`, `assignableTypes`, `annotations` (e.g. only `@RestController`s). With several advice classes, order them with `@Order` — the first advice that has a matching handler wins.

## @RestControllerAdvice

The usual choice for REST APIs. Its handlers' return values go through message converters like `@ResponseBody` controller methods.

## Error Response Structure

Spring Framework 6 supports **RFC 9457 Problem Details** (`application/problem+json`) with `ProblemDetail`:

| Field | Meaning | Example |
|-------|---------|---------|
| `type` | URI identifying the error kind (docs page) | `https://api.shop.example/problems/insufficient-stock` |
| `title` | Short summary for the type | `Insufficient stock` |
| `status` | HTTP status | `422` |
| `detail` | Explanation for this occurrence | `Product 7: requested 5, available 2` |
| `instance` | URI of this request | `/api/orders` |
| extensions | Any extra properties | `code`, `errors`, `traceId`, `timestamp` |

Enable it for Spring MVC's built-in exceptions with `spring.mvc.problemdetails.enabled=true`, or extend `ResponseEntityExceptionHandler`, which already maps all standard Spring MVC exceptions (400, 404, 405, 406, 415, …) to `ProblemDetail`.

## Global Exception Handling Architecture

```text
Controller / Service / Repository throws
        │
        ▼
DispatcherServlet → HandlerExceptionResolvers
        │
        ▼
@RestControllerAdvice GlobalExceptionHandler  (extends ResponseEntityExceptionHandler)
  ├── Spring MVC exceptions (inherited): 400 bad JSON, 404, 405, 406, 415, MethodArgumentNotValidException …
  ├── HandlerMethodValidationException / ConstraintViolationException → 400 + field errors
  ├── ResourceNotFoundException          → 404
  ├── DuplicateResourceException          → 409
  ├── BusinessRuleException               → 422
  ├── ObjectOptimisticLockingFailureException → 409 "modified concurrently, reload"
  ├── DataIntegrityViolationException     → 409 (no SQL in the message)
  ├── AccessDeniedException (method security) → 403
  └── Exception (fallback)                → 500 "Unexpected error", logged at ERROR with traceId
        │
        ▼
ProblemDetail JSON (application/problem+json)
```

## How It Works

A compact, runnable version of this architecture:

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.RequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

public class GlobalExceptionHandlingDemo {

    // ---- Domain exceptions ----
    static abstract class ApplicationException extends RuntimeException {
        private final String code;

        ApplicationException(String code, String message) {
            super(message);
            this.code = code;
        }

        String code() {
            return code;
        }
    }

    static class ResourceNotFoundException extends ApplicationException {
        ResourceNotFoundException(String resource, Object id) {
            super("NOT_FOUND", resource + " " + id + " was not found");
        }
    }

    static class BusinessRuleException extends ApplicationException {
        BusinessRuleException(String code, String message) {
            super(code, message);
        }
    }

    // ---- Controller ----
    @RestController
    static class OrderController {
        @GetMapping("/api/orders/{id}")
        String get(@PathVariable long id) {
            if (id == 404) {
                throw new ResourceNotFoundException("Order", id);
            }
            if (id == 422) {
                throw new BusinessRuleException("ORDER_SHIPPED", "Order " + id + " has already shipped");
            }
            if (id == 500) {
                throw new IllegalStateException("connection pool exhausted");   // internal detail
            }
            return "order " + id;
        }
    }

    // ---- Global handler ----
    @RestControllerAdvice
    static class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        ProblemDetail notFound(ResourceNotFoundException ex) {
            return problem(HttpStatus.NOT_FOUND, "Resource not found", ex);
        }

        @ExceptionHandler(BusinessRuleException.class)
        ProblemDetail businessRule(BusinessRuleException ex) {
            return problem(HttpStatus.UNPROCESSABLE_CONTENT, "Business rule violated", ex);   // Spring 6: UNPROCESSABLE_ENTITY
        }

        @ExceptionHandler(Exception.class)
        ProblemDetail unexpected(Exception ex) {
            // log.error("Unexpected error", ex);  -- log the details, never return them
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                    "An unexpected error occurred");
            pd.setTitle("Internal error");
            return pd;
        }

        private static ProblemDetail problem(HttpStatus status, String title, ApplicationException ex) {
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
            pd.setTitle(title);
            pd.setType(URI.create("https://api.shop.example/problems/" + ex.code().toLowerCase().replace('_', '-')));
            pd.setProperty("code", ex.code());
            return pd;
        }
    }

    static void call(MockMvc mvc, RequestBuilder request) throws Exception {
        var response = mvc.perform(request).andReturn().getResponse();
        System.out.println(response.getStatus() + " " + response.getContentAsString());
    }

    public static void main(String[] args) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new OrderController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        call(mvc, get("/api/orders/7"));
        call(mvc, get("/api/orders/404"));
        call(mvc, get("/api/orders/422"));
        call(mvc, get("/api/orders/500"));
        call(mvc, delete("/api/orders/7"));          // 405, handled by ResponseEntityExceptionHandler
    }
}
```

**Output:**

```text
200 order 7
404 {"detail":"Order 404 was not found","instance":"/api/orders/404","status":404,"title":"Resource not found","type":"https://api.shop.example/problems/not-found","code":"NOT_FOUND"}
422 {"detail":"Order 422 has already shipped","instance":"/api/orders/422","status":422,"title":"Business rule violated","type":"https://api.shop.example/problems/order-shipped","code":"ORDER_SHIPPED"}
500 {"detail":"An unexpected error occurred","instance":"/api/orders/500","status":500,"title":"Internal error"}
405 {"detail":"Method 'DELETE' is not supported.","instance":"/api/orders/7","status":405,"title":"Method Not Allowed"}
```

Notice that the 500 response does not contain "connection pool exhausted", and that the 405 came from the inherited `ResponseEntityExceptionHandler` without any code of ours.

## Validation Exception Handling

When extending `ResponseEntityExceptionHandler`, `MethodArgumentNotValidException` and `HandlerMethodValidationException` are already handled; override the corresponding methods to add field errors:

```java
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
class ValidationAwareHandler extends ResponseEntityExceptionHandler {

    record FieldViolation(String field, String message) {
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers, HttpStatusCode status,
                                                                  WebRequest request) {
        ProblemDetail problem = ex.getBody();                       // already a 400 ProblemDetail
        problem.setTitle("Validation failed");
        List<FieldViolation> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new FieldViolation(e.getField(), e.getDefaultMessage()))
                .toList();
        problem.setProperty("errors", errors);
        return handleExceptionInternal(ex, problem, headers, status, request);
    }
}
```

Also add a handler for `ConstraintViolationException` (service-level `@Validated`), which the base class does not cover.

## HTTP Error Mapping

| Exception | Status |
|-----------|--------|
| `MethodArgumentNotValidException`, `HandlerMethodValidationException`, `ConstraintViolationException` | 400 |
| `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`, `MissingServletRequestParameterException` | 400 |
| `AuthenticationException` (normally handled by Spring Security's entry point) | 401 |
| `AccessDeniedException` | 403 |
| `ResourceNotFoundException`, `NoResourceFoundException` | 404 |
| `HttpRequestMethodNotSupportedException` | 405 |
| `HttpMediaTypeNotSupportedException` | 415 |
| `DuplicateResourceException`, `DataIntegrityViolationException`, `ObjectOptimisticLockingFailureException` | 409 |
| `BusinessRuleException` | 422 (or 409) |
| `MaxUploadSizeExceededException` | 413 |
| Downstream service unavailable / timed out | 503 / 504 |
| Anything else | 500 |

## Exception Handling Best Practices

1. **One global handler** (`@RestControllerAdvice` extending `ResponseEntityExceptionHandler`) and one error format (ProblemDetail).
2. **Domain exceptions** extending `RuntimeException`, grouped into a few categories.
3. **Never leak internals** — stack traces, SQL, class names, file paths stay in logs.
4. **Log by severity**: expected client errors (404, 400) at `WARN`/`INFO` without stack traces; unexpected 500s at `ERROR` with stack traces and a trace/correlation id that also appears in the response.
5. **Do not catch-and-ignore** in services; let exceptions reach the handler (and roll back transactions).
6. **Handle filter-level errors separately** — `@ControllerAdvice` does not see exceptions from servlet filters; Spring Security uses `AuthenticationEntryPoint` (401) and `AccessDeniedHandler` (403).
7. **Document error types** in OpenAPI.
8. **Test** error paths with `@WebMvcTest`/`MockMvc`.

## Internal Behavior

- `ExceptionHandlerExceptionResolver` looks for a matching `@ExceptionHandler` in the controller class first, then in `@ControllerAdvice` beans in `@Order`, choosing the closest exception type match (`ExceptionDepthComparator`). It also matches on the **cause** of a wrapped exception.
- If the response is already committed (body partly written), the handler cannot change it.
- Exceptions thrown inside an `@ExceptionHandler` itself are not handled again — they become 500.
- Method-security `AccessDeniedException` thrown from a controller method **does** reach `@ControllerAdvice`; a catch-all `@ExceptionHandler(Exception.class)` would turn it into 500 unless you handle `AccessDeniedException` explicitly (or rethrow it).

## Common Mistakes

- Catch-all handler that swallows `AccessDeniedException`/`AuthenticationException` and returns 500.
- Different advice classes returning different error shapes.
- Expecting `@ControllerAdvice` to handle JWT filter exceptions.
- Returning `ex.getMessage()` for every exception, including database errors.
- Forgetting `@ResponseBody` with `@ControllerAdvice` (use `@RestControllerAdvice`).

## Common Interview Traps

- **"@ControllerAdvice handles every exception in the application."** Only exceptions raised during `DispatcherServlet` handler processing — not filters, not `@Async` threads, not scheduled jobs.
- **"A global handler overrides a controller's own @ExceptionHandler."** The controller-local handler wins.
- **"@ControllerAdvice and @RestControllerAdvice differ in which exceptions they catch."** They differ only in how return values are rendered.

## Key Takeaways

- `@ExceptionHandler` (local) → `@RestControllerAdvice` (global) → `ProblemDetail` responses.
- Extend `ResponseEntityExceptionHandler` to get standard Spring MVC errors mapped for free; add domain, validation, data and security mappings plus a safe 500 fallback.
- Consistent format, safe messages, severity-based logging with trace ids.

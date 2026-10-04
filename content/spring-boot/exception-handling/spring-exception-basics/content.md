# Exceptions in Spring Boot

**Module:** Exception Handling · **Interview priority:** Core

## Definition

An exception thrown while handling a request propagates up through the service and controller to the `DispatcherServlet`. If no handler maps it, Spring Boot's **default error handling** forwards the request to `/error` (`BasicErrorController`), which returns a generic JSON body (or the "Whitelabel Error Page" for browsers) with status 500 — or the status the exception declares. **Custom exceptions** let your code express domain failures (`ResourceNotFoundException`, `InsufficientStockException`) that are later mapped to meaningful HTTP responses.

## Why It Matters

- Unhandled exceptions become 500s, hide real causes from clients and trigger false alerts.
- "Checked vs unchecked exceptions" and "Why does Spring prefer unchecked exceptions?" are standard Java/Spring questions — and the answer affects `@Transactional` rollback.
- A clean exception hierarchy is the foundation of [Global Exception Handling](../global-exception-handling/content.md).

## Exceptions in Spring Boot

What the client receives for an unhandled `RuntimeException` (Boot defaults):

```json
{
  "timestamp": "2026-10-04T09:15:30.123+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "path": "/api/orders/42"
}
```

- The exception **message** and **stack trace** are **not** included by default (`server.error.include-message=never`, `server.error.include-stacktrace=never`) — keep it that way in production.
- `server.error.whitelabel.enabled=false` disables the HTML whitelabel page.
- With `spring.mvc.problemdetails.enabled=true`, Spring MVC's own exceptions (400s, 404, 405, 415…) are rendered as RFC 9457 `application/problem+json`.

How Spring resolves an exception, in order:

1. **`ExceptionHandlerExceptionResolver`** — an `@ExceptionHandler` in the controller, then in `@ControllerAdvice` classes.
2. **`ResponseStatusExceptionResolver`** — `@ResponseStatus` on the exception class, or a `ResponseStatusException`.
3. **`DefaultHandlerExceptionResolver`** — standard Spring MVC exceptions → 400/404/405/406/415/…
4. Nothing matched → the servlet container's error dispatch to `/error` → `BasicErrorController` → 500.

## Checked vs Unchecked Exceptions

| Aspect | Checked (`Exception` subclasses, not `RuntimeException`) | Unchecked (`RuntimeException`, `Error`) |
|--------|-----------------------------------------------------------|------------------------------------------|
| Compiler | Must be caught or declared with `throws` | No requirement |
| Examples | `IOException`, `SQLException`, `Exception` itself | `IllegalArgumentException`, `NullPointerException`, `DataAccessException` |
| Intended for | Recoverable conditions the caller must handle | Programming errors and conditions the caller usually cannot fix |
| `@Transactional` default | **No rollback** (commits!) | **Rollback** |
| Spring's style | Wrapped/translated | Preferred (`DataAccessException` hierarchy) |
| Lambdas/streams | Awkward (cannot throw from `Function`) | Fine |

Why Spring prefers unchecked: most data-access failures (connection lost, constraint violated) cannot be fixed by the immediate caller; forcing every layer to declare `throws SQLException` couples all code to JDBC. Spring translates them into the unchecked `DataAccessException` hierarchy, and only the layer that can respond (a global handler, a retry) catches them.

## RuntimeException

`RuntimeException` is the base class of unchecked exceptions. Custom application exceptions usually extend it so they:

- propagate without polluting method signatures,
- roll back `@Transactional` methods by default,
- reach the global exception handler.

## Custom Exceptions

Design a small hierarchy that maps cleanly to HTTP semantics:

```java
// Base class: carries a machine-readable error code for clients and logs.
public abstract class ApplicationException extends RuntimeException {
    private final String code;

    protected ApplicationException(String code, String message) {
        super(message);
        this.code = code;
    }

    protected ApplicationException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}

class ResourceNotFoundException extends ApplicationException {          // → 404
    ResourceNotFoundException(String resource, Object id) {
        super("NOT_FOUND", resource + " " + id + " was not found");
    }
}

class DuplicateResourceException extends ApplicationException {         // → 409
    DuplicateResourceException(String message) {
        super("DUPLICATE", message);
    }
}

class BusinessRuleException extends ApplicationException {              // → 422 (or 409)
    BusinessRuleException(String code, String message) {
        super(code, message);
    }
}

class InsufficientStockException extends BusinessRuleException {
    InsufficientStockException(long productId, int requested, int available) {
        super("INSUFFICIENT_STOCK",
                "Product " + productId + ": requested " + requested + ", available " + available);
    }
}
```

Usage in a service:

```java
import java.util.Map;

class InventoryService {
    private final Map<Long, Integer> stock = Map.of(1L, 3);

    void reserve(long productId, int quantity) {
        Integer available = stock.get(productId);
        if (available == null) {
            throw new ResourceNotFoundException("Product", productId);
        }
        if (available < quantity) {
            throw new InsufficientStockException(productId, quantity, available);
        }
    }
}
```

Guidelines:

- Name exceptions after **what went wrong in the domain**, not after HTTP (`OrderNotCancellableException`, not `BadRequest409Exception`).
- Keep messages safe to show (no SQL, no secrets); log details server-side.
- **Wrap** lower-level exceptions with a cause (`new PaymentGatewayException("…", e)`) instead of losing the stack trace.
- Do not use exceptions for normal control flow (e.g. "user not found → create user" should be an `Optional` check).

### Mapping options

| Option | How | Trade-off |
|--------|-----|-----------|
| `@ResponseStatus(HttpStatus.NOT_FOUND)` on the class | Status only | Simple; no custom body; couples exception to HTTP |
| `throw new ResponseStatusException(HttpStatus.NOT_FOUND, "…")` | Inline | Quick; HTTP concerns leak into services |
| `@ExceptionHandler` in `@RestControllerAdvice` | Central mapping to `ProblemDetail` | Best for real applications |

## Common Mistakes

- Catching `Exception` and returning `null` or an empty object — the client sees "success" with wrong data.
- `catch (Exception e) { throw new RuntimeException(e.getMessage()); }` — loses the original exception type and stack trace.
- Logging and rethrowing at every layer — the same error appears five times in logs.
- Throwing checked exceptions from `@Transactional` methods and expecting rollback.
- Exposing `e.getMessage()` of low-level exceptions (SQL, file paths) to clients.

## Common Interview Traps

- **"Spring rolls back on any exception."** By default only on unchecked exceptions (`RuntimeException`, `Error`).
- **"Checked exceptions are bad."** They are appropriate where the caller can meaningfully recover; Spring simply avoids forcing them through layers that cannot.
- **"The whitelabel page means the app crashed."** It means an error was not handled by your code and Boot's fallback rendered it.

## Key Takeaways

- Unhandled exceptions → `/error` → generic body, usually 500. Handle them deliberately.
- Checked = compiler-enforced; unchecked = `RuntimeException`. Spring and `@Transactional` favour unchecked.
- Build a small domain exception hierarchy extending `RuntimeException` and map it centrally.

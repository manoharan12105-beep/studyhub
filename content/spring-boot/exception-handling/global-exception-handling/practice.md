# Global Exception Handling with @RestControllerAdvice — Practice

### P1. Most specific handler

**Difficulty:** Easy · **Type:** MCQ

An advice has handlers for `RuntimeException`, `ApplicationException` and `BusinessRuleException`. `InsufficientStockException extends BusinessRuleException extends ApplicationException extends RuntimeException` is thrown. Which handler runs?

- A) `RuntimeException`
- B) `ApplicationException`
- C) `BusinessRuleException`
- D) All three, in order

<details>
<summary>Answer</summary>

**Answer:** C) `BusinessRuleException`

**Explanation:** The handler for the closest superclass of the thrown exception is chosen; only one handler runs.

</details>

### P2. Not caught

**Difficulty:** Medium · **Type:** Debugging

`@RestControllerAdvice` handles `TokenExpiredException`, yet expired tokens still produce Spring Security's default 401 without your JSON body. The exception is thrown in `JwtAuthenticationFilter`. Explain and fix.

<details>
<summary>Answer</summary>

The filter runs before the `DispatcherServlet`, outside the advice's reach. Either configure a custom `AuthenticationEntryPoint` in the `SecurityFilterChain` that writes the 401 ProblemDetail, or catch the exception in the filter and delegate to the injected `HandlerExceptionResolver` so the advice handles it.

</details>

### P3. Write the handler

**Difficulty:** Medium · **Type:** Coding

Add a handler mapping `ObjectOptimisticLockingFailureException` to 409 with a message telling the client to reload.

<details>
<summary>Answer</summary>

```java
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class ConcurrencyExceptionHandler {

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ProblemDetail onOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "The resource was modified by someone else. Reload it and try again.");
        problem.setTitle("Concurrent modification");
        return problem;
    }
}
```

</details>

### P4. Review the advice

**Difficulty:** Hard · **Type:** Code analysis

```java
@RestControllerAdvice
class Handler {
    @ExceptionHandler(Exception.class)
    ResponseEntity<String> all(Exception ex) {
        return ResponseEntity.status(500).body(ex.getMessage());
    }
}
```

List the problems.

<details>
<summary>Answer</summary>

Every error becomes 500, including validation (400), not-found (404), access denied (403) and Spring MVC errors (405/415); raw exception messages leak internals (SQL, hostnames); the body is plain text with no consistent structure; nothing is logged; and no trace id links the response to logs. Extend `ResponseEntityExceptionHandler`, add category handlers, return `ProblemDetail`, keep a safe 500 fallback that logs at ERROR.

</details>

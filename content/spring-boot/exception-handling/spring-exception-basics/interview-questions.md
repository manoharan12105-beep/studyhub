# Exceptions in Spring Boot — Interview Questions

## Beginner

### Q1. What is the difference between checked and unchecked exceptions?

<details>
<summary>Answer</summary>

Checked exceptions (subclasses of `Exception` but not `RuntimeException`) must be caught or declared with `throws`; the compiler enforces it. Unchecked exceptions (`RuntimeException` and `Error` subclasses) need no declaration. Checked exceptions model recoverable conditions; unchecked ones model programming errors or failures the immediate caller cannot handle.

</details>

### Q2. What happens when a controller throws an exception that nobody handles?

<details>
<summary>Answer</summary>

Spring's exception resolvers find no handler, so the servlet container dispatches to Spring Boot's `/error` endpoint (`BasicErrorController`), which returns a JSON body with timestamp, status, error and path (or the Whitelabel HTML page for browsers), typically with status 500. The message and stack trace are excluded by default.

</details>

### Q3. Why do custom exceptions usually extend `RuntimeException`?

<details>
<summary>Answer</summary>

So they do not have to be declared through every layer, so they trigger `@Transactional` rollback by default, and so they propagate to a central `@RestControllerAdvice` that maps them to HTTP responses.

</details>

## Intermediate

### Q4. Why does Spring convert `SQLException` into `DataAccessException`?

<details>
<summary>Answer</summary>

`SQLException` is checked and vendor-specific (error codes differ between databases). Spring translates it into an unchecked, technology-neutral hierarchy (`DuplicateKeyException`, `DataIntegrityViolationException`, `CannotAcquireLockException`…), so services are not coupled to JDBC or a database vendor and are not forced to declare exceptions they cannot handle.

</details>

### Q5. What are the ways to map an exception to an HTTP status in Spring?

<details>
<summary>Answer</summary>

`@ResponseStatus` on the exception class; throwing `ResponseStatusException` with a status; or an `@ExceptionHandler` method (in the controller or a `@ControllerAdvice`) that returns a `ResponseEntity`/`ProblemDetail`. Central `@ExceptionHandler` methods are preferred because they control the body and keep HTTP concerns out of the domain.

</details>

### Q6. What is wrong with `catch (Exception e) { throw new RuntimeException(e.getMessage()); }`?

<details>
<summary>Answer</summary>

It discards the original exception type and stack trace (the cause is not passed), so logs show where it was rethrown rather than where it failed, and handlers can no longer distinguish error types. Wrap with the cause (`new PaymentException("Charge failed", e)`) or let the exception propagate.

</details>

## Advanced

### Q7. A `@Transactional` method throws a checked `InsufficientFundsException` after debiting an account. What happens to the debit?

<details>
<summary>Answer</summary>

It is committed. By default Spring rolls back only for unchecked exceptions and errors; a checked exception propagates but the transaction commits. Use `@Transactional(rollbackFor = InsufficientFundsException.class)`, make the exception unchecked, or (Spring 6.2+) configure `@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)`.

</details>

### Q8. How would you design an exception hierarchy for a Spring Boot service?

<details>
<summary>Answer</summary>

A base `ApplicationException extends RuntimeException` carrying a stable error code, and a few categories that map to HTTP semantics: not found (404), conflict/duplicate (409), business rule violation (422/409), forbidden (403), external dependency failure (502/503). Domain-specific exceptions extend these. A single `@RestControllerAdvice` maps categories to `ProblemDetail`, logs unexpected exceptions at ERROR and expected ones at lower levels, and never leaks internal messages.

</details>

# Last-Minute Traps

The behaviour questions most often answered wrongly. Read these just before the interview.

## Proxies

- `this.method()` bypasses every proxy: no `@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`, `@Retryable`.
- Private and final methods are never advised.
- Fields read on a CGLIB proxy are `null`; use methods.
- An object created with `new` is not a bean — annotations do nothing, `@Autowired` fields stay `null`.

## Beans and Configuration

- `@Primary` beats a matching parameter name; `@Qualifier` beats `@Primary`.
- A prototype injected into a singleton is created once.
- Lite-mode `@Bean` calls create extra instances.
- Boot forbids circular references, even field/setter cycles.
- Env vars beat `application.yml`; command-line args beat env vars.

## Transactions and JPA

- Checked exception → **commit** by default.
- Inner REQUIRED failure caught by outer → `UnexpectedRollbackException`.
- `readOnly = true` → changes to managed entities are not flushed.
- No `save()` needed for managed entities — dirty checking at flush.
- `merge` returns a new managed instance; keep using the returned one.
- IDENTITY → INSERT at `persist`; SEQUENCE → at flush.
- 10 parents + lazy collection in a loop = 11 queries; batch size 25 → 2.
- Collection fetch join + paging → in-memory pagination warning.

## Web and Security

- `@NotEmpty` accepts `"   "`; `@NotBlank` rejects it.
- Nested DTOs validate only with `@Valid` on the field.
- `@ControllerAdvice` never sees filter exceptions.
- Invalid/expired JWT → 401; valid token, wrong role → 403.
- A catch-all `@ExceptionHandler(Exception.class)` turns `@PreAuthorize` denials into 500.
- Preflight `OPTIONS` passes before authentication only with `http.cors()`.
- JWT payload is readable by anyone — never put secrets in it.

## Production

- Only `/actuator/health` is exposed by default.
- `@Scheduled` uses a single thread by default.
- Multipart defaults: 1MB per file, 10MB per request.
- Events are synchronous; `@TransactionalEventListener` skips on rollback.
- `@Retryable(maxRetries = 2)` = 3 calls, then the last exception is rethrown.

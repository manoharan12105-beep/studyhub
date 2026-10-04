# HTTP Status Codes

**Module:** REST API Development · **Interview priority:** Core

## Definition

An **HTTP status code** is the three-digit number in a response that tells the client the outcome of its request. The first digit is the class: **1xx** informational, **2xx** success, **3xx** redirection, **4xx** client error (the request is wrong), **5xx** server error (the server failed on a valid request).

## Why It Matters

- Clients, gateways, monitoring and retry logic act on status codes, not on message text: a 5xx may be retried, a 4xx should not; error-rate alerts count 5xx.
- 401 vs 403, 400 vs 422, 200 vs 201 vs 204 are favourite interview comparisons.

## HTTP Status Codes

### 2xx — success

| Code | Name | Use |
|------|------|-----|
| 200 | OK | Successful GET; PUT/PATCH returning the updated resource |
| 201 | Created | POST (or PUT) created a resource; include `Location` |
| 202 | Accepted | Request accepted for asynchronous processing (report generation, bulk import) |
| 204 | No Content | Success with no body (DELETE, PUT without returning data) |

### 3xx — redirection

| Code | Use |
|------|-----|
| 301 / 308 | Permanent move (308 keeps the method) |
| 302 / 307 | Temporary redirect (307 keeps the method) |
| 304 Not Modified | Conditional GET (`If-None-Match` with an `ETag`) — use the cached copy |

### 4xx — client errors

| Code | Name | Use |
|------|------|-----|
| 400 | Bad Request | Malformed JSON, invalid parameters, validation failure |
| 401 | Unauthorized | **Not authenticated**: missing, invalid or expired credentials/token |
| 403 | Forbidden | **Authenticated but not allowed** |
| 404 | Not Found | Resource does not exist (or is hidden from this user) |
| 405 | Method Not Allowed | Wrong HTTP method for the URI |
| 406 | Not Acceptable | Cannot produce a format from the `Accept` header |
| 409 | Conflict | State conflict: duplicate unique value, optimistic-lock failure, invalid state transition |
| 410 | Gone | Resource permanently removed |
| 412 | Precondition Failed | `If-Match` ETag does not match (concurrent modification) |
| 413 | Content Too Large | Upload exceeds the limit |
| 415 | Unsupported Media Type | `Content-Type` not supported |
| 422 | Unprocessable Content | Well-formed request that violates business rules (some APIs use it for validation) |
| 429 | Too Many Requests | Rate limit exceeded; add `Retry-After` |

### 5xx — server errors

| Code | Use |
|------|-----|
| 500 Internal Server Error | Unexpected exception — a bug or unhandled failure |
| 502 Bad Gateway | A gateway/proxy received an invalid response from upstream |
| 503 Service Unavailable | Overloaded, in maintenance, or not ready; may include `Retry-After` |
| 504 Gateway Timeout | Upstream did not respond in time |

## 200 vs 201 vs 204

| | 200 OK | 201 Created | 204 No Content |
|--|--------|-------------|----------------|
| Meaning | Success | New resource created | Success, nothing to return |
| Body | Usually yes | Usually the created resource | **Must be empty** |
| Extra header | — | `Location: /api/orders/42` | — |
| Typical method | GET, PUT, PATCH | POST (PUT creating) | DELETE, PUT/PATCH without body |
| Spring | `ResponseEntity.ok(body)` | `ResponseEntity.created(uri).body(dto)` | `ResponseEntity.noContent().build()` |

## 400 vs 401 vs 403 vs 404

| Code | Question it answers | Example |
|------|---------------------|---------|
| 400 | Is the request itself valid? — **No** | `"quantity": "abc"`, missing required field |
| 401 | Do we know **who** you are? — **No** | No `Authorization` header, expired JWT |
| 403 | Are you **allowed** to do this? — **No** | Customer calling `DELETE /admin/users/5` |
| 404 | Does the resource exist (for you)? — **No** | `GET /orders/99999` |

## 401 vs 403

| Aspect | 401 Unauthorized | 403 Forbidden |
|--------|------------------|---------------|
| Real meaning | Unauthenticated | Unauthorized (authenticated, lacks permission) |
| Will retrying with credentials help? | Yes — log in / refresh the token | No — same identity is still not allowed |
| Header | `WWW-Authenticate` (e.g. `Bearer`) | — |
| In Spring Security | `AuthenticationEntryPoint` | `AccessDeniedHandler` |
| Client reaction | Redirect to login / refresh token | Show "access denied" |

The names are historical: "401 Unauthorized" really means *unauthenticated*. Some APIs return **404 instead of 403** to avoid revealing that a resource exists (e.g. another user's order).

## Mapping Exceptions to Status Codes (Spring)

| Situation | Status | Typical exception |
|-----------|--------|-------------------|
| `@Valid` failure | 400 | `MethodArgumentNotValidException` |
| Unreadable JSON | 400 | `HttpMessageNotReadableException` |
| Parameter type mismatch | 400 | `MethodArgumentTypeMismatchException` |
| Resource not found | 404 | Your `ResourceNotFoundException` |
| Duplicate email | 409 | Your `DuplicateResourceException` / `DataIntegrityViolationException` |
| Optimistic lock | 409 | `ObjectOptimisticLockingFailureException` |
| Business rule violated | 409 or 422 | Your `BusinessRuleException` |
| Unexpected | 500 | Anything else — log it |

The full handler architecture is in [Global Exception Handling](../../exception-handling/global-exception-handling/content.md).

## Common Mistakes

- 200 with `{"success": false}` for errors — monitoring and clients cannot see failures.
- 500 for client mistakes (unhandled validation or not-found exceptions).
- 403 for a missing/expired token (should be 401), or 401 for a role problem (should be 403).
- 204 with a body.
- Exposing stack traces in 500 responses.

## Common Interview Traps

- **"401 means the user lacks permission."** That is 403; 401 means not authenticated.
- **"Validation errors must be 422."** Both 400 and 422 are used; Spring defaults to 400. Be consistent and document it.
- **"404 is only for wrong URLs."** It is also correct for a valid URL whose resource does not exist.

## Key Takeaways

- 2xx success (200 read/update, 201 create + Location, 204 no body), 4xx client fault, 5xx server fault.
- 401 = who are you? 403 = you may not. 400 = bad request. 404 = no such resource. 409 = state conflict.
- Map exceptions to statuses centrally; never hide errors behind 200.

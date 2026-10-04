# HTTP Status Codes — Interview Questions

## Beginner

### Q1. What is the difference between 401 and 403?

<details>
<summary>Answer</summary>

401 Unauthorized means the request is not authenticated — credentials are missing, invalid or expired, and authenticating may help. 403 Forbidden means the server knows who you are but you are not permitted — re-authenticating will not help. In Spring Security, 401 comes from the `AuthenticationEntryPoint` and 403 from the `AccessDeniedHandler`.

</details>

### Q2. When do you return 201 and when 204?

<details>
<summary>Answer</summary>

201 Created when a request creates a resource, usually with the new resource in the body and a `Location` header with its URI. 204 No Content when the request succeeded and there is nothing to return, such as a DELETE or an update that returns no body.

</details>

### Q3. What do the status code classes mean?

<details>
<summary>Answer</summary>

1xx informational, 2xx success, 3xx redirection, 4xx client error (fix the request), 5xx server error (the server failed to process a valid request).

</details>

## Intermediate

### Q4. A user registers with an email that already exists. Which status do you return?

<details>
<summary>Answer</summary>

409 Conflict — the request is well-formed but conflicts with the current state (a unique constraint). Return a problem body explaining the field. Some teams use 422; avoid 400 (the request is syntactically valid) and never 500 (which is what an unhandled `DataIntegrityViolationException` would produce).

</details>

### Q5. 400 or 422 for validation errors?

<details>
<summary>Answer</summary>

Both are used. 400 is Spring's default for `MethodArgumentNotValidException` and is widely understood. 422 Unprocessable Content distinguishes "syntactically fine but semantically invalid". Pick one convention, document it and apply it consistently through global exception handling.

</details>

### Q6. Why might an API return 404 instead of 403 for another user's order?

<details>
<summary>Answer</summary>

To avoid leaking the existence of resources: a 403 confirms that order 1234 exists, which helps attackers enumerate ids. Returning 404 for resources the caller may not see treats them as nonexistent from that caller's perspective.

</details>

### Q7. What is the difference between 502, 503 and 504?

<details>
<summary>Answer</summary>

502 Bad Gateway: a proxy/gateway got an invalid response from the upstream service (crashed, wrong protocol). 503 Service Unavailable: the service itself is temporarily unable to handle requests (overload, maintenance, not ready). 504 Gateway Timeout: the gateway did not get an upstream response in time.

</details>

## Advanced

### Q8. How would you use status codes to handle concurrent updates?

<details>
<summary>Answer</summary>

Return an `ETag` (for example from the entity's `@Version`) with GET. Clients send `If-Match: <etag>` with PUT/PATCH; if the resource changed in between, respond 412 Precondition Failed. Without conditional requests, optimistic-lock failures detected by JPA (`ObjectOptimisticLockingFailureException`) are mapped to 409 Conflict. Clients then reload and retry.

</details>

### Q9. Your error-rate dashboard shows a spike of 500s after a deployment, but users report "invalid input" messages. What is likely wrong?

<details>
<summary>Answer</summary>

Client errors are being reported as 500 — for example a new validation or business exception is not mapped by the global exception handler, so it falls through to the generic 500 handler. Map it to 400/409/422. This matters because 5xx triggers alerts and retries, while 4xx should not.

</details>

# HTTP Status Codes — Interview Questions

## Beginner

### Q1. What are the classes of HTTP status codes?

<details>
<summary>Answer</summary>

1xx informational, 2xx success, 3xx redirection, 4xx client error (the request is wrong), 5xx server error (a valid request failed on the server).

</details>

### Q2. What is the difference between 401 and 403?

**Style:** Comparison

<details>
<summary>Answer</summary>

401 Unauthorized means the request is not authenticated — credentials are missing, invalid or expired; the client should log in or refresh its token. 403 Forbidden means the server knows who the client is, but that identity lacks permission; logging in again does not help.

</details>

### Q3. Which status codes would you return for create, read, update and delete in a REST API?

<details>
<summary>Answer</summary>

Create (POST): 201 Created with a `Location` header. Read (GET): 200, or 404 if missing. Update (PUT/PATCH): 200 with the resource or 204 without a body. Delete: 204 No Content (404 if it never existed, though repeated deletes may also return 204 depending on design). Validation errors: 400 (or 422); conflicts: 409.

</details>

## Intermediate

### Q4. Explain 502, 503 and 504.

**Style:** Comparison

<details>
<summary>Answer</summary>

All usually come from a proxy or load balancer about its upstream. 502 Bad Gateway: the upstream returned an invalid response or closed/reset the connection. 503 Service Unavailable: no capacity — no healthy backends, overload or maintenance (often with `Retry-After`). 504 Gateway Timeout: the upstream did not respond within the proxy's timeout.

</details>

### Q5. What is the difference between 301, 302, 307 and 308?

<details>
<summary>Answer</summary>

301 and 308 are permanent redirects (clients and search engines should update the URL); 302 and 307 are temporary. 307 and 308 require the client to repeat the same method and body; with 301 and 302, browsers may change a POST into a GET.

</details>

### Q6. What does 304 Not Modified mean?

<details>
<summary>Answer</summary>

The client made a conditional request (`If-None-Match` with an ETag, or `If-Modified-Since`) and the resource has not changed, so the server sends no body and the client uses its cached copy — saving bandwidth.

</details>

## Advanced

### Q7. Users report intermittent 504 errors on one API endpoint behind a load balancer. How do you investigate?

**Style:** Debugging

<details>
<summary>Answer</summary>

504 means the backend did not answer before the load balancer's timeout. Check which requests are slow (endpoint logs, latency metrics, traces), whether the backend is blocked (thread pool exhaustion, database slow queries, connection pool waits, downstream calls without timeouts, GC pauses), and compare the LB timeout with the backend's processing time. Fix the slow path, add timeouts to downstream calls, scale, or move long work to async processing (202 + polling).

</details>

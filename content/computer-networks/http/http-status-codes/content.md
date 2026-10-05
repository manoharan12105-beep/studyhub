# HTTP Status Codes

**Module:** HTTP · **Interview priority:** Core

## What Is It?

Every HTTP response starts with a three-digit **status code**. The first digit is the **class**:

| Class | Meaning | Think of it as |
|-------|---------|----------------|
| **1xx** Informational | Request received, continue | "Hold on…" |
| **2xx** Success | It worked | "Here you go" |
| **3xx** Redirection | Look somewhere else / use your cached copy | "Go over there" |
| **4xx** Client error | The **request** is wrong | "You made a mistake" |
| **5xx** Server error | The **server** failed on a valid request | "I made a mistake" |

## Why It Exists

Clients, proxies, caches, monitoring and retry logic all need to know the outcome **without reading the body**. A browser follows a 301, a cache stores a 200, a client retries a 503 but not a 400, and a dashboard counts 5xx as errors. The class alone tells them whose fault it is and what to do.

## The Codes to Know

### 1xx — Informational

| Code | Meaning |
|------|---------|
| 100 Continue | Server is ready for the (large) body the client announced with `Expect: 100-continue` |
| 101 Switching Protocols | Connection upgraded, e.g. to WebSocket |
| 103 Early Hints | Preload hints sent before the final response |

### 2xx — Success

| Code | Meaning | Typical use |
|------|---------|-------------|
| **200 OK** | Success with a body | GET, PUT/PATCH returning the resource |
| **201 Created** | A resource was created; `Location` header points to it | POST |
| **202 Accepted** | Accepted for asynchronous processing, not done yet | Queued jobs |
| **204 No Content** | Success, no body | DELETE, PUT/PATCH without a response body |
| 206 Partial Content | Part of the resource (`Range` request) | Resumed downloads, video seeking |

### 3xx — Redirection

| Code | Meaning | Method on redirect |
|------|---------|--------------------|
| **301 Moved Permanently** | Resource has a new permanent URL (browsers/SEO update) | May change POST → GET |
| **302 Found** | Temporary redirect | May change POST → GET |
| 303 See Other | Go GET this other URL (e.g. after a form POST) | GET |
| **304 Not Modified** | Your cached copy is still valid (conditional GET) — no body | — |
| 307 Temporary Redirect | Temporary; **keep the same method and body** | Same |
| 308 Permanent Redirect | Permanent; keep the same method and body | Same |

### 4xx — Client errors

| Code | Meaning | Example |
|------|---------|---------|
| **400 Bad Request** | Malformed or invalid request | Invalid JSON, failed `@Valid` validation |
| **401 Unauthorized** | Not **authenticated**: no or invalid credentials | Missing/expired token; response includes `WWW-Authenticate` |
| **403 Forbidden** | Authenticated, but **not allowed** | User lacks the ADMIN role |
| **404 Not Found** | No resource at this URL | `/api/orders/999` |
| **405 Method Not Allowed** | URL exists, method not supported | `DELETE` on a read-only endpoint; includes `Allow` |
| 406 Not Acceptable | Cannot produce the format in `Accept` | Client wants XML only |
| 408 Request Timeout | Client took too long to send the request | |
| **409 Conflict** | Conflicts with current state | Duplicate username, optimistic-lock version mismatch |
| 410 Gone | Removed permanently | |
| 413 Content Too Large | Body too big | Upload limit exceeded |
| 415 Unsupported Media Type | Wrong `Content-Type` | Sending XML to a JSON-only endpoint |
| **422 Unprocessable Content** | Syntax fine, semantics invalid | Business validation errors (some APIs use 400) |
| **429 Too Many Requests** | Rate limited; may include `Retry-After` | API quota exceeded |

### 5xx — Server errors

| Code | Meaning | Typical cause |
|------|---------|---------------|
| **500 Internal Server Error** | Unhandled error in the server | Uncaught exception, bug |
| 501 Not Implemented | Server does not support the method/feature | |
| **502 Bad Gateway** | A proxy/load balancer got an **invalid response** from the upstream | Backend crashed, reset the connection, or returned garbage |
| **503 Service Unavailable** | Temporarily cannot handle the request | Overloaded, maintenance, no healthy backends; may include `Retry-After` |
| **504 Gateway Timeout** | A proxy/load balancer got **no response in time** from the upstream | Backend too slow, stuck, or unreachable |

## 401 vs 403

| | 401 Unauthorized | 403 Forbidden |
|---|------------------|---------------|
| Question | "Who are you?" | "I know who you are — no." |
| Cause | Missing, invalid or expired credentials | Valid identity without permission |
| Fix by client | Log in / refresh the token | Nothing — needs different permissions |

The name "Unauthorized" is historical; it means **unauthenticated**. See [Authentication vs Authorization](../../network-security/network-security-fundamentals/content.md).

## 502 vs 503 vs 504 (behind a load balancer)

```text
Client ──► Load balancer / reverse proxy ──► Spring Boot backend
502: backend answered with garbage, or closed/reset the connection
503: no healthy backend available (or the backend itself says it is overloaded)
504: backend did not answer before the proxy's timeout
```

These come from the **proxy** about the **upstream**, so the first place to look is the backend's logs and health, then the proxy's timeouts.

## Real World: Spring Boot

| Situation | Status |
|-----------|--------|
| Controller returns an object | 200 |
| `ResponseEntity.created(uri)` | 201 + `Location` |
| `@Valid` fails on `@RequestBody` | 400 (`MethodArgumentNotValidException`) |
| No JWT / invalid JWT (Spring Security) | 401 |
| Valid JWT, missing role | 403 |
| No handler for the path | 404 |
| Wrong method for the path | 405 |
| Uncaught `RuntimeException` | 500 |
| `@ResponseStatus(HttpStatus.CONFLICT)` on a custom exception | 409 |

More: [REST Status Codes in Spring](../../../spring-boot/rest/rest-http-status-codes/content.md).

## Retry Guidance

| Status | Retry? |
|--------|--------|
| 4xx (except 408, 429) | No — fix the request |
| 429 | Yes, after `Retry-After`, with back-off |
| 502, 503, 504 | Yes for idempotent requests, with exponential back-off and jitter |
| 500 | Usually not blindly — it may be a bug that fails every time |

## Common Traps

- **"401 means not authorised to access."** It means not authenticated; 403 is "not allowed".
- **"404 means the server is down."** The server is up and answered; there is just no such resource. A down server gives a connection error or a 502/503/504 from a proxy.
- **"Return 200 with `{"error": …}` in the body."** Clients, caches and monitoring rely on the status code; use the right one.
- **"302 keeps POST as POST."** Browsers historically switch to GET; use 307/308 to preserve the method.

## Interview Follow-up

- *"What is the difference between 502 and 504?"* Bad response vs no response in time from the upstream.
- *"Which status for a duplicate email at sign-up?"* 409 Conflict.

## Key Takeaways

- 1xx info, 2xx success, 3xx redirect, 4xx client error, 5xx server error.
- Know: 200, 201, 204, 301, 302, 304, 307/308, 400, 401, 403, 404, 405, 409, 422, 429, 500, 502, 503, 504.
- 401 = unauthenticated; 403 = authenticated but forbidden.
- 502/503/504 come from proxies about the upstream; retry only idempotent requests with back-off.

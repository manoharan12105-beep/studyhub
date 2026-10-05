# HTTP Methods, Safety, Idempotency and REST

**Module:** HTTP · **Interview priority:** Core

## What Is It?

The **method** in the request line says what the client wants to do with the resource. Two properties classify methods:

- **Safe:** the request does not change server state (read-only).
- **Idempotent:** sending the same request once or many times leaves the server in the **same state**.

| Method | Meaning | Safe | Idempotent | Request body | Typical success |
|--------|---------|------|------------|--------------|-----------------|
| **GET** | Read a resource | ✓ | ✓ | No (undefined) | 200 OK |
| **HEAD** | Same as GET, headers only | ✓ | ✓ | No | 200 OK |
| **OPTIONS** | Which methods/features are supported (CORS preflight) | ✓ | ✓ | Rare | 204 / 200 |
| **POST** | Create a resource, or trigger processing | ✗ | ✗ | Yes | 201 Created / 200 OK |
| **PUT** | Replace the resource at this URL entirely (or create it there) | ✗ | ✓ | Yes | 200 OK / 204 / 201 |
| **PATCH** | Partially modify a resource | ✗ | Not guaranteed | Yes | 200 OK / 204 |
| **DELETE** | Remove the resource | ✗ | ✓ | Rare | 204 No Content / 200 |

## Why It Exists

A small set of methods with agreed meanings lets **every intermediary** understand a request without knowing the application: caches may store `GET` responses, browsers and HTTP clients may automatically **retry** idempotent requests after a network error, and crawlers follow only safe links. Meaning lives in the method, not in URLs like `/deleteOrder?id=7`.

## How It Works

### Idempotency in practice

```text
PUT /api/users/42  {"name":"Asha","city":"Chennai"}     ×3  → user 42 has exactly that state
DELETE /api/orders/7                                     ×3  → order 7 is gone (first 204, later 404 — state unchanged)
POST /api/orders   {"productId":7}                       ×3  → THREE orders created
PATCH /api/accounts/9  {"op":"increment","balance":100}  ×3  → balance +300 (not idempotent)
PATCH /api/users/42    {"city":"Pune"}                   ×3  → same result (this particular PATCH is idempotent)
```

Idempotency is about the **server state**, not the response: a repeated DELETE may return 404, yet it is idempotent.

**Why it matters for networks:** a client sends a request and the connection times out. Did the server process it? For idempotent methods, simply retry. For POST, a retry may **duplicate** the action (two payments). APIs solve this with an **idempotency key** header (e.g. `Idempotency-Key: 7c9e…`): the server remembers keys and returns the original result for a repeat.

### PUT vs PATCH vs POST

| | POST | PUT | PATCH |
|---|------|-----|-------|
| Target URL | A collection (`/orders`) — server chooses the new ID | The resource itself (`/users/42`) — client knows the ID | The resource itself |
| Body | New resource data / command | Full representation | Only the changes |
| Missing fields | — | Become empty/default (full replacement) | Left unchanged |
| Idempotent | No | Yes | Not necessarily |

### HEAD and OPTIONS

- **HEAD** checks existence, size (`Content-Length`) or freshness without downloading the body — used by link checkers and caches.
- **OPTIONS** asks what is allowed. Browsers send an **OPTIONS preflight** before cross-origin requests with non-simple methods or headers (CORS); the server answers with `Access-Control-Allow-*` headers.

## REST over HTTP

**REST** is an architectural style that uses HTTP as intended: resources are nouns identified by URLs, methods are the verbs, status codes report outcomes, and representations (JSON) travel in bodies. A Spring Boot REST controller maps directly onto it:

| HTTP | Spring MVC | Status on success |
|------|------------|-------------------|
| `GET /api/orders` | `@GetMapping("/api/orders")` | 200 with a list |
| `GET /api/orders/7` | `@GetMapping("/api/orders/{id}")` | 200; 404 if missing |
| `POST /api/orders` | `@PostMapping` + `@RequestBody` | 201 + `Location` header |
| `PUT /api/orders/7` | `@PutMapping("/{id}")` | 200 or 204 |
| `PATCH /api/orders/7` | `@PatchMapping("/{id}")` | 200 or 204 |
| `DELETE /api/orders/7` | `@DeleteMapping("/{id}")` | 204 |

Spring-specific details: [REST HTTP Methods](../../../spring-boot/rest/rest-http-methods/content.md) and [REST Principles](../../../spring-boot/rest/rest-principles/content.md).

## Real World

- Load balancers, proxies and HTTP client libraries may **retry** idempotent requests automatically on connection failures — never on POST by default.
- Payment APIs (Stripe-style) require idempotency keys on POST for exactly this reason.
- Caches and CDNs cache GET (and HEAD) responses only.

## Common Traps

> [!WARNING]
> **Common trap:** "Idempotent means the same response every time." It means the same **effect on the server**. `DELETE` returns 204 then 404 and is still idempotent.

- **"Safe and idempotent are the same."** All safe methods are idempotent; PUT and DELETE are idempotent but not safe.
- **"PATCH is idempotent like PUT."** Only if the patch sets values; increments or appends are not.
- **"GET can change data if convenient."** Crawlers, prefetchers and caches will trigger it — unsafe GETs cause real bugs.
- **"POST is for creating, PUT is for updating."** PUT can create at a client-chosen URL; POST can trigger any processing.

## Interview Follow-up

- *"Which methods are idempotent?"* GET, HEAD, OPTIONS, PUT, DELETE (and TRACE). Not POST; PATCH not guaranteed.
- *"How would you make a payment POST safe to retry?"* An idempotency key stored with the result.

## Key Takeaways

- Safe = no state change (GET, HEAD, OPTIONS). Idempotent = repeat has the same effect (safe methods + PUT, DELETE).
- POST creates/processes and is not idempotent; PATCH is not guaranteed to be.
- Idempotency enables safe retries after network failures; POST needs idempotency keys.
- REST maps resources to URLs and actions to methods — exactly how Spring MVC controllers are written.
